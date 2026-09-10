import Link from 'next/link'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { getPosts, postDate, postHref, type Post } from '@/lib/posts'
import type { Locale } from '@/lib/i18n'

/** Image-forward card — used for articles/blog posts. */
export function ArticleCard({ post, locale }: { post: Post; locale: Locale }) {
  return (
    <article className="post-card">
      <Link href={postHref(post, locale)} className="post-cover" aria-label={post.title}>
        {post.coverUrl ? <img src={post.coverUrl} alt="" loading="lazy" /> : <BookOpen size={48} strokeWidth={1.2} />}
      </Link>
      <div className="post-card-copy">
        <p className="post-kicker">{post.category || (locale === 'ar' ? 'مقالات طبية' : 'Health articles')}</p>
        <h3><Link href={postHref(post, locale)}>{post.title}</Link></h3>
        <p className="post-excerpt">{post.excerpt}</p>
        <div className="post-card-bottom">
          <time dateTime={post.publishedAt ?? undefined}>{postDate(post.publishedAt, locale)}</time>
          <Link href={postHref(post, locale)} aria-label={`${locale === 'ar' ? 'اقرأ' : 'Read'} ${post.title}`}>
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** Compact date-forward row — used for hospital news. */
export function NewsCard({ post, locale }: { post: Post; locale: Locale }) {
  const date = post.publishedAt ? new Date(post.publishedAt) : null
  const day = date ? date.getDate() : ''
  const month = date
    ? date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short' })
    : ''
  return (
    <article className="news-card">
      <div className="news-card-date" aria-hidden="true">
        <strong>{day}</strong>
        <span>{month}</span>
      </div>
      <div className="news-card-copy">
        <p className="post-kicker">{post.category || (locale === 'ar' ? 'أخبار المستشفى' : 'Hospital news')}</p>
        <h3><Link href={postHref(post, locale)}>{post.title}</Link></h3>
        <p className="post-excerpt">{post.excerpt}</p>
      </div>
      <Link href={postHref(post, locale)} className="news-card-arrow" aria-label={`${locale === 'ar' ? 'اقرأ' : 'Read'} ${post.title}`}>
        <ArrowUpRight size={20} />
      </Link>
    </article>
  )
}

/** Mixed grid: articles as image cards, news as compact rows. */
export function PostCards({ posts, locale }: { posts: Post[]; locale: Locale }) {
  return (
    <div className="post-grid">
      {posts.map((post) =>
        post.type === 'news'
          ? <NewsCard key={post.id} post={post} locale={locale} />
          : <ArticleCard key={post.id} post={post} locale={locale} />,
      )}
    </div>
  )
}

/** Home filler: articles as cards, news as its own compact strip below. */
export async function LatestPosts({ locale, exclude }: { locale: Locale; exclude?: string }) {
  const ar = locale === 'ar'
  let posts: Post[] = []
  try {
    posts = (await getPosts(locale, { limit: 6 })).data.filter((post) => post.id !== exclude)
  } catch {
    return null
  }
  const articles = posts.filter((p) => p.type === 'article').slice(0, 3)
  const news = posts.filter((p) => p.type === 'news').slice(0, 2)
  if (!articles.length && !news.length) return null

  return (
    <>
      {articles.length > 0 && (
        <section className="hospital-container latest-posts">
          <div className="hospital-section-title">
            <div>
              <p className="hospital-eyebrow">{ar ? 'معلومات تهمك' : 'INFORMATION FOR YOU'}</p>
              <h2>{ar ? 'أحدث المقالات' : 'Latest health articles'}</h2>
            </div>
            <Link href={`/${locale}/blog`}>{ar ? 'استكشف المدونة' : 'Explore our blog'}</Link>
          </div>
          <div className="post-grid">{articles.map((post) => <ArticleCard key={post.id} post={post} locale={locale} />)}</div>
        </section>
      )}
      {news.length > 0 && (
        <section className="hospital-container latest-posts latest-news">
          <div className="hospital-section-title">
            <div>
              <p className="hospital-eyebrow">{ar ? 'آخر التحديثات' : 'LATEST UPDATES'}</p>
              <h2>{ar ? 'أخبار المستشفى' : 'Hospital news'}</h2>
            </div>
            <Link href={`/${locale}/news`}>{ar ? 'كل الأخبار' : 'All news'}</Link>
          </div>
          <div className="news-list">
            {news.map((post) => <NewsCard key={post.id} post={post} locale={locale} />)}
          </div>
        </section>
      )}
    </>
  )
}
