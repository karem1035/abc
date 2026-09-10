import deployment from './deployment/routes'
import { OpenAPIHono } from '@hono/zod-openapi'
import type { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import health from './routes/health'
import auth from './auth/routes'
import users from './users/routes'
import profile from './profile/routes'
import audit from './audit/routes'
import storage from './storage/routes'
import contact from './contact/routes'
import departments from './departments/routes'
import doctors from './doctors/routes'
import bookings from './bookings/routes'
import content from './content/routes'
import posts from './posts/routes'

export const app = new OpenAPIHono()

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

app.route('/deployment', deployment)
app.route('/health', health)
app.route('/auth', auth)
app.route('/users', users)
app.route('/profile', profile)
app.route('/audit-logs', audit)
app.route('/storage', storage)
app.route('/contact', contact)
app.route('/departments', departments)
app.route('/doctors', doctors)
app.route('/bookings', bookings)
app.route('/content', content)
app.route('/posts', posts)

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'ABC Website API',
    version: '1.0.0',
    description:
      'Backend API for the abc-website-v2 monorepo.\n\n' +
      'Seeded users: `admin` / `0000` (admin), `call_center` / `0000`, `marketer` / `0000`.\n' +
      'Login via `POST /auth/login`, then click **Authorize** and paste the `accessToken` (it persists across reloads).',
  },
}

export function mountDocs(root: Hono) {
  root.get('/doc', (c) => {
    const forwardedProto = c.req.header('x-forwarded-proto')
    const forwardedHost = c.req.header('x-forwarded-host') ?? c.req.header('host')
    const origin = forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(c.req.url).origin

    const document = {
      ...openApiDocument,
      servers: [{ url: `${origin}/v1`, description: 'Current deployment' }],
    }

    return c.json(app.getOpenAPI31Document(document))
  })
  root.use('/swagger', swaggerUI({ url: '/doc', persistAuthorization: true }))
}
