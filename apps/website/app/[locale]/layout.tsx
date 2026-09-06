import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Cairo, Source_Sans_3 } from 'next/font/google'
import { dir, getDictionary, isLocale, locales, type Locale } from '@/lib/i18n'
import { SiteHeader } from './components/site-header'
import { Topbar } from './components/topbar'
import { SiteFooter } from './components/site-footer'
import { WhatsappButton } from './components/whatsapp-button'
import { SmoothScroll } from './components/smooth-scroll'
import { AosInit } from './components/aos-init'
import '../globals.css'

// Matches the current ABC site (abchospitaleg.com):
// Source Sans Pro for Latin, Cairo for Arabic
const sourceSans3 = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans' })
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' })

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const isAr = locale === 'ar'
  return {
    title: {
      default: isAr ? 'مستشفى ABC' : 'ABC Hospital',
      template: isAr ? '%s | مستشفى ABC' : '%s | ABC Hospital',
    },
    description: isAr
      ? 'مستشفى ABC — رعاية طبية متكاملة بأحدث التقنيات وأفضل الأطباء.'
      : 'ABC Hospital — comprehensive medical care with the latest technology and top doctors.',
    icons: { icon: '/favicon.svg' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const t = await getDictionary(locale)

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${sourceSans3.variable} ${cairo.variable}`}
    >
      <body className="bg-background text-foreground antialiased">
      <SmoothScroll>
        <AosInit />
        <div className="flex min-h-svh flex-col">
          <Topbar locale={locale} t={t} />
          <SiteHeader locale={locale} t={t} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} t={t} />
        </div>
      </SmoothScroll>
        <WhatsappButton label={t.footer.whatsapp} />
      </body>
    </html>
  )
}
