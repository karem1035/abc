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
  const [initial,topics,featuredPosts] = await Promise.all([
    getPosts(locale,{type,limit:9}),
    getPosts(locale,{type,limit:50}),
    type === 'article' ? getFeatured(locale) : Promise.resolve([]),
  ])
  const categories = [...new Set(topics.data.map(p => p.category).filter(Boolean))]
  return <Suspense><PostDirectory locale={locale} type={type} initial={initial} categories={categories} featuredPosts={featuredPosts}/></Suspense>
}
