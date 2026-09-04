import { z } from '@hono/zod-openapi'

export const mediaResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  url: z.string(),
  thumbUrl: z.string().nullable(),
  createdAt: z.string(),
})

export const mediaListResponseSchema = z.object({
  data: z.array(mediaResponseSchema),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})
