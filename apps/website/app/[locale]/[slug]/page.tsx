import { contentFetch } from '@/lib/content-fetch'
import { staticSlugs } from '@/lib/static-content'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, type Locale } from '@/lib/i18n'
import { PageHero } from '../components/page-hero'

type CmsPage = { slug: string; title: string; content: string | null }

async function getPage(slug: string, locale: Locale): Promise<CmsPage | null> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await contentFetch(`${api}/content/pages/${slug}?locale=${locale}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return ((await res.json()) as { data: CmsPage }).data
  } catch {
    return null
  }
}

export async function generateMetadata(props: {
  params: Promise<{ locale: Locale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await props.params
  const page = await getPage(slug, locale)
  return { title: page?.title }
}

/** CMS-editable static pages (privacy, appointment-policy, …). */
export default async function CmsPageRoutePage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  const [t, page] = await Promise.all([getDictionary(locale), getPage(slug, locale)])
  if (!page) notFound()

  return (
    <>
      <PageHero title={page.title} />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div data-aos="fade-up">
          {page.content ? (
            <article className="prose-hospital" dangerouslySetInnerHTML={{ __html: page.content }} />
          ) : (
            <p className="text-center text-muted-foreground">—</p>
          )}
        </div>
      </section>
    </>
  )
}

export const revalidate = 300
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return staticSlugs('content/pages', params.locale)
}
