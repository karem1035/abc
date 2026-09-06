import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { PageHero } from '../components/page-hero'
import { ContactForm } from '../components/contact/contact-form'
import { ContactInfo } from '../components/contact/contact-info'
import { FaqAccordion, type FaqItem } from '../components/faq-accordion'

export async function generateMetadata(props: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getDictionary(locale)
  return { title: t.contact.title }
}

async function getFaqs(locale: Locale): Promise<FaqItem[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/contact/faqs?page=contact&locale=${locale}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const body = (await res.json()) as { data: FaqItem[] }
    return body.data
  } catch {
    return []
  }
}

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=1920&auto=format&fit=crop'

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const t = await getDictionary(locale)
  const faqs = await getFaqs(locale)

  const mapEmbed =
    'https://maps.google.com/maps?q=30.053688,31.20023&z=15&output=embed&hl=' + locale

  return (
    <>
      <PageHero title={t.contact.title} description={t.contact.description} image={HERO_IMAGE} />

      {/* Form + info column */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div data-aos="fade-up">
            <ContactForm locale={locale} t={t} />
          </div>
          <div data-aos="fade-up" data-aos-delay="150">
            <ContactInfo locale={locale} t={t} />
          </div>
        </div>
      </section>

      {/* Location map */}
      <section className="bg-muted/60 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div data-aos="fade-up" className="mb-6 text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t.contact.location}</h2>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-brand" />
              {site.address[locale]}
            </p>
          </div>
          <div data-aos="fade-up" data-aos-delay="100">
            <div className="overflow-hidden border border-border shadow-sm">
              <iframe
                src={mapEmbed}
                title={t.contact.location}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div data-aos="fade-up" className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t.contact.faq}</h2>
        </div>
        {faqs.length > 0 ? (
          <div data-aos="fade-up" data-aos-delay="100">
            <FaqAccordion items={faqs} />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">—</p>
        )}
      </section>
    </>
  )
}
