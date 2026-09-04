import { z } from '@hono/zod-openapi'

export const loginRequestSchema = z.object({
  username: z.string().min(1).openapi({ example: 'admin' }),
  password: z.string().min(1).openapi({ example: '0000' }),
})

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  role: z.enum(['admin', 'call_center', 'marketer']),
  isActive: z.boolean(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.string(),
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: userResponseSchema,
})
