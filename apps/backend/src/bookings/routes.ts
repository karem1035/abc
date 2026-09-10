import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { bookings, departments, doctors } from '../db/schema'
import { authGuard } from '../auth/middleware'
import { recordAudit } from '../lib/audit'
import { normalizePhone } from '../lib/phone'

type AuthEnv = {
  Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } }
}

const bookingsRouter = new OpenAPIHono<AuthEnv>()

const STATUSES = ['new', 'contacted', 'confirmed', 'declined', 'cancelled', 'completed'] as const

/* ---------------------------------- public --------------------------------- */

const requestSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(20),
  departmentSlug: z.string().trim().max(80).optional(),
  doctorSlug: z.string().trim().max(80).optional(),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD from the slot picker
  time: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM slot
  preferredDate: z.string().trim().max(40).optional(),
  patientNotes: z.string().trim().max(1000).optional(),
})

const createRequestRoute = createRoute({
  method: 'post',
  path: '/requests',
  tags: ['bookings'],
  summary: 'Submit an appointment request (public, homepage hero)',
  request: { body: { content: { 'application/json': { schema: requestSchema } } } },
  responses: {
    201: {
      content: { 'application/json': { schema: z.object({ id: z.string().uuid() }) } },
      description: 'Request received',
    },
    400: { description: 'Invalid input' },
  },
})

bookingsRouter.openapi(createRequestRoute, async (c) => {
  const body = c.req.valid('json')

  const phone = normalizePhone(body.phone)
  if (!phone) return c.json({ error: 'Invalid phone number' }, 400)

  let departmentId: string | null = null
  if (body.departmentSlug) {
    const [dept] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.slug, body.departmentSlug))
      .limit(1)
    departmentId = dept?.id ?? null
  }

  let doctorId: string | null = null
  if (body.doctorSlug) {
    const [doc] = await db
      .select({ id: doctors.id, departmentId: doctors.departmentId })
      .from(doctors)
      .where(eq(doctors.slug, body.doctorSlug))
      .limit(1)
    doctorId = doc?.id ?? null
    if (doc?.departmentId && !departmentId) departmentId = doc.departmentId
  }

  const [row] = await db
    .insert(bookings)
    .values({
      patientName: body.patientName,
      phone,
      source: 'website',
      departmentId,
      doctorId,
      appointmentDate: body.date || null,
      appointmentTime: body.time || null,
      preferredDate: body.preferredDate || null,
      patientNotes: body.patientNotes || null,
      status: 'new',
    })
    .returning({ id: bookings.id })

  // TODO: staff email notification once SMTP is configured
  return c.json({ id: row.id }, 201)
})

/* ---------------------------------- admin ---------------------------------- */

bookingsRouter.use('/admin/*', authGuard)

const bookingResponse = z.object({ id: z.string().uuid() }).passthrough()

const listRoute = createRoute({
  method: 'get',
  path: '/admin/',
  tags: ['bookings'],
  summary: 'List bookings (admin, paginated, filterable)',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      status: z.enum(STATUSES).optional(),
      source: z.enum(['website', 'walk_in', 'phone']).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(bookingResponse),
            page: z.number(),
            limit: z.number(),
            total: z.number(),
          }),
        },
      },
      description: 'Bookings page',
    },
  },
})

bookingsRouter.openapi(listRoute, async (c) => {
  const { page, limit, status, source } = c.req.valid('query')

  const filters = [
    status ? eq(bookings.status, status) : undefined,
    source ? eq(bookings.source, source) : undefined,
  ].filter(Boolean)

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(bookings)
    .where(filters.length ? and(...filters) : undefined)

  const rows = await db
    .select({ booking: bookings, deptNameAr: departments.nameAr, deptNameEn: departments.nameEn, deptSlug: departments.slug })
    .from(bookings)
    .leftJoin(departments, eq(bookings.departmentId, departments.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return c.json({
    data: rows.map(({ booking, deptNameAr, deptNameEn, deptSlug }) => ({
      ...booking,
      departmentSlug: deptSlug,
      departmentNameAr: deptNameAr,
      departmentNameEn: deptNameEn,
    })),
    page,
    limit,
    total: Number(total),
  })
})

const manualSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(20),
  source: z.enum(['walk_in', 'phone']),
  departmentId: z.string().uuid().optional().nullable(),
  appointmentDate: z.string().trim().max(10).optional(),
  appointmentTime: z.string().trim().max(5).optional(),
  staffNotes: z.string().trim().max(2000).optional(),
})

const manualRoute = createRoute({
  method: 'post',
  path: '/admin/manual',
  tags: ['bookings'],
  summary: 'Register a manual entry (walk-in / phone)',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: manualSchema } } } },
  responses: { 201: { description: 'Created' }, 400: { description: 'Invalid input' } },
})

bookingsRouter.openapi(manualRoute, async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')

  const phone = normalizePhone(body.phone)
  if (!phone) return c.json({ error: 'Invalid phone number' }, 400)

  const [row] = await db
    .insert(bookings)
    .values({
      patientName: body.patientName,
      phone,
      source: body.source,
      departmentId: body.departmentId ?? null,
      appointmentDate: body.appointmentDate || null,
      appointmentTime: body.appointmentTime || null,
      staffNotes: body.staffNotes || null,
      status: body.appointmentDate ? 'confirmed' : 'new',
      assignedTo: user.id,
    })
    .returning()

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'create',
    entity: 'booking',
    entityId: row.id,
    metadata: { source: body.source },
  })
  return c.json(row, 201)
})

const updateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  appointmentDate: z.string().trim().max(10).nullable().optional(),
  appointmentTime: z.string().trim().max(5).nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  doctorId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  staffNotes: z.string().trim().max(2000).nullable().optional(),
})

const updateRoute = createRoute({
  method: 'patch',
  path: '/admin/:id',
  tags: ['bookings'],
  summary: 'Update a booking (status, appointment, assignment)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: updateSchema } } },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
})

bookingsRouter.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')

  const [row] = await db
    .update(bookings)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'update',
    entity: 'booking',
    entityId: id,
    metadata: body,
  })
  return c.json(row)
})

export default bookingsRouter
