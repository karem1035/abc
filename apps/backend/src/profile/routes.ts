import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { recordAudit } from '../lib/audit'
import { authGuard } from '../auth/middleware'
import { normalizeOptionalPhone } from '../lib/phone'
import { profileResponseSchema, updateProfileRequestSchema, changePasswordRequestSchema } from './dto'
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
    404: { description: 'User not found' },
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
    400: { description: 'Invalid input (e.g. bad phone number)' },
  },
})

profile.openapi(updateRoute, async (c) => {
  const actor = c.get('user')
  const body = c.req.valid('json')

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() }
  if (body.phone !== undefined) {
    const phone = normalizeOptionalPhone(body.phone)
    if (body.phone && !phone) {
      return c.json({ error: 'invalid phone number' }, 400)
    }
    updates.phone = phone
  }

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
    metadata: { fields: Object.keys(body) },
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

const changePasswordRoute = createRoute({
  method: 'post',
  path: '/change-password',
  tags: ['profile'],
  summary: 'Change own password (current + new + confirmation)',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: changePasswordRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      description: 'Password changed',
    },
    400: { description: 'New passwords do not match' },
    401: { description: 'Current password is incorrect' },
  },
})

profile.openapi(changePasswordRoute, async (c) => {
  const actor = c.get('user')
  const { currentPassword, newPassword, confirmNewPassword } = c.req.valid('json')

  if (newPassword !== confirmNewPassword) {
    return c.json({ error: 'new passwords do not match' }, 400)
  }

  const row = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, actor.id))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (!row) return c.json({ error: 'user not found' }, 404)

  const ok = await Bun.password.verify(currentPassword, row.passwordHash)
  if (!ok) return c.json({ error: 'current password is incorrect' }, 401)

  await db
    .update(users)
    .set({ passwordHash: await Bun.password.hash(newPassword), updatedAt: new Date() })
    .where(eq(users.id, actor.id))

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'profile.password_changed',
    entity: 'users',
    entityId: actor.id,
  })
  return c.json({ ok: true })
})

export default profile
