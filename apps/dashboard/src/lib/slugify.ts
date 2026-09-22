/**
 * Live slug preview in editors — mirrors the backend's slugify (kebab-case,
 * latin only, falls back to 'item' for e.g. Arabic-only titles).
 */
export function slugify(title: string): string {
  return title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100).replace(/-+$/g, '') || 'item'
}
