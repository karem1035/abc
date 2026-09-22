import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { postCategories } from '../db/schema'
import { authGuard, requireRoles } from '../auth/middleware'
import { recordAudit } from '../lib/audit'
import { slugSchema, slugify, uniqueSlug } from '../lib/slug'

type Env = { Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } } }
const router = new OpenAPIHono<Env>()

const idParam = z.object({ id: z.string().uuid() })

const categoryInput = z.object({
  nameAr: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().min(1).max(100),
  slug: slugSchema,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
})


/* ---------------------------------- public --------------------------------- */

router.openapi(createRoute({
  method: 'get', path: '/', tags: ['post-categories'],
  summary: 'List post categories (public)',
  request: { query: z.object({ locale: z.enum(['ar', 'en']).default('ar') }) },
  responses: { 200: { description: 'Categories, sorted by sortOrder then name' } },
}), async (c) => {
  const { locale } = c.req.valid('query')
  const rows = await db.select().from(postCategories).orderBy(asc(postCategories.sortOrder), asc(locale === 'ar' ? postCategories.nameAr : postCategories.nameEn))
  return c.json({ data: rows.map((r) => ({ id: r.id, slug: r.slug, name: locale === 'ar' ? r.nameAr : r.nameEn, nameAr: r.nameAr, nameEn: r.nameEn, sortOrder: r.sortOrder })) })
})

/* ---------------------------------- admin ---------------------------------- */

router.use('/admin/*', authGuard, requireRoles(['admin', 'marketer']))

router.openapi(createRoute({
  method: 'get', path: '/admin/', tags: ['post-categories'],
  summary: 'List post categories (admin)',
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'All categories' } },
}), async (c) => {
  const rows = await db.select().from(postCategories).orderBy(asc(postCategories.sortOrder), asc(postCategories.nameAr))
  return c.json({ data: rows })
})

router.openapi(createRoute({
  method: 'post', path: '/admin/', tags: ['post-categories'],
  summary: 'Create a post category',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: categoryInput } } } },
  responses: { 201: { description: 'Created' }, 400: { description: 'Invalid input' }, 409: { description: 'Duplicate name or slug' } },
}), async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')

  const [dupe] = await db.select({ id: postCategories.id }).from(postCategories)
    .where(eq(postCategories.nameAr, body.nameAr)).limit(1)
  if (dupe) return c.json({ error: 'Arabic name already exists' }, 409)

  const slug = body.slug?.trim() ? body.slug : await uniqueSlug(
    slugify(body.nameEn),
    async (candidate) => (await db.select({ id: postCategories.id }).from(postCategories).where(eq(postCategories.slug, candidate)).limit(1)).length > 0,
  )
  try {
    const [row] = await db.insert(postCategories).values({ ...body, slug }).returning()
    await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'create', entity: 'post_category', entityId: row.id, metadata: { slug } })
    return c.json(row, 201)
  } catch {
    return c.json({ error: 'Slug already exists' }, 409)
  }
})

router.openapi(createRoute({
  method: 'put', path: '/admin/:id', tags: ['post-categories'],
  summary: 'Update a post category',
  security: [{ Bearer: [] }],
  request: { params: idParam, body: { content: { 'application/json': { schema: categoryInput } } } },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Missing' }, 409: { description: 'Duplicate' } },
}), async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')

  const [existing] = await db.select().from(postCategories).where(eq(postCategories.id, id)).limit(1)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const [dupe] = await db.select({ id: postCategories.id }).from(postCategories)
    .where(eq(postCategories.nameAr, body.nameAr)).limit(1)
  if (dupe && dupe.id !== id) return c.json({ error: 'Arabic name already exists' }, 409)

  const slug = body.slug?.trim() ? body.slug : existing.slug
  try {
    const [row] = await db.update(postCategories).set({ ...body, slug, updatedAt: new Date() }).where(eq(postCategories.id, id)).returning()
    await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'update', entity: 'post_category', entityId: id, metadata: { slug } })
    return c.json(row)
  } catch {
    return c.json({ error: 'Slug already exists' }, 409)
  }
})

router.openapi(createRoute({
  method: 'delete', path: '/admin/:id', tags: ['post-categories'],
  summary: 'Delete a post category (posts keep existing, category becomes unset)',
  security: [{ Bearer: [] }],
  request: { params: idParam },
  responses: { 200: { description: 'Deleted' }, 404: { description: 'Missing' } },
}), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')
  const [row] = await db.delete(postCategories).where(eq(postCategories.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'delete', entity: 'post_category', entityId: id, metadata: { slug: row.slug } })
  return c.json({ ok: true })
})

export default router
