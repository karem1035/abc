import type { User } from '../db/schema'

export function toUserResponse(row: User) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    isActive: row.isActive,
    phone: row.phone,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  }
}
