import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, count, desc, eq, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { auditLogs } from '../db/schema'
import { authGuard, requireRole } from '../auth/middleware'
import type { UserRole } from '../env'

type AuthEnv = { Variables: { user: { id: string; username: string; role: UserRole } } }

const audit = new OpenAPIHono<AuthEnv>()

audit.use('*', authGuard)
audit.use('*', requireRole('admin'))

const auditLogSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  actorUsername: z.string().nullable(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string().nullable(),
  metadata: z.record(z.unknown()),
  ip: z.string().nullable(),
  createdAt: z.string(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  entity: z.string().optional(),
  action: z.string().optional(),
})

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['audit'],
  summary: 'List audit logs (admin only, paginated, newest first)',
  security: [{ Bearer: [] }],
  request: { query: listQuerySchema },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(auditLogSchema),
            page: z.number(),
            limit: z.number(),
            total: z.number(),
          }),
        },
      },
      description: 'Audit logs page',
    },
  },
})

audit.openapi(listRoute, async (c) => {
  const { page, limit, entity, action } = c.req.valid('query')

  const filters: SQL[] = []
  if (entity) filters.push(eq(auditLogs.entity, entity))
  if (action) filters.push(eq(auditLogs.action, action))
  const where = filters.length > 0 ? and(...filters) : undefined

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(where)

  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorUsername: row.actorUsername,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      metadata: row.metadata,
      ip: row.ip,
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    limit,
    total: Number(total),
  })
})

export default audit
