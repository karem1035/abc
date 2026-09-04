import { eq } from 'drizzle-orm'
import { db } from './db/client'
import { users } from './db/schema'
import { env, type UserRole } from './env'

type SeedUser = {
  name: string
  username: string
  role: UserRole
  password: string
}

const seedUsers: SeedUser[] = [
  { name: 'Admin', username: 'admin', role: 'admin', password: env.SEED_ADMIN_PASSWORD },
  { name: 'Call Center', username: 'call_center', role: 'call_center', password: env.SEED_CALL_CENTER_PASSWORD },
  { name: 'Marketer', username: 'marketer', role: 'marketer', password: env.SEED_MARKETER_PASSWORD },
]

async function upsertUser(u: SeedUser) {
  const passwordHash = await Bun.password.hash(u.password)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, u.username))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (existing) {
    await db
      .update(users)
      .set({ name: u.name, role: u.role, passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existing.id))
    console.log(`updated: ${u.username} (${u.role})`)
  } else {
    await db.insert(users).values({
      name: u.name,
      username: u.username,
      role: u.role,
      passwordHash,
    })
    console.log(`created: ${u.username} (${u.role})`)
  }
}

async function main() {
  console.log('seeding users...')
  for (const u of seedUsers) await upsertUser(u)
  console.log('seed complete')
  process.exit(0)
}

main().catch((err) => {
  console.error('seed failed:', err)
  process.exit(1)
})
