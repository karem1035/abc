import Image from 'next/image'
import { getDictionary } from '@/lib/i18n'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: 'ar' | 'en' }>
}) {
  const { locale } = await params
  const t = await getDictionary(locale)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <Image src="/abc-logo.webp" alt={t.siteName} width={120} height={120} className="rounded-xl" priority />
      <h1 className="text-4xl font-bold tracking-tight">{t.siteName}</h1>
      <p className="text-muted-foreground">{t.tagline}</p>
      <p className="text-sm text-muted-foreground">
        {locale === 'ar' ? 'قيد الإنشاء — سيتم إضافة المحتوى والصفحات في الخطوات القادمة.' : 'Under construction — content and pages will be added in the next steps.'}
      </p>
    </main>
  )
}
