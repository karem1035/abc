import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, asc, eq, ne } from 'drizzle-orm'
import { db } from '../db/client'
import { insurancePartners, pages } from '../db/schema'
import { authGuard } from '../auth/middleware'
import { recordAudit } from '../lib/audit'

type AuthEnv = {
  Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } }
}

const contentRouter = new OpenAPIHono<AuthEnv>()

/* ------------------------------- public: partners ------------------------------ */

const partnersListRoute = createRoute({
  method: 'get',
  path: '/partners',
  tags: ['content'],
  summary: 'Active insurance & corporate partners (public)',
  request: { query: z.object({ locale: z.enum(['ar', 'en']).default('ar') }) },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.string().uuid(),
                name: z.string(),
                category: z.string(),
                logoUrl: z.string().nullable(),
                websiteUrl: z.string().nullable(),
              }),
            ),
          }),
        },
      },
      description: 'Active partners in the requested locale',
    },
  },
})

contentRouter.openapi(partnersListRoute, async (c) => {
  const { locale } = c.req.valid('query')
  const isAr = locale === 'ar'

  const rows = await db
    .select()
    .from(insurancePartners)
    .where(eq(insurancePartners.isActive, true))
    .orderBy(asc(insurancePartners.sortOrder), asc(insurancePartners.nameEn))

  return c.json({
    data: rows.map((p) => ({
      id: p.id,
      name: isAr ? p.nameAr : p.nameEn,
      category: p.category,
      logoUrl: p.logoUrl,
      websiteUrl: p.websiteUrl,
    })),
  })
})

/* ------------------------------- public: pages --------------------------------- */

const pageRoute = createRoute({
  method: 'get',
  path: '/pages/:slug',
  tags: ['content'],
  summary: 'Published CMS page by slug (public)',
  request: {
    params: z.object({ slug: z.string() }),
    query: z.object({ locale: z.enum(['ar', 'en']).default('ar') }),
  },
  responses: { 200: { description: 'Page' }, 404: { description: 'Not found' } },
})

contentRouter.openapi(pageRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const { locale } = c.req.valid('query')
  const isAr = locale === 'ar'

  const [row] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.isPublished, true)))
    .limit(1)
  if (!row) return c.json({ error: 'Not found' }, 404)

  return c.json({
    data: {
      slug: row.slug,
      title: isAr ? row.titleAr : row.titleEn,
      content: isAr ? row.contentAr : row.contentEn,
      updatedAt: row.updatedAt,
    },
  })
})

/* ---------------------------------- admin ---------------------------------- */

contentRouter.use('/admin/*', authGuard)

const partnerSchema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  category: z.enum(['insurance', 'company', 'authority']).default('insurance'),
  logoUrl: z.string().trim().url().optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

const listPartnersRoute = createRoute({
  method: 'get',
  path: '/admin/partners',
  tags: ['content'],
  summary: 'List all partners (admin)',
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'All partners' } },
})

contentRouter.openapi(listPartnersRoute, async (c) => {
  const rows = await db
    .select()
    .from(insurancePartners)
    .orderBy(asc(insurancePartners.sortOrder), asc(insurancePartners.nameEn))
  return c.json({ data: rows })
})

const createPartnerRoute = createRoute({
  method: 'post',
  path: '/admin/partners',
  tags: ['content'],
  summary: 'Create a partner (admin)',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: partnerSchema } } } },
  responses: { 201: { description: 'Created' } },
})

contentRouter.openapi(createPartnerRoute, async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')
  const [row] = await db
    .insert(insurancePartners)
    .values({ ...body, logoUrl: body.logoUrl || null, websiteUrl: body.websiteUrl || null })
    .returning()
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'create', entity: 'insurance_partner', entityId: row.id, metadata: { nameAr: row.nameAr } })
  return c.json(row, 201)
})

const updatePartnerRoute = createRoute({
  method: 'patch',
  path: '/admin/partners/:id',
  tags: ['content'],
  summary: 'Update a partner (admin)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: partnerSchema.partial() } } },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
})

contentRouter.openapi(updatePartnerRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')
  const [row] = await db
    .update(insurancePartners)
    .set({
      ...body,
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
      ...(body.websiteUrl !== undefined ? { websiteUrl: body.websiteUrl || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(insurancePartners.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'update', entity: 'insurance_partner', entityId: id, metadata: body })
  return c.json(row)
})

const deletePartnerRoute = createRoute({
  method: 'delete',
  path: '/admin/partners/:id',
  tags: ['content'],
  summary: 'Delete a partner (admin)',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
})

contentRouter.openapi(deletePartnerRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')
  const [row] = await db.delete(insurancePartners).where(eq(insurancePartners.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'delete', entity: 'insurance_partner', entityId: id, metadata: { nameAr: row.nameAr } })
  return c.body(null, 204)
})

const pageSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  titleAr: z.string().trim().min(2).max(160),
  titleEn: z.string().trim().min(2).max(160),
  contentAr: z.string().optional(),
  contentEn: z.string().optional(),
  isPublished: z.boolean().default(true),
})

const listPagesRoute = createRoute({
  method: 'get',
  path: '/admin/pages',
  tags: ['content'],
  summary: 'List all CMS pages (admin)',
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'All pages' } },
})

contentRouter.openapi(listPagesRoute, async (c) => {
  const rows = await db.select().from(pages).orderBy(asc(pages.slug))
  return c.json({ data: rows })
})

const createPageRoute = createRoute({
  method: 'post',
  path: '/admin/pages',
  tags: ['content'],
  summary: 'Create a CMS page (admin)',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: pageSchema } } } },
  responses: { 201: { description: 'Created' }, 409: { description: 'Slug taken' } },
})

contentRouter.openapi(createPageRoute, async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')
  const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, body.slug)).limit(1)
  if (existing.length > 0) return c.json({ error: 'Slug already exists' }, 409)
  const [row] = await db.insert(pages).values(body).returning()
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'create', entity: 'page', entityId: row.id, metadata: { slug: row.slug } })
  return c.json(row, 201)
})

const updatePageRoute = createRoute({
  method: 'patch',
  path: '/admin/pages/:id',
  tags: ['content'],
  summary: 'Update a CMS page (admin)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: pageSchema.partial() } } },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' }, 409: { description: 'Slug taken' } },
})

contentRouter.openapi(updatePageRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')
  if (body.slug) {
    const clash = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.slug, body.slug), ne(pages.id, id))).limit(1)
    if (clash.length > 0) return c.json({ error: 'Slug already exists' }, 409)
  }
  const [row] = await db.update(pages).set({ ...body, updatedAt: new Date() }).where(eq(pages.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'update', entity: 'page', entityId: id, metadata: body })
  return c.json(row)
})

const deletePageRoute = createRoute({
  method: 'delete',
  path: '/admin/pages/:id',
  tags: ['content'],
  summary: 'Delete a CMS page (admin)',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
})

contentRouter.openapi(deletePageRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')
  const [row] = await db.delete(pages).where(eq(pages.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  await recordAudit({ actorId: user.id, actorUsername: user.username, action: 'delete', entity: 'page', entityId: id, metadata: { slug: row.slug } })
  return c.body(null, 204)
})

export default contentRouter
