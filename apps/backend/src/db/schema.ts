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
