import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { asc, desc, eq, and, ne } from 'drizzle-orm'
import { db } from '../db/client'
import { departments, doctors } from '../db/schema'
import { authGuard } from '../auth/middleware'
import { recordAudit } from '../lib/audit'

type AuthEnv = {
  Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } }
}

const departmentsRouter = new OpenAPIHono<AuthEnv>()

const localeSchema = z.object({
  locale: z.enum(['ar', 'en']).default('ar'),
})

const publicDepartmentSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  imageUrl: z.string().nullable(),
})

/* ---------------------------------- public --------------------------------- */

const listPublicRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['departments'],
  summary: 'List published departments (public)',
  request: { query: localeSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.array(publicDepartmentSchema) }) } },
      description: 'Published departments in the requested locale',
    },
  },
})

departmentsRouter.openapi(listPublicRoute, async (c) => {
  const { locale } = c.req.valid('query')
  const isAr = locale === 'ar'

  const rows = await db
    .select()
    .from(departments)
    .where(eq(departments.status, 'published'))
    .orderBy(asc(departments.sortOrder), asc(departments.nameEn))

  return c.json({
    data: rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: isAr ? d.nameAr : d.nameEn,
      description: isAr ? d.descriptionAr : d.descriptionEn,
      content: isAr ? d.contentAr : d.contentEn,
      imageUrl: d.imageUrl,
    })),
  })
})

const getPublicRoute = createRoute({
  method: 'get',
  path: '/:slug',
  tags: ['departments'],
  summary: 'Department by slug with its doctors (public)',
  request: {
    params: z.object({ slug: z.string() }),
    query: localeSchema,
  },
  responses: {
    200: { description: 'Department + doctors' },
    404: { description: 'Not found' },
  },
})

departmentsRouter.openapi(getPublicRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const { locale } = c.req.valid('query')
  const isAr = locale === 'ar'

  const [dept] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.slug, slug), eq(departments.status, 'published')))
    .limit(1)
  if (!dept) return c.json({ error: 'Not found' }, 404)

  const docs = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.departmentId, dept.id), eq(doctors.status, 'published')))
    .orderBy(asc(doctors.sortOrder), asc(doctors.nameEn))

  return c.json({
    data: {
      id: dept.id,
      slug: dept.slug,
      name: isAr ? dept.nameAr : dept.nameEn,
      description: isAr ? dept.descriptionAr : dept.descriptionEn,
      content: isAr ? dept.contentAr : dept.contentEn,
      imageUrl: dept.imageUrl,
      doctors: docs.map((doc) => ({
        id: doc.id,
        slug: doc.slug,
        name: isAr ? doc.nameAr : doc.nameEn,
        title: isAr ? doc.titleAr : doc.titleEn,
        photoUrl: doc.photoUrl,
      })),
    },
  })
})

/* ---------------------------------- admin ---------------------------------- */

departmentsRouter.use('/admin/*', authGuard)

const adminDepartmentSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes only'),
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  descriptionAr: z.string().trim().max(400).optional(),
  descriptionEn: z.string().trim().max(400).optional(),
  contentAr: z.string().optional(),
  contentEn: z.string().optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
})

const listAdminRoute = createRoute({
  method: 'get',
  path: '/admin/',
  tags: ['departments'],
  summary: 'List all departments (admin)',
  security: [{ Bearer: [] }],
  responses: {
    200: { description: 'All departments with doctor counts' },
  },
})

departmentsRouter.openapi(listAdminRoute, async (c) => {
  const rows = await db
    .select()
    .from(departments)
    .orderBy(asc(departments.sortOrder), asc(departments.nameEn))

  const docs = await db.select().from(doctors)
  return c.json({
    data: rows.map((d) => ({
      ...d,
      doctorsCount: docs.filter((doc) => doc.departmentId === d.id).length,
    })),
  })
})

const createRouteDef = createRoute({
  method: 'post',
  path: '/admin/',
  tags: ['departments'],
  summary: 'Create a department (admin)',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: adminDepartmentSchema } } } },
  responses: { 201: { description: 'Created' }, 409: { description: 'Slug taken' } },
})

departmentsRouter.openapi(createRouteDef, async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')

  const existing = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.slug, body.slug))
    .limit(1)
  if (existing.length > 0) return c.json({ error: 'Slug already exists' }, 409)

  const [row] = await db
    .insert(departments)
    .values({ ...body, imageUrl: body.imageUrl || null })
    .returning()

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'create',
    entity: 'department',
    entityId: row.id,
    metadata: { slug: row.slug },
  })
  return c.json(row, 201)
})

