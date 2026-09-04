import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { recordAudit } from '../lib/audit'
import { authGuard } from '../auth/middleware'
import { profileResponseSchema, updateProfileRequestSchema } from './dto'
import type { UserRole } from '../env'

type AuthEnv = { Variables: { user: { id: string; username: string; role: UserRole } } }

const profile = new OpenAPIHono<AuthEnv>()

profile.use('*', authGuard)

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['profile'],
  summary: 'Get own profile',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: profileResponseSchema } },
      description: 'Own profile',
    },
  },
})

profile.openapi(meRoute, async (c) => {
  const actor = c.get('user')
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, actor.id))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (!row) return c.json({ error: 'user not found' }, 404)
  const { isActive, passwordHash, ...rest } = row
  void isActive
  void passwordHash
  return c.json({ ...rest, createdAt: rest.createdAt.toISOString() })
})

const updateRoute = createRoute({
  method: 'patch',
  path: '/me',
  tags: ['profile'],
  summary: 'Update own profile (partial: name, contact info, password)',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: updateProfileRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: profileResponseSchema } },
      description: 'Updated profile',
    },
  },
})

profile.openapi(updateRoute, async (c) => {
  const actor = c.get('user')
  const body = c.req.valid('json')

  const { password, ...rest } = body
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() }
  if (password) updates.passwordHash = await Bun.password.hash(password)

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, actor.id))
    .returning()

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'profile.updated',
    entity: 'users',
    entityId: actor.id,
    metadata: { fields: Object.keys(body), passwordChanged: Boolean(password) },
  })
  return c.json({
    id: updated.id,
    name: updated.name,
    username: updated.username,
    role: updated.role,
    phone: updated.phone,
    email: updated.email,
    createdAt: updated.createdAt.toISOString(),
  })
})

export default profile
