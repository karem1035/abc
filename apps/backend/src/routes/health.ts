import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const health = new OpenAPIHono()

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['system'],
  summary: 'Health check',
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      description: 'Service is healthy',
    },
  },
})

health.openapi(healthRoute, (c) => c.json({ ok: true }))

export default health
