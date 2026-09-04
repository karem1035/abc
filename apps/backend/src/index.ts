import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { prettyJSON } from 'hono/pretty-json'
import { compress } from 'hono/compress'
import { requestId } from 'hono/request-id'
import { rateLimiter } from 'hono-rate-limiter'

import { app as v1, mountDocs } from './openapi'
import { env } from './env'

const root = new Hono()

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

root.use(requestId())
root.use(logger())
root.use('*', prettyJSON())
root.use('*', compress())
root.use(
  '/v1/*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  }),
)
root.use(secureHeaders())
root.use(
  '/v1/*',
  rateLimiter({
    windowMs: 60_000,
    limit: 100,
    standardHeaders: 'draft-6',
    keyGenerator: (c) =>
      c.req.header('x-forwarded-for') ??
      c.req.header('x-real-ip') ??
      'anonymous',
  }),
)

mountDocs(root)

root.route('/v1', v1)

root.notFound((c) => c.json({ error: 'not found' }, 404))
root.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal server error' }, 500)
})

export default {
  port: env.PORT,
  fetch: root.fetch,
  reusePort: true,
}

const displayPort = Number(process.env.PORT_DISPLAY ?? env.PORT)
console.log(`\n  API:       http://localhost:${displayPort}/v1`)
console.log(`  Health:    http://localhost:${displayPort}/v1/health`)
console.log(`  Swagger:   http://localhost:${displayPort}/swagger`)
console.log(`  OpenAPI:   http://localhost:${displayPort}/doc\n`)
