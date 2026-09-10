import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

export function DirectoryHeader({ locale, title, description, label }: { locale: Locale; title: string; description: string; label: string }) {
  return <header className="hospital-directory-header"><div className="hospital-container">
    <nav aria-label={locale === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}><Link href={`/${locale}`}>{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link><span>/</span><span>{title}</span></nav>
    <div className="hospital-directory-heading"><div><p className="hospital-eyebrow">{label}</p><h1>{title}</h1><p className="hospital-directory-description">{description}</p></div><div className="hospital-header-mark" aria-hidden="true"><Plus strokeWidth={1} /></div></div>
  </div></header>
}
