import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { rateLimiter } from 'hono-rate-limiter'
import { db } from '../db/client'
import { posts, postComments } from '../db/schema'
import { authGuard, requireRoles } from '../auth/middleware'
import { recordAudit } from '../lib/audit'
import { postInput, commentInput } from './validation'

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
    coverUrl: p.coverUrl, publishedAt: p.publishedAt, updatedAt: p.updatedAt,
    ...(detail ? { content: ar ? p.contentAr : p.contentEn, seoTitle: ar ? p.seoTitleAr : p.seoTitleEn,
      seoDescription: ar ? p.seoDescriptionAr : p.seoDescriptionEn, commentsEnabled: p.commentsEnabled } : {}) }
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
router.use('/admin/*', authGuard, requireRoles(['admin', 'marketer']))
router.openapi(createRoute({ method:'get', path:'/admin/', tags:['posts'], security:[{Bearer:[]}], request:{query:pageQuery.extend({q:z.string().max(100).optional()})}, responses:{200:{description:'Editorial list'}} }), async c => {
  const {page,limit,q}=c.req.valid('query')
  const where=q ? or(ilike(posts.titleAr, `%${q}%`),ilike(posts.titleEn, `%${q}%`)) : undefined
  const [data,[count]]=await Promise.all([db.select().from(posts).where(where).orderBy(desc(posts.updatedAt)).limit(limit).offset((page-1)*limit),db.select({count:sql<number>`count(*)::int`}).from(posts).where(where)])
  return c.json({data,total:count.count,page,limit})
})
router.openapi(createRoute({method:'get',path:'/admin/comments',tags:['posts'],security:[{Bearer:[]}],request:{query:pageQuery.extend({status:z.enum(['pending','approved','rejected']).default('pending')})},responses:{200:{description:'Moderation queue'}}}),async c=>{
  const {page,limit,status}=c.req.valid('query')
  const where=eq(postComments.status,status)
  const [data,[count]]=await Promise.all([db.select({id:postComments.id,postId:postComments.postId,name:postComments.name,body:postComments.body,status:postComments.status,locale:postComments.locale,createdAt:postComments.createdAt,titleAr:posts.titleAr,titleEn:posts.titleEn}).from(postComments).innerJoin(posts,eq(posts.id,postComments.postId)).where(where).orderBy(desc(postComments.createdAt)).limit(limit).offset((page-1)*limit),db.select({count:sql<number>`count(*)::int`}).from(postComments).where(where)])
  return c.json({data,total:count.count,page,limit})
})
router.openapi(createRoute({method:'patch',path:'/admin/comments/:id',tags:['posts'],security:[{Bearer:[]}],request:{params:idParam,body:{content:{'application/json':{schema:z.object({status:z.enum(['pending','approved','rejected'])})}}}},responses:{200:{description:'Moderated'},404:{description:'Missing'}}}),async c=>{
  const {id}=c.req.valid('param'); const {status}=c.req.valid('json')
  const [row]=await db.update(postComments).set({status}).where(eq(postComments.id,id)).returning()
  if(!row)return c.json({error:'Not found'},404)
  const user=c.get('user'); await recordAudit({actorId:user.id,actorUsername:user.username,action:'update',entity:'post_comment',entityId:id,metadata:{status}})
  return c.json(row)
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
router.openapi(createRoute({method:'get',path:'/:slug/comments',tags:['posts'],request:{params:slugParam,query:pageQuery.merge(localeQuery)},responses:{200:{description:'Approved comments'},404:{description:'Missing'}}}),async c=>{
  const {locale,page,limit}=c.req.valid('query')
  const [post]=await db.select().from(posts).where(and(eq(posts.slug,c.req.valid('param').slug),eq(posts.status,'published'))).limit(1)
  if(!post)return c.json({error:'Not found'},404)
  if(!post.commentsEnabled)return c.json({data:[],total:0,page,limit})
  const where=and(eq(postComments.postId,post.id),eq(postComments.status,'approved'),eq(postComments.locale,locale))
  const [data,[count]]=await Promise.all([db.select({id:postComments.id,name:postComments.name,body:postComments.body,createdAt:postComments.createdAt}).from(postComments).where(where).orderBy(desc(postComments.createdAt)).limit(limit).offset((page-1)*limit),db.select({count:sql<number>`count(*)::int`}).from(postComments).where(where)])
  return c.json({data,total:count.count,page,limit})
})
router.use('/:slug/comments',rateLimiter({windowMs:60000,limit:5,keyGenerator:c=>c.req.header('x-forwarded-for')??'anonymous-comments',skip:c=>c.req.method!=='POST'}))
router.openapi(createRoute({method:'post',path:'/:slug/comments',tags:['posts'],request:{params:slugParam,body:{content:{'application/json':{schema:commentInput}}}},responses:{201:{description:'Awaiting moderation'},404:{description:'Unavailable'}}}),async c=>{
  const body=c.req.valid('json')
  // Lock the post while checking publication/comment settings and inserting.
  const saved=await db.transaction(async tx=>{
    const [post]=await tx.select().from(posts).where(and(eq(posts.slug,c.req.valid('param').slug),eq(posts.status,'published'),eq(posts.commentsEnabled,true))).limit(1).for('share')
    if(!post)return false
    await tx.insert(postComments).values({postId:post.id,name:body.name,body:body.body,locale:body.locale})
    return true
  })
  return saved?c.json({status:'pending'},201):c.json({error:'Comments are unavailable'},404)
})
export default router
