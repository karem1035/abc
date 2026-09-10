import Link from 'next/link'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { getPosts, postDate, postHref, type Post } from '@/lib/posts'
import type { Locale } from '@/lib/i18n'
export function PostCards({posts,locale}:{posts:Post[];locale:Locale}) {
 return <div className="post-grid">{posts.map(post=><article className="post-card" key={post.id}><Link href={postHref(post,locale)} className="post-cover" aria-label={post.title}>{post.coverUrl?<img src={post.coverUrl} alt="" loading="lazy"/>:<BookOpen size={48} strokeWidth={1.2}/>}</Link><div className="post-card-copy"><p className="post-kicker">{post.category||(post.type==='news'?(locale==='ar'?'أخبار المستشفى':'Hospital news'):(locale==='ar'?'مقالات طبية':'Health articles'))}</p><h3><Link href={postHref(post,locale)}>{post.title}</Link></h3><p className="post-excerpt">{post.excerpt}</p><div className="post-card-bottom"><time dateTime={post.publishedAt??undefined}>{postDate(post.publishedAt,locale)}</time><Link href={postHref(post,locale)} aria-label={`${locale==='ar'?'اقرأ':'Read'} ${post.title}`}><ArrowUpRight size={20}/></Link></div></div></article>)}</div>
}
export async function LatestPosts({locale,exclude}:{locale:Locale;exclude?:string}) {
 let posts:Post[]=[]
 try {posts=(await getPosts(locale,{limit:4})).data.filter(post=>post.id!==exclude).slice(0,3)} catch {return null}
 if(!posts.length)return null
 return <section className="hospital-container latest-posts"><div className="hospital-section-title"><div><p className="hospital-eyebrow">{locale==='ar'?'من مستشفى ABC':'FROM ABC HOSPITAL'}</p><h2>{locale==='ar'?'أحدث المقالات والأخبار':'Latest articles & news'}</h2></div><Link href={`/${locale}/blog`}>{locale==='ar'?'استكشف المدونة':'Explore our blog'}</Link></div><PostCards posts={posts} locale={locale}/></section>
}
