import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import sharp from 'sharp'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { media } from '../db/schema'
import { deleteObject, publicUrl, putObject } from '../lib/storage'
import { recordAudit } from '../lib/audit'
import { authGuard, requireRole } from '../auth/middleware'
import type { UserRole } from '../env'
import { idParamSchema, mediaListResponseSchema, mediaResponseSchema } from './dto'

type AuthEnv = { Variables: { user: { id: string; username: string; role: UserRole } } }

const storage = new OpenAPIHono<AuthEnv>()

storage.use('*', authGuard)

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024 // 15 MB
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/tiff'])

function toMediaResponse(row: typeof media.$inferSelect) {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    url: publicUrl(row.key),
    thumbUrl: row.thumbKey ? publicUrl(row.thumbKey) : null,
    createdAt: row.createdAt.toISOString(),
  }
}

const uploadRoute = createRoute({
  method: 'post',
  path: '/images',
  tags: ['storage'],
  summary: 'Upload an image — compressed to WebP + 400px thumbnail (auth required)',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({ format: 'binary', description: 'Image file (jpeg/png/webp/gif/avif/tiff, max 15MB)' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: mediaResponseSchema } },
      description: 'Uploaded media',
    },
    400: { description: 'Invalid file (not an image, or too large)' },
  },
})

storage.openapi(uploadRoute, async (c) => {
  const actor = c.get('user')
  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) {
    return c.json({ error: 'missing "file" field' }, 400)
  }
  if (!IMAGE_TYPES.has(file.type)) {
    return c.json({ error: `unsupported type "${file.type}" — images only` }, 400)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: 'file exceeds the 15MB limit' }, 400)
  }

  const input = Buffer.from(await file.arrayBuffer())

  // Full size: WebP, capped at 1920px, sane quality
  const full = sharp(input, { failOn: 'error' }).rotate() // strip EXIF rotation into pixels
  const fullMeta = await full.metadata()
  const fullBuffer = await full
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })

  // Thumbnail: WebP, 400px max
  const thumbBuffer = await sharp(input)
    .rotate()
    .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer()

  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 60) || 'image'
  const now = new Date()
  const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const key = `${prefix}/${crypto.randomUUID()}-${base}.webp`
  const thumbKey = `${prefix}/${crypto.randomUUID()}-${base}-thumb.webp`

  await putObject(key, fullBuffer.data, 'image/webp')
  await putObject(thumbKey, thumbBuffer, 'image/webp')

  const [row] = await db
    .insert(media)
    .values({
      key,
      thumbKey,
      filename: file.name,
      mimeType: 'image/webp',
      size: fullBuffer.data.byteLength,
      width: fullBuffer.info.width ?? fullMeta.width ?? null,
      height: fullBuffer.info.height ?? fullMeta.height ?? null,
      uploadedBy: actor.id,
    })
    .returning()

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'media.uploaded',
    entity: 'media',
    entityId: row.id,
    metadata: { filename: row.filename, size: row.size },
  })

  return c.json(toMediaResponse(row), 201)
})

const listRoute = createRoute({
  method: 'get',
  path: '/files',
  tags: ['storage'],
  summary: 'List uploaded media (newest first)',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: mediaListResponseSchema } },
      description: 'Media list',
    },
  },
})

storage.openapi(listRoute, async (c) => {
  const { limit } = c.req.valid('query')
  const rows = await db.select().from(media).orderBy(desc(media.createdAt)).limit(limit)
  return c.json({ data: rows.map(toMediaResponse) })
})

const getRoute = createRoute({
  method: 'get',
  path: '/files/{id}',
  tags: ['storage'],
  summary: 'Get a single media item',
  security: [{ Bearer: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: mediaResponseSchema } },
      description: 'Media item',
    },
    404: { description: 'Not found' },
  },
})

storage.openapi(getRoute, async (c) => {
  const { id } = c.req.valid('param')
  const row = await db
    .select()
    .from(media)
    .where(eq(media.id, id))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (!row) return c.json({ error: 'media not found' }, 404)
  return c.json(toMediaResponse(row))
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/files/{id}',
  tags: ['storage'],
  summary: 'Delete a media item and its objects (admin only)',
  security: [{ Bearer: [] }],
  request: { params: idParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      description: 'Deleted',
    },
    404: { description: 'Not found' },
    403: { description: 'Forbidden' },
  },
})

storage.delete('/files/:id', requireRole('admin'))
storage.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param')
  const actor = c.get('user')

  const row = await db
    .select()
    .from(media)
    .where(eq(media.id, id))
    .limit(1)
    .then((r) => r[0] ?? null)
  if (!row) return c.json({ error: 'media not found' }, 404)

  await deleteObject(row.key).catch((err) => console.error('object delete failed:', err))
  if (row.thumbKey) {
    await deleteObject(row.thumbKey).catch((err) => console.error('thumb delete failed:', err))
  }
  await db.delete(media).where(eq(media.id, id))

  await recordAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'media.deleted',
    entity: 'media',
    entityId: id,
    metadata: { filename: row.filename },
  })
  return c.json({ ok: true })
})

export default storage
