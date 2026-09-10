import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'call_center', 'marketer'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  phone: text('phone'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorUsername: text('actor_username'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_created_at_idx').on(table.createdAt),
    index('audit_logs_actor_id_idx').on(table.actorId),
    index('audit_logs_entity_idx').on(table.entity),
  ],
)

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  thumbKey: text('thumb_key'),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert

export const contactSubmissions = pgTable(
  'contact_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(), // E.164
    email: text('email'),
    type: text('type'), // general | appointment | complaint | insurance | other
    otherType: text('other_type'),
    message: text('message').notNull(),
    status: text('status').default('new').notNull(), // new | read | archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('contact_submissions_created_at_idx').on(table.createdAt)],
)

export type ContactSubmission = typeof contactSubmissions.$inferSelect
export type NewContactSubmission = typeof contactSubmissions.$inferInsert

export const faqs = pgTable(
  'faqs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    page: text('page').notNull().default('contact'), // which public page it appears on
    questionAr: text('question_ar').notNull(),
    questionEn: text('question_en').notNull(),
    answerAr: text('answer_ar').notNull(),
    answerEn: text('answer_en').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('faqs_page_idx').on(table.page)],
)

export type Faq = typeof faqs.$inferSelect
export type NewFaq = typeof faqs.$inferInsert

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(), // shared across locales: /ar/departments/{slug}
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    descriptionAr: text('description_ar'), // short teaser
    descriptionEn: text('description_en'),
    contentAr: text('content_ar'), // rich HTML from the TipTap editor
    contentEn: text('content_en'),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').default(0).notNull(),
    status: text('status').default('published').notNull(), // draft | published | archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('departments_sort_idx').on(table.sortOrder)],
)

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert

export const doctors = pgTable(
  'doctors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    titleAr: text('title_ar'), // e.g. استشاري أمراض القلب
    titleEn: text('title_en'),
    contentAr: text('content_ar'), // rich HTML bio from the TipTap editor
    contentEn: text('content_en'),
    photoUrl: text('photo_url'),
    departmentId: uuid('department_id').references(() => departments.id, {
      onDelete: 'set null',
    }),
    sortOrder: integer('sort_order').default(0).notNull(),
    status: text('status').default('published').notNull(), // draft | published | archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('doctors_department_idx').on(table.departmentId)],
)

export type Doctor = typeof doctors.$inferSelect
export type NewDoctor = typeof doctors.$inferInsert

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // patient contact
    patientName: text('patient_name').notNull(),
    phone: text('phone').notNull(), // E.164
    // original request
    source: text('source').default('website').notNull(), // website | walk_in | phone
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
    preferredDate: text('preferred_date'), // free-text/date from the patient
    patientNotes: text('patient_notes'),
    // lifecycle: new → contacted → confirmed → completed (or declined/cancelled)
    status: text('status').default('new').notNull(), // new | contacted | confirmed | declined | cancelled | completed
    // agreed appointment (filled by staff)
    appointmentDate: text('appointment_date'), // YYYY-MM-DD
    appointmentTime: text('appointment_time'), // HH:mm
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    staffNotes: text('staff_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bookings_created_at_idx').on(table.createdAt),
    index('bookings_status_idx').on(table.status),
  ],
)

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert

export const doctorSchedules = pgTable(
  'doctor_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    weekday: integer('weekday').notNull(), // 0=Sunday … 6=Saturday
    startTime: text('start_time').notNull(), // HH:MM
    endTime: text('end_time').notNull(), // HH:MM
    slotMinutes: integer('slot_minutes').default(30).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('doctor_schedules_doctor_idx').on(table.doctorId)],
)

export type DoctorSchedule = typeof doctorSchedules.$inferSelect
export type NewDoctorSchedule = typeof doctorSchedules.$inferInsert

export const insurancePartners = pgTable(
  'insurance_partners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    contentAr: text('content_ar'), // rich HTML about the agreement (TipTap)
    contentEn: text('content_en'),
    category: text('category').default('insurance').notNull(), // insurance | company | authority
    logoUrl: text('logo_url'),
    websiteUrl: text('website_url'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('insurance_partners_sort_idx').on(table.sortOrder)],
)

export type InsurancePartner = typeof insurancePartners.$inferSelect
export type NewInsurancePartner = typeof insurancePartners.$inferInsert

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(), // e.g. privacy, appointment-policy
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  contentAr: text('content_ar'), // rich HTML from the TipTap editor
  contentEn: text('content_en'),
  isPublished: boolean('is_published').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull().default('article'),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  excerptAr: text('excerpt_ar').notNull().default(''),
  excerptEn: text('excerpt_en').notNull().default(''),
  contentAr: text('content_ar').notNull().default(''),
  contentEn: text('content_en').notNull().default(''),
  categoryAr: text('category_ar').notNull().default(''),
  categoryEn: text('category_en').notNull().default(''),
  authorAr: text('author_ar').notNull().default(''),
  authorEn: text('author_en').notNull().default(''),
  seoTitleAr: text('seo_title_ar').notNull().default(''),
  seoTitleEn: text('seo_title_en').notNull().default(''),
  seoDescriptionAr: text('seo_description_ar').notNull().default(''),
  seoDescriptionEn: text('seo_description_en').notNull().default(''),
  coverUrl: text('cover_url'),
  isFeatured: boolean('is_featured').notNull().default(false),
  status: text('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('posts_publication_idx').on(table.status, table.type, table.publishedAt)])

