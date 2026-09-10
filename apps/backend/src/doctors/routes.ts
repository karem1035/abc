import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { bookings, departments, doctorSchedules, doctors } from '../db/schema'

const doctorsRouter = new OpenAPIHono()

function parseHHMM(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

function fmtHHMM(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Expand one schedule rule into concrete slot start times. */
function expandSlots(rules: Array<{ startTime: string; endTime: string; slotMinutes: number }>): string[] {
  const slots: string[] = []
  for (const rule of rules) {
    const step = Math.max(5, rule.slotMinutes)
    for (let t = parseHHMM(rule.startTime); t + step <= parseHHMM(rule.endTime); t += step) {
      slots.push(fmtHHMM(t))
    }
  }
  return [...new Set(slots)].sort()
}

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

const detailRoute = createRoute({
  method: 'get',
  path: '/:slug',
  tags: ['doctors'],
  summary: 'Doctor profile with bio content and weekly schedule (public)',
  request: {
    params: z.object({ slug: z.string() }),
    query: z.object({ locale: z.enum(['ar', 'en']).default('ar') }),
  },
  responses: {
    200: { description: 'Doctor profile' },
    404: { description: 'Not found' },
  },
})

doctorsRouter.openapi(detailRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const { locale } = c.req.valid('query')
  const isAr = locale === 'ar'

  const [row] = await db
    .select({ doctor: doctors, dept: departments })
    .from(doctors)
    .leftJoin(departments, eq(doctors.departmentId, departments.id))
    .where(and(eq(doctors.slug, slug), eq(doctors.status, 'published')))
    .limit(1)
  if (!row) return c.json({ error: 'Not found' }, 404)

  const schedule = await db
    .select()
    .from(doctorSchedules)
    .where(eq(doctorSchedules.doctorId, row.doctor.id))
    .orderBy(asc(doctorSchedules.weekday), asc(doctorSchedules.startTime))

  return c.json({
    data: {
      id: row.doctor.id,
      slug: row.doctor.slug,
      name: isAr ? row.doctor.nameAr : row.doctor.nameEn,
      title: isAr ? row.doctor.titleAr : row.doctor.titleEn,
      photoUrl: row.doctor.photoUrl,
      content: isAr ? row.doctor.contentAr : row.doctor.contentEn,
      departmentSlug: row.dept?.slug ?? null,
      departmentName: row.dept ? (isAr ? row.dept.nameAr : row.dept.nameEn) : null,
      schedule: schedule.map((s) => ({
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        slotMinutes: s.slotMinutes,
      })),
    },
  })
})

const slotsRoute = createRoute({
  method: 'get',
  path: '/:slug/slots',
  tags: ['doctors'],
  summary: 'Bookable time slots for a doctor on a date (public)',
  request: {
    params: z.object({ slug: z.string() }),
    query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ data: z.object({ date: z.string(), slots: z.array(z.string()) }) }),
        },
      },
      description: 'Free slots (HH:MM) for the date',
    },
    404: { description: 'Doctor not found' },
  },
})

doctorsRouter.openapi(slotsRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const { date } = c.req.valid('query')

  const [doctor] = await db
    .select({ id: doctors.id })
    .from(doctors)
    .where(and(eq(doctors.slug, slug), eq(doctors.status, 'published')))
    .limit(1)
  if (!doctor) return c.json({ error: 'Not found' }, 404)

  // weekday of the requested date (local server date arithmetic is fine for slots)
  const weekday = new Date(`${date}T00:00:00`).getDay()

  const rules = await db
    .select()
    .from(doctorSchedules)
    .where(and(eq(doctorSchedules.doctorId, doctor.id), eq(doctorSchedules.weekday, weekday)))

  if (rules.length === 0) return c.json({ data: { date, slots: [] } })

  // hide slots already taken by an active booking on that date
  const taken = await db
    .select({ appointmentTime: bookings.appointmentTime })
    .from(bookings)
    .where(
      and(
        eq(bookings.doctorId, doctor.id),
        eq(bookings.appointmentDate, date),
        inArray(bookings.status, ['new', 'contacted', 'confirmed', 'completed']),
      ),
    )
  const takenSet = new Set(taken.map((b) => b.appointmentTime).filter(Boolean) as string[])

  const slots = expandSlots(rules).filter((s) => !takenSet.has(s))
  return c.json({ data: { date, slots } })
})

export default doctorsRouter
