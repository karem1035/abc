import { z } from '@hono/zod-openapi'
import sanitizeHtml from 'sanitize-html'

export const cleanPostHtml = (html: string) => sanitizeHtml(html, {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 's', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'code', 'pre'],
  allowedAttributes: { a: ['href', 'title'], ol: ['start'] },
  allowedSchemes: ['https', 'http', 'mailto'],
  allowProtocolRelative: false,
})
const text = (max: number) => z.string().trim().max(max).default('')
export const postInput = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.enum(['article', 'news']),
  titleAr: z.string().trim().min(2).max(180), titleEn: z.string().trim().min(2).max(180),
  excerptAr: text(500), excerptEn: text(500),
  contentAr: z.string().max(200000).default('').transform(cleanPostHtml),
  contentEn: z.string().max(200000).default('').transform(cleanPostHtml),
  categoryAr: text(100), categoryEn: text(100), authorAr: text(120), authorEn: text(120),
  seoTitleAr: text(180), seoTitleEn: text(180), seoDescriptionAr: text(320), seoDescriptionEn: text(320),
  coverUrl: z.union([z.literal(''), z.string().url().refine((s) => /^https?:\/\//i.test(s))]).default(''),
  isFeatured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']), commentsEnabled: z.boolean(),
}).superRefine((post, ctx) => {
  if (post.status === 'published') {
    for (const field of ['contentAr', 'contentEn'] as const) {
      if (!sanitizeHtml(post[field], { allowedTags: [], allowedAttributes: {} }).trim()) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'Both language versions need content before publishing' })
      }
    }
    if (!post.coverUrl) {
      ctx.addIssue({ code: 'custom', path: ['coverUrl'], message: 'A cover image is required before publishing' })
    }
  }
})
export const commentInput = z.object({
  name: z.string().trim().min(2).max(80), body: z.string().trim().min(3).max(2000), locale: z.enum(['ar', 'en']),
  website: z.string().max(0).optional(),
})
