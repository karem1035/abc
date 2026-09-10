import Link from 'next/link'
import { Search, BookOpen, Sparkles } from 'lucide-react'
import { getPosts, type Post } from '@/lib/posts'
import type { Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { DirectoryHeader } from '../directory/directory-header'
import { ArticleCard, NewsCard } from './post-cards'

async function getFeatured(locale: Locale): Promise<Post[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/posts/featured?locale=${locale}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: Post[] }).data
  } catch {
    return []
  }
}

export async function PostList({ locale, type, search }: { locale: Locale; type: 'article' | 'news'; search: { q?: string; page?: string; category?: string } }) {
  const ar = locale === 'ar'
  const page = Math.max(1, Math.min(10000, Number.parseInt(search.page ?? '1', 10) || 1))
  const q = (search.q ?? '').slice(0, 100)
  const category = (search.category ?? '').slice(0, 100)
  const base = `/${locale}/${type === 'news' ? 'news' : 'blog'}`

  let result
  try { result = await getPosts(locale, { type, page, q, category: category || undefined, limit: 9 }) }
  catch {
    return <div className="hospital-container hospital-directory-empty"><h1>{ar ? 'تعذر تحميل المنشورات' : 'Unable to load posts'}</h1><p>{ar ? 'يرجى المحاولة مرة أخرى بعد قليل.' : 'Please try again in a moment.'}</p><Link href={base}>{ar ? 'إعادة المحاولة' : 'Try again'}</Link></div>
  }

  // distinct localized categories for the sidebar filter (blog only)
  let categories: string[] = []
  if (type === 'article') {
    try { categories = [...new Set((await getPosts(locale, { type, limit: 50 })).data.map(p => p.category).filter(Boolean))] } catch {}
  }
  // featured strip only on the unfiltered first page of the blog
  const featured = type === 'article' && !q && !category && page === 1 ? await getFeatured(locale) : []
  const pageHref = (next: number) => `${base}?${new URLSearchParams({ q, category, page: String(next) })}`
  const categoryHref = (value?: string) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), ...(value ? { category: value } : {}) })}`

  return (
    <div className="hospital-directory">
      <DirectoryHeader locale={locale} title={type === 'news' ? (ar ? 'أخبار المستشفى' : 'Hospital news') : (ar ? 'المدونة والمقالات الطبية' : 'Health articles & blog')} label={ar ? 'معلومات تهمك' : 'INFORMATION FOR YOU'} description={type === 'news' ? (ar ? 'آخر الأخبار والفعاليات والتحديثات من مستشفى ABC.' : 'The latest news, events, and updates from ABC Hospital.') : (ar ? 'مقالات ومعلومات صحية يشاركها فريق المستشفى لمساعدتك على فهم رعايتك.' : 'Health articles and information shared by our hospital team to help you understand your care.')} />

      {/* Featured — big editorial cards on desktop, normal cards on mobile */}
      {featured.length > 0 && (
        <section className="hospital-container featured-posts" aria-label={ar ? 'مقالات مختارة' : 'Featured articles'}>
          <div className="hospital-section-title">
            <div>
              <p className="hospital-eyebrow">{ar ? 'اختيارات المحرر' : "EDITORS' PICKS"}</p>
              <h2>{ar ? 'مقالات مختارة' : 'Featured articles'}</h2>
            </div>
          </div>
          <div className="featured-grid">
            {featured.map(post => (
              <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="featured-card">
                <div className="featured-cover">
                  {post.coverUrl ? <img src={post.coverUrl} alt="" loading="lazy" /> : <BookOpen size={48} strokeWidth={1.2} />}
                </div>
                <div className="featured-copy">
                  <p className="post-kicker">{post.category}</p>
                  <h3>{post.title}</h3>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <span className="featured-cta">{ar ? 'اقرأ المقال' : 'Read article'} →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="hospital-container latest-posts">
        <div className="post-toolbar">
          <nav aria-label={ar ? 'نوع المنشورات' : 'Post type'}>
            <Link href={`/${locale}/blog`} aria-current={type === 'article' ? 'page' : undefined}>{ar ? 'المقالات' : 'Articles'}</Link>
            <Link href={`/${locale}/news`} aria-current={type === 'news' ? 'page' : undefined}>{ar ? 'الأخبار' : 'News'}</Link>
          </nav>
        </div>

        <div className="post-layout">
          {/* main column */}
          <div>
            {result.data.length ? (
              type === 'news'
                ? <div className="news-list">{result.data.map(post => <NewsCard key={post.id} post={post} locale={locale} />)}</div>
                : <div className="post-grid post-grid-2">{result.data.map(post => <ArticleCard key={post.id} post={post} locale={locale} />)}</div>
            ) : (
              <div className="hospital-directory-empty">
                <BookOpen size={35} />
                <h2>{q ? (ar ? 'لا توجد نتائج' : 'No matching posts') : (ar ? 'لا توجد منشورات حالياً' : 'No posts published yet')}</h2>
                <p>{ar ? 'تصفح الأخبار أو عد قريباً للاطلاع على جديدنا.' : 'Explore our news or check back for updates.'}</p>
                {q && <Link href={base}>{ar ? 'مسح البحث' : 'Clear search'}</Link>}
              </div>
            )}
            {result.total > 9 && (
              <nav className="post-pagination" aria-label={ar ? 'صفحات النتائج' : 'Pagination'}>
                {page > 1 && <Link href={pageHref(page - 1)}>{ar ? 'السابق' : 'Previous'}</Link>}
                <span>{page} / {Math.ceil(result.total / 9)}</span>
                {page * 9 < result.total && <Link href={pageHref(page + 1)}>{ar ? 'التالي' : 'Next'}</Link>}
              </nav>
            )}
          </div>

          {/* sidebar: search + categories + promo pic */}
          <aside className="post-sidebar">
            <form action={base} className="post-sidebar-search">
              <label htmlFor="post-search" className="sr-only">{ar ? 'بحث' : 'Search'}</label>
              <input id="post-search" name="q" defaultValue={q} maxLength={100} placeholder={ar ? 'ابحث عن موضوع…' : 'Search a topic…'} />
              {category && <input type="hidden" name="category" value={category} />}
              <button aria-label={ar ? 'بحث' : 'Search'}><Search size={18} /></button>
            </form>

            {categories.length > 0 && (
              <nav className="post-sidebar-categories" aria-label={ar ? 'تصفية حسب التصنيف' : 'Filter by category'}>
                <h3>{ar ? 'التصنيفات' : 'Topics'}</h3>
                <Link href={categoryHref()} aria-current={!category ? 'page' : undefined}>{ar ? 'كل التصنيفات' : 'All topics'}</Link>
                {categories.map(cat => (
                  <Link key={cat} href={categoryHref(cat)} aria-current={category === cat ? 'page' : undefined}>{cat}</Link>
                ))}
              </nav>
            )}

            {/* promo picture card */}
            <div className="post-sidebar-promo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=700&q=80&auto=format&fit=crop" alt={ar ? 'مستشفى ABC' : 'ABC Hospital'} loading="lazy" />
              <div>
                <p className="hospital-eyebrow">{ar ? 'فريقنا جاهز لمساعدتك' : 'OUR TEAM IS HERE FOR YOU'}</p>
                <strong>{ar ? 'احجز موعدك بسهولة' : 'Book your visit with ease'}</strong>
                <a href={`tel:${site.hotline}`} className="post-sidebar-promo-cta" dir="ltr">{site.hotline}</a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
