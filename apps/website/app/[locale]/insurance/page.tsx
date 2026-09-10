import type { Metadata } from 'next'
import Link from 'next/link'
import { Handshake } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { PageHero } from '../components/page-hero'

export const metadata: Metadata = { title: 'التعاقدات' }

type Partner = {
  id: string
  name: string
  category: string
  logoUrl: string | null
  websiteUrl: string | null
}

async function getPartners(locale: Locale): Promise<Partner[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/content/partners?locale=${locale}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: Partner[] }).data
  } catch {
    return []
  }
}

export default async function InsurancePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const [t, partners] = await Promise.all([getDictionary(locale), getPartners(locale)])

  const groups = (['insurance', 'company', 'authority'] as const)
    .map((category) => ({ category, items: partners.filter((p) => p.category === category) }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      <PageHero title={t.insurance.title} description={t.insurance.description} />

      <section className="mx-auto max-w-6xl px-4 py-14">
        {groups.map((group, gi) => (
          <div key={group.category} className={gi > 0 ? 'mt-14' : ''} data-aos="fade-up">
            <h2 className="mb-6 text-center font-heading text-xl font-bold sm:text-2xl">
              {t.insurance.categories[group.category]}
            </h2>

            {/* logos wall */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {group.items.map((partner, i) =>
                partner.websiteUrl ? (
                  <a
                    key={partner.id}
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-aos="fade-up"
                    data-aos-delay={String((i % 4) * 75)}
                    className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:border-brand/50 hover:shadow-md"
                  >
                    <PartnerMark partner={partner} />
                  </a>
                ) : (
                  <div
                    key={partner.id}
                    data-aos="fade-up"
                    data-aos-delay={String((i % 4) * 75)}
                    className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
                  >
                    <PartnerMark partner={partner} />
                  </div>
                ),
              )}
            </div>
          </div>
        ))}

        {partners.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">—</p>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-brand/30 bg-brand-soft/60 p-8 text-center" data-aos="fade-up">
          <Handshake className="mx-auto mb-3 size-8 text-brand-deep" />
          <p className="font-heading text-lg font-bold">{t.insurance.contact}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`tel:${site.hotline}`}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-strong"
            >
              {site.hotline}
            </a>
            <Link
              href={`/${locale}/contact`}
              className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              {t.nav.contact}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function PartnerMark({ partner }: { partner: Partner }) {
  return (
    <>
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logoUrl} alt={partner.name} className="max-h-12 w-auto max-w-full object-contain" loading="lazy" />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft font-heading text-lg font-bold text-brand-deep">
          {partner.name.trim().charAt(0)}
        </span>
      )}
      <span className="text-sm font-semibold text-muted-foreground">{partner.name}</span>
    </>
  )
}
