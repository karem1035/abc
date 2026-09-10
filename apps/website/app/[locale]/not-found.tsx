'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Localized 404 — locale detected from the URL segment. */
export default function NotFound() {
  const pathname = usePathname() || '/ar'
  const locale = pathname.split('/')[1] === 'en' ? 'en' : 'ar'
  const ar = locale === 'ar'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-7xl font-bold text-brand" dir="ltr">404</p>
      <h1 className="font-heading text-2xl font-bold">
        {ar ? 'الصفحة غير موجودة' : 'Page not found'}
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {ar
          ? 'يبدو أن الرابط غير صحيح أو أن الصفحة تم نقلها.'
          : 'The link seems incorrect, or the page has moved.'}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-strong"
      >
        {ar ? 'العودة للرئيسية' : 'Back to home'}
      </Link>
    </main>
  )
}
