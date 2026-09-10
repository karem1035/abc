import { Hono } from 'hono'
import { authGuard, requireRole } from '../auth/middleware'

const deployment = new Hono()
deployment.use('*', authGuard, requireRole('admin'))
let lastRequest = 0

deployment.get('/', (c) => c.json({ configured: Boolean(process.env.DEPLOY_HOOK_URL && process.env.DEPLOY_HOOK_TOKEN) }))
deployment.post('/', async (c) => {
  const hook = process.env.DEPLOY_HOOK_URL
  if (!hook || !process.env.DEPLOY_HOOK_TOKEN) return c.json({ error: 'Configure DEPLOY_HOOK_URL and DEPLOY_HOOK_TOKEN on the backend first.' }, 503)
  if (Date.now() - lastRequest < 60_000) return c.json({ error: 'A deployment was just requested. Please wait one minute.' }, 429)
  lastRequest = Date.now()
  try {
    const url = new URL(hook)
    // Content edits do not change Docker layers; force a fresh content build.
    url.searchParams.set('force', 'true')
    const response = await fetch(url, { method: 'GET', headers: process.env.DEPLOY_HOOK_TOKEN ? { Authorization: `Bearer ${process.env.DEPLOY_HOOK_TOKEN}` } : {}, signal: AbortSignal.timeout(15_000), redirect: 'error' })
    if (!response.ok) throw new Error('Deploy provider rejected the request')
    return c.json({ message: 'Deployment requested. Check your hosting provider for build progress.' }, 202)
  } catch {
    return c.json({ error: 'Could not confirm deployment. Check your hosting provider before retrying.' }, 502)
  }
})
export default deployment
