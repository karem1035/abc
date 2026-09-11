import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { db } from '../db/client'
import { authGuard } from '../auth/middleware'

type AuthEnv = {
  Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } }
}

const statsRouter = new OpenAPIHono<AuthEnv>()
statsRouter.use('*', authGuard)

const statsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['stats'],
  summary: 'Dashboard overview stats (role-aware)',
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Counts and time series' } },
})

statsRouter.openapi(statsRoute, async (c) => {
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    return d.toISOString().slice(0, 10)
  }

  // bookings per day, last 14 days
  const bookingsSeries = await db.execute(sql`
    select to_char(created_at::date, 'YYYY-MM-DD') as date, count(*)::int as count
    from bookings
    where created_at >= now() - interval '13 days'
    group by 1
  `)

  const [statusRows, sourceRows, bookingTotals] = await Promise.all([
    db.execute(sql`select status, count(*)::int as count from bookings group by 1`),
    db.execute(sql`select source, count(*)::int as count from bookings group by 1`),
    db.execute(sql`
      select count(*)::int as total,
             count(*) filter (where status = 'new')::int as "new",
             count(*) filter (where status = 'confirmed')::int as confirmed,
             count(*) filter (where created_at >= now() - interval '7 days')::int as last7
      from bookings
    `),
  ])

  const [contactTotals] = (await db.execute(sql`
    select count(*)::int as total,
           count(*) filter (where status = 'new')::int as "new",
           count(*) filter (where created_at >= now() - interval '7 days')::int as last7
    from contact_submissions
  `)) as unknown as Array<{ total: number; new: number; last7: number }>

  const [contentTotals] = (await db.execute(sql`
    select
      (select count(*) from doctors where status = 'published')::int as doctors,
      (select count(*) from departments where status = 'published')::int as departments,
      (select count(*) from posts where status = 'published')::int as posts,
      (select count(*) from faqs where is_active)::int as faqs
  `)) as unknown as Array<{ doctors: number; departments: number; posts: number; faqs: number }>

  // fill the 14-day series with zero days
  const countsByDate = new Map<string, number>()
  for (const row of bookingsSeries as unknown as Array<{ date: string; count: number }>) {
    countsByDate.set(row.date, row.count)
  }
  const series = Array.from({ length: 14 }, (_, i) => {
    const date = day(13 - i)
    return { date, bookings: countsByDate.get(date) ?? 0 }
  })

  return c.json({
    bookings: {
      ...((bookingTotals as unknown as Array<object>)[0] ?? {}),
      byStatus: statusRows as unknown as Array<Record<string, unknown>>,
      bySource: sourceRows as unknown as Array<Record<string, unknown>>,
      series,
    },
    contacts: contactTotals,
    content: contentTotals,
  })
})

export default statsRouter
