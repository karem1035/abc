import { contentFetch } from '@/lib/content-fetch'
import { Suspense } from 'react'
import { getPosts, type Post } from '@/lib/posts'
import type { Locale } from '@/lib/i18n'
import { PostDirectory } from './post-directory'
async function getFeatured(locale: Locale): Promise<Post[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await contentFetch(`${api}/posts/featured?locale=${locale}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: Post[] }).data
  } catch {
    return []
  }
}

export async function PostList({locale,type}:{locale:Locale;type:'article'|'news'}) {
  // tolerate an unreachable API (e.g. docker build without the backend) —
  // pages fill in on demand at runtime
  let initial: Awaited<ReturnType<typeof getPosts>> = { data: [], total: 0, page: 1, limit: 9 }
  let categories: string[] = []
  let featuredPosts: Awaited<ReturnType<typeof getFeatured>> = []
  try {
    const [initialResult, topics, featured] = await Promise.all([
      getPosts(locale, { type, limit: 9 }),
      getPosts(locale, { type, limit: 50 }),
      type === 'article' ? getFeatured(locale) : Promise.resolve([]),
    ])
    initial = initialResult
    categories = [...new Set(topics.data.map(p => p.category).filter(Boolean))]
    featuredPosts = featured
  } catch {}
  return <Suspense><PostDirectory locale={locale} type={type} initial={initial} categories={categories} featuredPosts={featuredPosts}/></Suspense>
}
