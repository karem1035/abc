import { createMiddleware } from 'hono/factory'
import { z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import type { UserRole } from '../env'
import { verifyAccessToken } from '../lib/jwt'
import { db } from '../db/client'
import { users } from '../db/schema'

export const authGuard = createMiddleware<{
  Variables: {
    user: { id: string; username: string; role: UserRole }
  }
}>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return c.json({ error: 'missing or invalid Authorization header' }, 401)
  }
  const token = header.slice('Bearer '.length).trim()
  try {
    const payload = await verifyAccessToken(token)
    const row = await db
      .select({ username: users.username, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)
      .then((r) => r[0] ?? null)
    if (!row) return c.json({ error: 'invalid or expired token' }, 401)
    if (!row.isActive) return c.json({ error: 'account is deactivated' }, 403)
    c.set('user', { id: payload.sub, username: row.username, role: row.role })
    await next()
  } catch {
    return c.json({ error: 'invalid or expired token' }, 401)
  }
})

export const requireRole = (role: UserRole) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'not authenticated' }, 401)
    if (user.role !== role) return c.json({ error: 'forbidden' }, 403)
    await next()
  })

export const requireRoles = (roles: UserRole[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'not authenticated' }, 401)
    if (!roles.includes(user.role)) return c.json({ error: 'forbidden' }, 403)
    await next()
  })

export const UserRoleSchema = z.enum(['admin', 'call_center', 'marketer'])
