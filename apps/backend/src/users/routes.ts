import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { toUserResponse } from '../lib/user'
import { recordAudit } from '../lib/audit'
import { authGuard, requireRole } from '../auth/middleware'
import {
  createUserRequestSchema,
  idParamSchema,
  updateUserRequestSchema,
  userResponseSchema,
  usersListResponseSchema,
} from './dto'

type AuthEnv = { Variables: { user: { id: string; username: string; role: 'admin' | 'call_center' | 'marketer' } } }

const usersRouter = new OpenAPIHono<AuthEnv>()

usersRouter.use('*', authGuard)
usersRouter.use('*', requireRole('admin'))

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['users'],
  summary: 'List users (admin only)',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: usersListResponseSchema } },
      description: 'Users list',
    },
    403: { description: 'Forbidden' },
  },
})

usersRouter.openapi(listRoute, async (c) => {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt))
  return c.json({ data: rows.map(toUserResponse) })
})

const createRouteDef = createRoute({
  method: 'post',
  path: '/',
  tags: ['users'],
  summary: 'Create a user (admin only)',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: createUserRequestSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: userResponseSchema } },
      description: 'Created user',
    },
    409: { description: 'Username already taken' },
  },
})

usersRouter.openapi(createRouteDef, async (c) => {
  const body = c.req.valid('json')
  const actor = c.get('user')

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, body.username))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (existing) return c.json({ error: 'username already taken' }, 409)

  const passwordHash = await Bun.password.hash(body.password)
  const [row] = await db
    .insert(users)
    .values({
      name: body.name,
      username: body.username,
      passwordHash,
      role: body.role,
      phone: body.phone ?? null,
      email: body.email ?? null,
    })
    .returning()

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'user.created',
    entity: 'users',
    entityId: row.id,
    metadata: { username: row.username, role: row.role },
  })
  return c.json(toUserResponse(row), 201)
})

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['users'],
  summary: 'Get a user by id (admin only)',
  security: [{ Bearer: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: userResponseSchema } },
      description: 'User',
    },
    404: { description: 'Not found' },
  },
})

usersRouter.openapi(getRoute, async (c) => {
  const { id } = c.req.valid('param')
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (!row) return c.json({ error: 'user not found' }, 404)
  return c.json(toUserResponse(row))
})

const updateRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['users'],
  summary: 'Update a user (admin only)',
  security: [{ Bearer: [] }],
  request: {
    params: idParamSchema,
    body: { content: { 'application/json': { schema: updateUserRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: userResponseSchema } },
      description: 'Updated user',
    },
    404: { description: 'Not found' },
  },
})

usersRouter.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const actor = c.get('user')

  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (!row) return c.json({ error: 'user not found' }, 404)

  const { password, ...rest } = body
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() }
  if (password) updates.passwordHash = await Bun.password.hash(password)

  const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning()

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'user.updated',
    entity: 'users',
    entityId: id,
    metadata: { fields: Object.keys(body) },
  })
  return c.json(toUserResponse(updated))
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['users'],
  summary: 'Delete a user (admin only)',
  security: [{ Bearer: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      description: 'Deleted',
    },
    404: { description: 'Not found' },
    409: { description: 'Cannot delete yourself' },
  },
})

usersRouter.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param')
  const actor = c.get('user')
  if (id === actor.id) return c.json({ error: 'cannot delete yourself' }, 409)

  const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
  if (deleted.length === 0) return c.json({ error: 'user not found' }, 404)

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'user.deleted',
    entity: 'users',
    entityId: id,
  })
  return c.json({ ok: true })
})

export default usersRouter
