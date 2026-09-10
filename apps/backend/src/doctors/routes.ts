import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { departments, doctors } from '../db/schema'

const doctorsRouter = new OpenAPIHono()

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['doctors'],
  summary: 'List published doctors (public), optional department filter',
  request: {
    query: z.object({
      locale: z.enum(['ar', 'en']).default('ar'),
      dept: z.string().optional(), // department slug
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
                slug: z.string(),
                name: z.string(),
                title: z.string().nullable(),
                photoUrl: z.string().nullable(),
                departmentSlug: z.string().nullable(),
                departmentName: z.string().nullable(),
              }),
            ),
          }),
        },
      },
      description: 'Doctors in the requested locale',
    },
  },
})

doctorsRouter.openapi(listRoute, async (c) => {
  const { locale, dept } = c.req.valid('query')
  const isAr = locale === 'ar'

  const rows = await db
    .select({ doctor: doctors, dept: departments })
    .from(doctors)
    .leftJoin(departments, eq(doctors.departmentId, departments.id))
    .where(and(eq(doctors.status, 'published'), dept ? eq(departments.slug, dept) : undefined))
    .orderBy(asc(doctors.sortOrder), asc(doctors.nameEn))

  return c.json({
    data: rows.map(({ doctor, dept: d }) => ({
      id: doctor.id,
      slug: doctor.slug,
      name: isAr ? doctor.nameAr : doctor.nameEn,
      title: isAr ? doctor.titleAr : doctor.titleEn,
      photoUrl: doctor.photoUrl,
      departmentSlug: d?.slug ?? null,
      departmentName: d ? (isAr ? d.nameAr : d.nameEn) : null,
    })),
  })
})

export default doctorsRouter
