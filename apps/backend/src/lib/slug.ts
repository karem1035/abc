import { z } from '@hono/zod-openapi'

/**
 * Kebab-case slug from a title. Falls back to `item` when nothing ASCII
 * survives (e.g. Arabic-only titles).
 */
export function slugify(title: string): string {
  return title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100).replace(/-+$/g, '') || 'item'
}

/**
 * Ensure uniqueness by appending -2, -3, … `isTaken` is a predicate over the
 * candidate slug; the current record's own slug counts as free.
 */
export async function uniqueSlug(base: string, isTaken: (candidate: string) => Promise<boolean>): Promise<string> {
  let candidate = base
  for (let i = 2; ; i++) {
    if (!(await isTaken(candidate))) return candidate
    const suffix = `-${i}`
    candidate = `${base.slice(0, 100 - suffix.length)}${suffix}`
  }
}

export const slugSchema = z.string().trim().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, numbers and dashes only').optional().or(z.literal(''))