const updateRouteDef = createRoute({
  method: 'patch',
  path: '/admin/:id',
  tags: ['departments'],
  summary: 'Update a department (admin)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: adminDepartmentSchema.partial() } } },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' }, 409: { description: 'Slug taken' } },
})

departmentsRouter.openapi(updateRouteDef, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')

  if (body.slug) {
    const clash = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.slug, body.slug), ne(departments.id, id)))
      .limit(1)
    if (clash.length > 0) return c.json({ error: 'Slug already exists' }, 409)
  }

  const [row] = await db
    .update(departments)
    .set({
      ...body,
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'update',
    entity: 'department',
    entityId: id,
    metadata: body,
  })
  return c.json(row)
})

const deleteRouteDef = createRoute({
  method: 'delete',
  path: '/admin/:id',
  tags: ['departments'],
  summary: 'Delete a department (admin)',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
})

departmentsRouter.openapi(deleteRouteDef, async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  const [row] = await db.delete(departments).where(eq(departments.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'delete',
    entity: 'department',
    entityId: id,
    metadata: { slug: row.slug },
  })
  return c.body(null, 204)
})

/* --------------------------- admin: doctors (minimal) -------------------------- */

const adminDoctorSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes only'),
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  titleAr: z.string().trim().max(160).optional(),
  titleEn: z.string().trim().max(160).optional(),
  photoUrl: z.string().trim().url().optional().or(z.literal('')),
  departmentId: z.string().uuid().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
})

const listDoctorsRoute = createRoute({
  method: 'get',
  path: '/admin/doctors',
  tags: ['departments'],
  summary: 'List all doctors (admin)',
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'All doctors' } },
})

departmentsRouter.openapi(listDoctorsRoute, async (c) => {
  const rows = await db
    .select()
    .from(doctors)
    .orderBy(asc(doctors.sortOrder), asc(doctors.nameEn))
  const depts = await db.select().from(departments)
  return c.json({
    data: rows.map((doc) => ({
      ...doc,
      departmentName: depts.find((d) => d.id === doc.departmentId)?.nameAr ?? null,
    })),
  })
})

const createDoctorRoute = createRoute({
  method: 'post',
  path: '/admin/doctors',
  tags: ['departments'],
  summary: 'Create a doctor (admin)',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: adminDoctorSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: z.object({ id: z.string().uuid() }).passthrough() } },
      description: 'Created',
    },
    409: { description: 'Slug taken' },
  },
})

departmentsRouter.openapi(createDoctorRoute, async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')

  const existing = await db
    .select({ id: doctors.id })
    .from(doctors)
    .where(eq(doctors.slug, body.slug))
    .limit(1)
  if (existing.length > 0) return c.json({ error: 'Slug already exists' }, 409)

  const [row] = await db
    .insert(doctors)
    .values({ ...body, photoUrl: body.photoUrl || null, departmentId: body.departmentId ?? null })
    .returning()

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'create',
    entity: 'doctor',
    entityId: row.id,
    metadata: { slug: row.slug },
  })
  return c.json(row, 201)
})

const updateDoctorRoute = createRoute({
  method: 'patch',
  path: '/admin/doctors/:id',
  tags: ['departments'],
  summary: 'Update a doctor (admin)',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: adminDoctorSchema.partial() } } },
  },
  responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' }, 409: { description: 'Slug taken' } },
})

departmentsRouter.openapi(updateDoctorRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')

  if (body.slug) {
    const clash = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(and(eq(doctors.slug, body.slug), ne(doctors.id, id)))
      .limit(1)
    if (clash.length > 0) return c.json({ error: 'Slug already exists' }, 409)
  }

  const [row] = await db
    .update(doctors)
    .set({
      ...body,
      ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
      ...(body.departmentId !== undefined ? { departmentId: body.departmentId ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'update',
    entity: 'doctor',
    entityId: id,
    metadata: body,
  })
  return c.json(row)
})

const deleteDoctorRoute = createRoute({
  method: 'delete',
  path: '/admin/doctors/:id',
  tags: ['departments'],
  summary: 'Delete a doctor (admin)',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
})

departmentsRouter.openapi(deleteDoctorRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  const [row] = await db.delete(doctors).where(eq(doctors.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)

  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'delete',
    entity: 'doctor',
    entityId: id,
    metadata: { slug: row.slug },
  })
  return c.body(null, 204)
})

export default departmentsRouter
