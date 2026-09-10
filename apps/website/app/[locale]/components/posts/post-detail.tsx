import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPost, postDate } from '@/lib/posts'
import type { Locale } from '@/lib/i18n'
import { LatestPosts } from './post-cards'
import { Comments } from './comments'
export async function postMetadata(slug:string,locale:Locale,type:'article'|'news'):Promise<Metadata> {
 const post=await getPost(slug,locale)
 if(!post||post.type!==type)return {title:locale==='ar'?'غير موجود':'Not found'}
 return {title:post.seoTitle||post.title,description:post.seoDescription||post.excerpt,openGraph:{title:post.seoTitle||post.title,description:post.seoDescription||post.excerpt,type:'article',publishedTime:post.publishedAt??undefined,modifiedTime:post.updatedAt}}
}
export async function PostDetail({locale,slug,type}:{locale:Locale;slug:string;type:'article'|'news'}) {
 const post=await getPost(slug,locale);if(!post||post.type!==type)notFound();const ar=locale==='ar';const base=`/${locale}/${type==='news'?'news':'blog'}`
 return <div className="hospital-directory"><article className="post-reading"><nav className="post-breadcrumb"><Link href={`/${locale}`}>{ar?'الرئيسية':'Home'}</Link><span>/</span><Link href={base}>{type==='news'?(ar?'الأخبار':'News'):(ar?'المدونة':'Blog')}</Link></nav><header><p className="post-kicker">{post.category&&<Link href={`${base}?category=${encodeURIComponent(post.category)}`}>{post.category}</Link>}</p><h1>{post.title}</h1><p className="post-standfirst">{post.excerpt}</p><div className="post-byline">{post.author&&<span>{post.author}</span>}<time dateTime={post.publishedAt??undefined}>{postDate(post.publishedAt,locale)}</time></div></header>{post.coverUrl&&<img className="post-reading-cover" src={post.coverUrl} alt={post.title}/>}<div className="prose-hospital post-prose" dangerouslySetInnerHTML={{__html:post.content??''}}/>{post.commentsEnabled&&<Comments slug={slug} locale={locale}/>}</article><LatestPosts locale={locale} exclude={post.id}/></div>
}
