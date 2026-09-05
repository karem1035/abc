import type { Context } from 'hono'
import { getConnInfo } from 'hono/bun'
import { db } from '../db/client'
import { auditLogs } from '../db/schema'
import type { NewAuditLog } from '../db/schema'

type AuditInput = {
  actorId?: string | null
  actorUsername?: string | null
  action: string
  entity: string
  entityId?: string | null
  metadata?: Record<string, unknown>
  ip?: string | null
}

/** Best-effort client IP: proxy headers first, then the socket address. */
export function clientIp(c: Context): string | null {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  try {
    return getConnInfo(c).remote.address ?? null
  } catch {
    return null
  }
}

/**
 * Fire-and-forget audit trail writer — never throws into the request path.
 * Conventions: action = 'user.created', entity = 'users', entityId = row id.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  const row: NewAuditLog = {
    actorId: input.actorId ?? null,
    actorUsername: input.actorUsername ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
    ip: input.ip ?? null,
  }
  try {
    await db.insert(auditLogs).values(row)
  } catch (err) {
    console.error('audit log write failed:', err)
  }
}
