import { z } from '@hono/zod-openapi'
import { UserRoleSchema } from '../auth/middleware'

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.string(),
})

export const createUserRequestSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(4),
  role: UserRoleSchema,
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

export const updateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  password: z.string().min(4).optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})
