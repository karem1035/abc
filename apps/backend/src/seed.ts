import { and, eq } from 'drizzle-orm'
import { db } from './db/client'
import { departments, doctorSchedules, doctors, faqs, insurancePartners, pages, users } from './db/schema'
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
  await seedDepartmentsData()
  await seedScheduleData()
  await seedContentData()
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

const seedDepartments: Array<{
  slug: string; nameAr: string; nameEn: string
  descriptionAr: string; descriptionEn: string
  contentAr: string; contentEn: string; sortOrder: number
  imageUrl?: string
}> = [
  {
    slug: 'cardiology', nameAr: 'القلب والأوعية الدموية', nameEn: 'Cardiology',
    descriptionAr: 'تشخيص وعلاج أمراض القلب والشرايين بأحدث التقنيات.',
    descriptionEn: 'Diagnosis and treatment of heart and vascular conditions with modern technology.',
    contentAr: '<h2>قسم القلب والأوعية الدموية</h2><p>يقدم القسم خدمات شاملة تشمل القسطرة التشخيصية والعلاجية، تخطيط القلب، والمتابعة بعد التدخل الجراحي.</p><ul><li>قسطرة القلب التشخيصية والعلاجية</li><li>تخطيط ومتابعة القلب</li><li>علاج ضغط الدم والكوليسترول</li></ul>',
    contentEn: '<h2>Cardiology Department</h2><p>The department provides comprehensive services including diagnostic and therapeutic catheterization, ECG, and post-procedure follow-up.</p><ul><li>Diagnostic and interventional catheterization</li><li>ECG and monitoring</li><li>Hypertension and cholesterol management</li></ul>',
    imageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=1920&q=80&auto=format&fit=crop',
    sortOrder: 1,
  },
  {
    slug: 'orthopedics', nameAr: 'العظام والمفاصل', nameEn: 'Orthopedics',
    descriptionAr: 'جراحات استبدال المفاصل ومناظير العظام وإصابات الملاعب.',
    descriptionEn: 'Joint replacement, arthroscopy, and sports injuries.',
    contentAr: '<h2>قسم العظام والمفاصل</h2><p>نتخصص في جراحات استبدال مفصل الورك والركبة، مناظير المفاصل، وعلاج إصابات الملاعب والكسور.</p>',
    contentEn: '<h2>Orthopedics Department</h2><p>We specialize in hip and knee replacement, arthroscopic surgery, sports injuries, and fracture care.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80&auto=format&fit=crop',
    sortOrder: 2,
  },
  {
    slug: 'internal-medicine', nameAr: 'الباطنة', nameEn: 'Internal Medicine',
    descriptionAr: 'تشخيص ومتابعة أمراض الباطنة والسكري والغدد.',
    descriptionEn: 'Diagnosis and management of internal medicine, diabetes, and endocrine conditions.',
    contentAr: '<h2>قسم الباطنة</h2><p>رعاية شاملة لأمراض الجهاز الهضمي، السكري، أمراض الغدد الصماء، ومتابعة الأمراض المزمنة.</p>',
    contentEn: '<h2>Internal Medicine Department</h2><p>Comprehensive care for gastrointestinal, diabetes, endocrine, and chronic disease management.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80&auto=format&fit=crop',
    sortOrder: 3,
  },
  {
    slug: 'pediatrics', nameAr: 'الأطفال', nameEn: 'Pediatrics',
    descriptionAr: 'رعاية طبية متكاملة للأطفال من الولادة حتى المراهقة.',
    descriptionEn: 'Complete medical care for children from birth to adolescence.',
    contentAr: '<h2>قسم الأطفال</h2><p>عيادات متخصصة لحديثي الولادة والأطفال، مع متابعة النمو والتطعيمات ورعاية الحالات الحادة.</p>',
    contentEn: '<h2>Pediatrics Department</h2><p>Specialized clinics for newborns and children, with growth monitoring, vaccinations, and acute care.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1920&q=80&auto=format&fit=crop',
    sortOrder: 4,
  },
]

