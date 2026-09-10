import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { posts } from '../db/schema'
import { authGuard, requireRoles } from '../auth/middleware'
import { recordAudit } from '../lib/audit'
import { postInput } from './validation'

type Env = { Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } } }
const router = new OpenAPIHono<Env>()
const localeQuery = z.object({ locale: z.enum(['ar', 'en']).default('ar') })
const slugParam = z.object({ slug: z.string().max(100) })
const idParam = z.object({ id: z.string().uuid() })
const pageQuery = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(50).default(12) })
function localize(p: typeof posts.$inferSelect, locale: 'ar' | 'en', detail = false) {
  const ar = locale === 'ar'
  return { id: p.id, slug: p.slug, type: p.type, title: ar ? p.titleAr : p.titleEn, excerpt: ar ? p.excerptAr : p.excerptEn,
    category: ar ? p.categoryAr : p.categoryEn, author: ar ? p.authorAr : p.authorEn,
    coverUrl: p.coverUrl, isFeatured: p.isFeatured, publishedAt: p.publishedAt, updatedAt: p.updatedAt,
    ...(detail ? { content: ar ? p.contentAr : p.contentEn, seoTitle: ar ? p.seoTitleAr : p.seoTitleEn,
      seoDescription: ar ? p.seoDescriptionAr : p.seoDescriptionEn } : {}) }
}
router.openapi(createRoute({ method: 'get', path: '/', tags: ['posts'], summary: 'Published articles and news', request: { query: pageQuery.merge(localeQuery).extend({ type: z.enum(['article','news']).optional(), q: z.string().trim().max(100).optional(), category: z.string().max(100).optional() }) }, responses: { 200: { description: 'Paginated localized posts' } } }), async (c) => {
  const { locale, page, limit, type, q, category } = c.req.valid('query')
  const clauses: SQL[] = [eq(posts.status, 'published')]
  if (type) clauses.push(eq(posts.type, type))
  if (category) clauses.push(eq(locale === 'ar' ? posts.categoryAr : posts.categoryEn, category))
  if (q) clauses.push(or(ilike(locale === 'ar' ? posts.titleAr : posts.titleEn, `%${q}%`), ilike(locale === 'ar' ? posts.excerptAr : posts.excerptEn, `%${q}%`))!)
  const where = and(...clauses)
  const [rows, [total]] = await Promise.all([db.select().from(posts).where(where).orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit).offset((page-1)*limit), db.select({ count: sql<number>`count(*)::int` }).from(posts).where(where)])
  return c.json({ data: rows.map((p) => localize(p, locale)), total: total.count, page, limit })
})

// Admin routes precede /:slug and protect reads as well as writes.
router.openapi(createRoute({ method:'get', path:'/featured', tags:['posts'], summary:'Featured posts (up to 4, public)', request:{query:localeQuery}, responses:{200:{description:'Featured posts'}} }), async c => {
  const {locale}=c.req.valid('query')
  const rows=await db.select().from(posts).where(and(eq(posts.status,'published'),eq(posts.isFeatured,true))).orderBy(desc(posts.publishedAt)).limit(4)
  return c.json({data:rows.map(p=>localize(p,locale))})
})

// Admin routes precede /:slug and protect reads as well as writes.
router.use('/admin/*', authGuard, requireRoles(['admin', 'marketer']))
router.openapi(createRoute({ method:'get', path:'/admin/', tags:['posts'], security:[{Bearer:[]}], request:{query:pageQuery.extend({q:z.string().max(100).optional()})}, responses:{200:{description:'Editorial list'}} }), async c => {
  const {page,limit,q}=c.req.valid('query')
  const where=q ? or(ilike(posts.titleAr, `%${q}%`),ilike(posts.titleEn, `%${q}%`)) : undefined
  const [data,[count]]=await Promise.all([db.select().from(posts).where(where).orderBy(desc(posts.updatedAt)).limit(limit).offset((page-1)*limit),db.select({count:sql<number>`count(*)::int`}).from(posts).where(where)])
  return c.json({data,total:count.count,page,limit})
})
router.openapi(createRoute({method:'get',path:'/admin/:id',tags:['posts'],security:[{Bearer:[]}],request:{params:idParam},responses:{200:{description:'Editor record'},404:{description:'Missing'}}}),async c=>{
  const [post]=await db.select().from(posts).where(eq(posts.id,c.req.valid('param').id)).limit(1)
  return post ? c.json(post) : c.json({error:'Not found'},404)
})
for (const method of ['post','put'] as const) {
  router.openapi(createRoute({method,path:method==='post'?'/admin/':'/admin/:id',tags:['posts'],security:[{Bearer:[]}],request:{...(method==='put'?{params:idParam}:{}),body:{content:{'application/json':{schema:postInput}}}},responses:{200:{description:'Saved'},404:{description:'Missing'},409:{description:'Duplicate slug'}}}),async c=>{
    const body=c.req.valid('json'); const id=method==='put'?c.req.param('id'):undefined
    const [existing]= id ? await db.select().from(posts).where(eq(posts.id,id)).limit(1) : []
    if(id&&!existing)return c.json({error:'Not found'},404)
    // keep at most 4 featured posts
    if(body.isFeatured && !existing?.isFeatured){
      const [featuredCount]=await db.select({count:sql<number>`count(*)::int`}).from(posts).where(eq(posts.isFeatured,true))
      if(featuredCount.count>=4)return c.json({error:'Featured limit reached (4). Unfeature another post first.'},409)
    }
    const values={...body,coverUrl:body.coverUrl||null,publishedAt:body.status==='published'?(existing?.publishedAt??new Date()):(existing?.publishedAt??null),updatedAt:new Date()}
    try {
      const [row]=id ? await db.update(posts).set(values).where(eq(posts.id,id)).returning() : await db.insert(posts).values(values).returning()
      const user=c.get('user'); await recordAudit({actorId:user.id,actorUsername:user.username,action:id?'update':'create',entity:'post',entityId:row.id,metadata:{slug:row.slug,status:row.status}})
      return c.json(row)
    } catch(error) {
      const err=error as {code?:string;cause?:{code?:string}}
      if(err.code==='23505'||err.cause?.code==='23505')return c.json({error:'Slug already exists'},409)
      throw error
    }
  })
}
router.openapi(createRoute({method:'delete',path:'/admin/:id',tags:['posts'],security:[{Bearer:[]}],request:{params:idParam},responses:{200:{description:'Deleted'},404:{description:'Missing'}}}),async c=>{
  const {id}=c.req.valid('param'); const [row]=await db.delete(posts).where(eq(posts.id,id)).returning()
  if(!row)return c.json({error:'Not found'},404)
  const user=c.get('user'); await recordAudit({actorId:user.id,actorUsername:user.username,action:'delete',entity:'post',entityId:id,metadata:{slug:row.slug}})
  return c.json({ok:true})
})
router.openapi(createRoute({method:'get',path:'/:slug',tags:['posts'],request:{params:slugParam,query:localeQuery},responses:{200:{description:'Published detail'},404:{description:'Missing'}}}),async c=>{
  const [post]=await db.select().from(posts).where(and(eq(posts.slug,c.req.valid('param').slug),eq(posts.status,'published'))).limit(1)
  return post?c.json({data:localize(post,c.req.valid('query').locale,true)}):c.json({error:'Not found'},404)
})
export default router
