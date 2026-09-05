import { z } from '@hono/zod-openapi'

export const profileResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  role: z.enum(['admin', 'call_center', 'marketer']),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.string(),
})

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4),
  confirmNewPassword: z.string().min(4),
})