const seedDoctors: Array<{
  slug: string; nameAr: string; nameEn: string
  titleAr: string; titleEn: string; dept: string; sortOrder: number
  photoUrl?: string
}> = [
  { slug: 'ahmed-mohamed', nameAr: 'د. أحمد محمد', nameEn: 'Dr. Ahmed Mohamed', titleAr: 'استشاري أمراض القلب', titleEn: 'Consultant Cardiologist', dept: 'cardiology', photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&auto=format&fit=crop', sortOrder: 1 },
  { slug: 'mona-hassan', nameAr: 'د. منى حسن', nameEn: 'Dr. Mona Hassan', titleAr: 'أخصائية قلب الأطفال', titleEn: 'Pediatric Cardiology Specialist', dept: 'cardiology', photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&auto=format&fit=crop', sortOrder: 2 },
  { slug: 'khaled-ibrahim', nameAr: 'د. خالد إبراهيم', nameEn: 'Dr. Khaled Ibrahim', titleAr: 'استشاري جراحة العظام', titleEn: 'Consultant Orthopedic Surgeon', dept: 'orthopedics', photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80&auto=format&fit=crop', sortOrder: 1 },
  { slug: 'sara-ali', nameAr: 'د. سارة علي', nameEn: 'Dr. Sara Ali', titleAr: 'أخصائية باطنة وسكري', titleEn: 'Internal Medicine & Diabetes Specialist', dept: 'internal-medicine', photoUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&auto=format&fit=crop', sortOrder: 1 },
  { slug: 'omar-farouk', nameAr: 'د. عمر فاروق', nameEn: 'Dr. Omar Farouk', titleAr: 'أخصائي طب الأطفال', titleEn: 'Pediatrics Specialist', dept: 'pediatrics', photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&q=80&auto=format&fit=crop', sortOrder: 1 },
]

async function seedDepartmentsData() {
  console.log('seeding departments...')
  for (const d of seedDepartments) {
    const { contentAr, contentEn, sortOrder, ...rest } = d
    const existing = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.slug, d.slug))
      .limit(1)
      .then((r) => r[0] ?? null)

    const values = { ...rest, contentAr, contentEn, sortOrder, imageUrl: d.imageUrl ?? null, status: 'published' as const }
    if (existing) {
      await db.update(departments).set(values).where(eq(departments.id, existing.id))
      console.log(`updated department: ${d.slug}`)
    } else {
      await db.insert(departments).values(values)
      console.log(`created department: ${d.slug}`)
    }
  }

  console.log('seeding doctors...')
  const depts = await db.select().from(departments)
  for (const doc of seedDoctors) {
    const { dept, sortOrder, ...rest } = doc
    const existing = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.slug, doc.slug))
      .limit(1)
      .then((r) => r[0] ?? null)

    const values = {
      ...rest,
      photoUrl: doc.photoUrl ?? null,
      sortOrder,
      departmentId: depts.find((d) => d.slug === dept)?.id ?? null,
      status: 'published' as const,
    }
    if (existing) {
      await db.update(doctors).set(values).where(eq(doctors.id, existing.id))
      console.log(`updated doctor: ${doc.slug}`)
    } else {
      await db.insert(doctors).values(values)
      console.log(`created doctor: ${doc.slug}`)
    }
  }
}

// Weekly clinic rules: [doctorSlug, weekday(0=Sun), start, end, slotMinutes]
const seedSchedules: Array<[string, number, string, string, number]> = [
  ['ahmed-mohamed', 0, '10:00', '14:00', 30],
  ['ahmed-mohamed', 2, '10:00', '14:00', 30],
  ['ahmed-mohamed', 3, '15:00', '18:00', 30],
  ['mona-hassan', 1, '11:00', '15:00', 30],
  ['mona-hassan', 4, '11:00', '15:00', 30],
  ['khaled-ibrahim', 0, '16:00', '20:00', 30],
  ['khaled-ibrahim', 3, '16:00', '20:00', 30],
  ['sara-ali', 1, '09:00', '13:00', 30],
  ['sara-ali', 2, '09:00', '13:00', 30],
  ['omar-farouk', 6, '10:00', '14:00', 30],
]

const seedDoctorContent: Record<string, { ar: string; en: string }> = {
  'ahmed-mohamed': {
    ar: '<h2>نبذة</h2><p>استشاري أمراض القلب بخبرة تتجاوز 15 عامًا في القسطرة التشخيصية والتداخلية وعلاج أمراض الشريان التاجي.</p><ul><li>بكالوريوس الطب والجراحة — جامعة القاهرة</li><li>ماجستير أمراض القلب — الجامعة نفسها</li><li>عضو الجمعية الأوروبية لأمراض القلب</li></ul>',
    en: '<h2>About</h2><p>Consultant cardiologist with 15+ years in diagnostic and interventional catheterization and coronary artery disease management.</p><ul><li>MBBCh — Cairo University</li><li>MSc Cardiology</li><li>Member, European Society of Cardiology</li></ul>',
  },
}

async function seedScheduleData() {
  console.log('seeding doctor schedules...')
  const docs = await db.select().from(doctors)
  for (const [slug, weekday, startTime, endTime, slotMinutes] of seedSchedules) {
    const doc = docs.find((d) => d.slug === slug)
    if (!doc) continue
    const exists = await db
      .select({ id: doctorSchedules.id })
      .from(doctorSchedules)
      .where(
        and(
          eq(doctorSchedules.doctorId, doc.id),
          eq(doctorSchedules.weekday, weekday),
          eq(doctorSchedules.startTime, startTime),
        ),
      )
      .limit(1)
    if (exists.length === 0) {
      await db.insert(doctorSchedules).values({ doctorId: doc.id, weekday, startTime, endTime, slotMinutes })
    }
  }

  console.log('seeding doctor bios...')
  for (const [slug, content] of Object.entries(seedDoctorContent)) {
    const doc = docs.find((d) => d.slug === slug)
    if (!doc || doc.contentAr) continue
    await db.update(doctors).set({ contentAr: content.ar, contentEn: content.en }).where(eq(doctors.id, doc.id))
  }
}

const seedPartners: Array<{ nameAr: string; nameEn: string; category: 'insurance' | 'company' | 'authority'; sortOrder: number }> = [
  { nameAr: 'مصر للتأمين', nameEn: 'Misr Insurance', category: 'insurance', sortOrder: 1 },
  { nameAr: 'الأهلية للتأمين', nameEn: 'Bupa Egypt', category: 'insurance', sortOrder: 2 },
  { nameAr: 'ميت لايف', nameEn: 'MetLife', category: 'insurance', sortOrder: 3 },
  { nameAr: 'أليانز', nameEn: 'Allianz', category: 'insurance', sortOrder: 4 },
  { nameAr: 'شركة النصر', nameEn: 'Nasr Company', category: 'company', sortOrder: 5 },
]

const seedPages: Array<{
  slug: string; titleAr: string; titleEn: string; contentAr: string; contentEn: string
}> = [
  {
    slug: 'privacy',
    titleAr: 'سياسة الخصوصية',
    titleEn: 'Privacy Policy',
    contentAr: '<p>نحن في مستشفى ABC نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. تُستخدم البيانات المرسلة عبر نماذج الموقع (كالاسم ورقم الهاتف) لغرض التواصل بشأن طلبك فقط ولا تُشارك مع أي طرف ثالث دون إذنك.</p><h3>حقوقك</h3><p>يمكنك طلب الاطلاع على بياناتك أو حذفها في أي وقت عبر التواصل معنا.</p>',
    contentEn: '<p>At ABC Hospital we respect your privacy and protect your personal data. Details submitted through this website (such as your name and phone number) are used solely to contact you about your request and are never shared with third parties without your consent.</p><h3>Your rights</h3><p>You may request to view or delete your data at any time by contacting us.</p>',
  },
  {
    slug: 'appointment-policy',
    titleAr: 'سياسة طلب المواعيد',
    titleEn: 'Appointment Request Policy',
    contentAr: '<p>تقديم طلب موعد عبر الموقع ليس حجزًا مؤكدًا ولا قناة للطوارئ. يتواصل فريقنا معك هاتفيًا لتأكيد الموعد النهائي. في حالات الطوارئ يرجى التوجه فورًا إلى قسم الطوارئ أو الاتصال بالخط الساخن.</p>',
    contentEn: '<p>Submitting an appointment request through this website is not a confirmed booking and is not an emergency channel. Our team will call you to confirm the final appointment. In emergencies, please go directly to the emergency department or call the hotline.</p>',
  },
]

async function seedContentData() {
  console.log('seeding insurance partners...')
  for (const p of seedPartners) {
    const existing = await db.select({ id: insurancePartners.id }).from(insurancePartners).where(eq(insurancePartners.nameAr, p.nameAr)).limit(1).then((r) => r[0] ?? null)
    if (!existing) {
      await db.insert(insurancePartners).values(p)
      console.log(`created partner: ${p.nameAr}`)
    }
  }

  console.log('seeding policy pages...')
  for (const pg of seedPages) {
    const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, pg.slug)).limit(1).then((r) => r[0] ?? null)
    if (!existing) {
      await db.insert(pages).values(pg)
      console.log(`created page: ${pg.slug}`)
    }
  }
}
