import { eq } from 'drizzle-orm'
import { db } from './db/client'
import { faqs, users } from './db/schema'
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
  await seedFaqData()
  console.log('seed complete')
  process.exit(0)
}

main().catch((err) => {
  console.error('seed failed:', err)
  process.exit(1)
})

const seedFaqs: Array<{
  page: string
  questionAr: string
  questionEn: string
  answerAr: string
  answerEn: string
  sortOrder: number
}> = [
  {
    page: 'contact',
    questionAr: 'ما هي مواعيد العمل في المستشفى؟',
    questionEn: 'What are the hospital working hours?',
    answerAr: 'العيادات الخارجية تعمل يوميًا من ٩ صباحًا حتى ١٠ مساءً، والطوارئ تعمل على مدار الساعة طوال أيام الأسبوع.',
    answerEn: 'Outpatient clinics run daily from 9 AM to 10 PM, and the emergency department operates 24/7.',
    sortOrder: 1,
  },
  {
    page: 'contact',
    questionAr: 'هل يجب عليّ حجز موعد قبل زيارة العيادة؟',
    questionEn: 'Do I need an appointment before visiting a clinic?',
    answerAr: 'يُفضَّل الحجز المسبق لتقليل وقت الانتظار، لكننا نستقبل الحالات العاجلة دون موعد.',
    answerEn: 'Booking in advance is recommended to reduce waiting time, but urgent cases are received without an appointment.',
    sortOrder: 2,
  },
  {
    page: 'contact',
    questionAr: 'هل يتم قبول التأمين الطبي؟',
    questionEn: 'Do you accept medical insurance?',
    answerAr: 'نعم، نتعامل مع معظم شركات التأمين الكبرى. تواصل معنا لمعرفة تفاصيل اتفاقية شركتك.',
    answerEn: 'Yes, we work with most major insurance providers. Contact us to check your company\u2019s agreement details.',
    sortOrder: 3,
  },
]

async function seedFaqData() {
  console.log('seeding faqs...')
  for (const f of seedFaqs) {
    const existing = await db
      .select({ id: faqs.id })
      .from(faqs)
      .where(eq(faqs.questionAr, f.questionAr))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!existing) {
      await db.insert(faqs).values(f)
      console.log(`created faq: ${f.questionAr.slice(0, 30)}…`)
    }
  }
}
