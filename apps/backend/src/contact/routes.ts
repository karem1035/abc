import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { count, asc, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { contactSubmissions, faqs } from '../db/schema'
import { authGuard } from '../auth/middleware'
import { recordAudit } from '../lib/audit'
import { normalizePhone } from '../lib/phone'

type AuthEnv = {
  Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } }
}

const contactRouter = new OpenAPIHono<AuthEnv>()

/* ---------------------------------- public --------------------------------- */

const submissionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(20),
  email: z
    .union([z.string().trim().email().max(200), z.literal('')])
    .optional()
    .transform((v) => (v ? v : undefined)),
  type: z.enum(['general', 'appointment', 'complaint', 'insurance', 'other']).optional(),
  otherType: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional().default(''),
})

const submitRoute = createRoute({
  method: 'post',
  path: '/submissions',
  tags: ['contact'],
  summary: 'Submit a contact message (public)',
  request: { body: { content: { 'application/json': { schema: submissionSchema } } } },
  responses: {
    201: {
      content: {
        'application/json': { schema: z.object({ id: z.string().uuid() }) },
      },
      description: 'Received',
    },
    400: { description: 'Invalid input' },
  },
})

contactRouter.openapi(submitRoute, async (c) => {
  const body = c.req.valid('json')

  const phone = normalizePhone(body.phone)
  if (!phone) {
    return c.json({ error: 'Invalid phone number' }, 400)
  }

  if (body.type !== 'other' && body.otherType) {
    return c.json({ error: 'otherType is only allowed when type is "other"' }, 400)
  }

  const [row] = await db
    .insert(contactSubmissions)
    .values({
      name: body.name,
      phone,
      email: body.email ?? null,
      type: body.type ?? 'general',
      otherType: body.type === 'other' ? (body.otherType ?? null) : null,
      message: body.message,
    })
    .returning({ id: contactSubmissions.id })

  return c.json({ id: row.id }, 201)
})

const publicFaqRoute = createRoute({
  method: 'get',
  path: '/faqs',
  tags: ['contact'],
  summary: 'Active FAQs for a page (public)',
  request: {
    query: z.object({
      page: z.string().trim().min(1).default('contact'),
      locale: z.enum(['ar', 'en']).default('ar'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.string().uuid(),
                question: z.string(),
                answer: z.string(),
              }),
            ),
          }),
        },
      },
      description: 'FAQs in the requested locale',
    },
  },
})

contactRouter.openapi(publicFaqRoute, async (c) => {
  const { page, locale } = c.req.valid('query')

  const rows = await db
    .select()
    .from(faqs)
    .where(eq(faqs.page, page))
    .orderBy(asc(faqs.sortOrder), asc(faqs.createdAt))

  return c.json({
    data: rows
      .filter((f) => f.isActive)
      .map((f) => ({
        id: f.id,
        question: locale === 'ar' ? f.questionAr : f.questionEn,
        answer: locale === 'ar' ? f.answerAr : f.answerEn,
      })),
  })
})

/* ---------------------------------- admin ---------------------------------- */

contactRouter.use('/admin/*', authGuard)

const listSubmissionsRoute = createRoute({
  method: 'get',
  path: '/admin/submissions',
  tags: ['contact'],
  summary: 'List contact submissions (admin)',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({ id: z.string().uuid() }).passthrough()),
            page: z.number(),
            limit: z.number(),
            total: z.number(),
          }),
        },
      },
      description: 'Submissions page',
    },
  },
})

contactRouter.openapi(listSubmissionsRoute, async (c) => {
  const { page, limit } = c.req.valid('query')

  const [{ value: total }] = await db.select({ value: count() }).from(contactSubmissions)
  const rows = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return c.json({ data: rows, page, limit, total: Number(total) })
})

const updateSubmissionRoute = createRoute({
  method: 'patch',
  path: '/admin/submissions/:id',
  tags: ['contact'],
  summary: 'Update submission status (admin)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: z.object({ status: z.enum(['new', 'read', 'archived']) }) } },
    },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
})

contactRouter.openapi(updateSubmissionRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')
  const user = c.get('user')

  const [row] = await db
    .update(contactSubmissions)
    .set({ status })
    .where(eq(contactSubmissions.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'update',
    entity: 'contact_submission',
    entityId: id,
    metadata: { status },
  })
  return c.json(row)
})

const adminFaqSchema = z.object({
  page: z.string().trim().min(1).max(50).default('contact'),
  questionAr: z.string().trim().min(2).max(300),
  questionEn: z.string().trim().min(2).max(300),
  answerAr: z.string().trim().min(2).max(3000),
  answerEn: z.string().trim().min(2).max(3000),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

const listFaqsRoute = createRoute({
  method: 'get',
  path: '/admin/faqs',
  tags: ['contact'],
  summary: 'List all FAQs (admin)',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.array(z.object({ id: z.string().uuid() }).passthrough()) }) } },
      description: 'All FAQs',
    },
  },
})

contactRouter.openapi(listFaqsRoute, async (c) => {
  const rows = await db.select().from(faqs).orderBy(asc(faqs.page), asc(faqs.sortOrder))
  return c.json({ data: rows })
})

const createFaqRoute = createRoute({
  method: 'post',
  path: '/admin/faqs',
  tags: ['contact'],
  summary: 'Create a FAQ (admin)',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: adminFaqSchema } } } },
  responses: { 201: { description: 'Created' } },
})

contactRouter.openapi(createFaqRoute, async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')

  const [row] = await db.insert(faqs).values(body).returning()
  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'create',
    entity: 'faq',
    entityId: row.id,
    metadata: { page: row.page },
  })
  return c.json(row, 201)
})

const updateFaqRoute = createRoute({
  method: 'patch',
  path: '/admin/faqs/:id',
  tags: ['contact'],
  summary: 'Update a FAQ (admin)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: adminFaqSchema.partial() } } },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
})

contactRouter.openapi(updateFaqRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')

  const [row] = await db
    .update(faqs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(faqs.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'update',
    entity: 'faq',
    entityId: id,
    metadata: body,
  })
  return c.json(row)
})

const deleteFaqRoute = createRoute({
  method: 'delete',
  path: '/admin/faqs/:id',
  tags: ['contact'],
  summary: 'Delete a FAQ (admin)',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
})

contactRouter.openapi(deleteFaqRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  const [row] = await db.delete(faqs).where(eq(faqs.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'delete',
    entity: 'faq',
    entityId: id,
    metadata: { page: row.page },
  })
  return c.body(null, 204)
})

export default contactRouter
