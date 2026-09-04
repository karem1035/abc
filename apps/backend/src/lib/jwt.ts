import { sign, verify } from 'hono/utils/jwt/jwt'
import { env, type UserRole } from '../env'

export type JwtPayload = {
  sub: string
  role: UserRole
  iat?: number
  exp?: number
}

function toSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration)
  if (!match) throw new Error(`Invalid JWT_EXPIRES_IN format: ${duration}`)
  const n = Number(match[1])
  const unit = match[2]
  const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400
  return n * mult
}

export async function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + toSeconds(env.JWT_EXPIRES_IN)
  return await sign({ ...payload, iat: now, exp }, env.JWT_SECRET, 'HS256')
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const payload = await verify(token, env.JWT_SECRET, 'HS256')
  return payload as unknown as JwtPayload
}
