import { contentFetch } from './content-fetch'
/** Enumerate published content only. Fail builds on API errors instead of deploying empty pages. */
export async function staticSlugs(resource: string, locale: string): Promise<{ slug: string }[]> {
  const result: { slug: string }[] = []
  for (let page = 1; ; page++) {
    const url = new URL(`${process.env.API_URL ?? 'http://localhost:3000/v1'}/${resource}`)
    url.searchParams.set('locale', locale)
    url.searchParams.set('limit', '50')
    url.searchParams.set('page', String(page))
    const response = await contentFetch(url, { next: { revalidate: 300 } })
    if (!response.ok) throw new Error(`Cannot enumerate ${resource}: ${response.status}`)
    const body = await response.json() as { data: { slug: string }[]; total?: number }
    result.push(...body.data.map(({ slug }) => ({ slug })))
    if (!body.total || result.length >= body.total || !body.data.length) break
  }
  return result
}
