import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { signAccessToken } from '../lib/jwt'
import { toUserResponse } from '../lib/user'
import { recordAudit } from '../lib/audit'
import { authGuard } from './middleware'
import { loginRequestSchema, loginResponseSchema, userResponseSchema } from './dto'
import type { UserRole } from '../env'

type AuthEnv = { Variables: { user: { id: string; username: string; role: UserRole } } }

const auth = new OpenAPIHono<AuthEnv>()

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['auth'],
  summary: 'Login with username + password',
  request: {
    body: {
      content: { 'application/json': { schema: loginRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: loginResponseSchema } },
      description: 'Access token + user',
    },
    401: { description: 'Invalid credentials' },
    403: { description: 'Account is deactivated' },
  },
})

auth.openapi(loginRoute, async (c) => {
  const { username, password } = c.req.valid('json')
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!user) return c.json({ error: 'invalid credentials' }, 401)
  const ok = await Bun.password.verify(password, user.passwordHash)
  if (!ok) return c.json({ error: 'invalid credentials' }, 401)
  if (!user.isActive) return c.json({ error: 'account is deactivated' }, 403)

  const accessToken = await signAccessToken({ sub: user.id, role: user.role })
  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'auth.login',
    entity: 'auth',
    entityId: user.id,
    ip: c.req.header('x-forwarded-for') ?? null,
  })
  return c.json({
    accessToken,
    user: toUserResponse(user),
  })
})

auth.use('/me', authGuard)

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['auth'],
  summary: 'Current user',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: userResponseSchema } },
      description: 'Authenticated user',
    },
    401: { description: 'Unauthorized' },
  },
})

auth.openapi(meRoute, async (c) => {
  const user = c.get('user')
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!row) return c.json({ error: 'user not found' }, 404)
  return c.json(toUserResponse(row))
})

const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['auth'],
  summary: 'Logout (stateless JWT — client discards the token)',
  security: [{ Bearer: [] }],
  responses: {
    200: { description: 'Logged out' },
  },
})

auth.openapi(logoutRoute, async (c) => {
  const user = c.get('user')
  await recordAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'auth.logout',
    entity: 'auth',
    entityId: user.id,
  })
  return c.json({ ok: true })
})

export default auth
