'use client'
import Link from 'next/link'
import { useState } from 'react'
import { QueryState } from './query-state'
import { Stethoscope } from 'lucide-react'
import type { Dictionary, Locale } from '@/lib/i18n'
import { DirectoryHeader } from './directory/directory-header'
import { DoctorCard } from './directory/doctor-card'
type DoctorCard = {
  id: string
  slug: string
  name: string
  title: string | null
  photoUrl: string | null
  departmentSlug: string | null
  departmentName: string | null
}

export function DoctorsDirectory({ locale, t, doctors, departments }: { locale: Locale; t: Dictionary; doctors: DoctorCard[]; departments: { id: string; slug: string; name: string }[] }) {
 const [query, setQuery] = useState('')
 const dept = new URLSearchParams(query).get('dept') ?? undefined
 const filteredDoctors = dept ? doctors.filter(d => d.departmentSlug === dept) : doctors
  const ar = locale === 'ar'
  return (
    <div className="hospital-directory">
      <QueryState onChange={setQuery} />
      <DirectoryHeader locale={locale} title={t.nav.doctors} label={ar ? 'فريق مستشفى ABC' : 'THE ABC HOSPITAL TEAM'} description={ar ? 'تعرّف على أطبائنا واختر التخصص المناسب لاحتياجاتك. نحن هنا لمساعدتك في ترتيب زيارتك.' : 'Meet our doctors and find the right specialty for your needs. We’re here to help you arrange your visit.'} />
      <section className="hospital-container hospital-directory-content">
        <div className="hospital-filter-panel"><p>{ar ? 'اختر التخصص' : 'Find a doctor by specialty'}</p><nav className="hospital-filter-links" aria-label={ar ? 'تصفية حسب التخصص' : 'Filter by specialty'}><Link scroll={false} href={`/${locale}/doctors`} aria-current={!dept ? 'page' : undefined}>{t.departments.allDoctors}</Link>{departments.map((d) => <Link scroll={false} key={d.id} href={`/${locale}/doctors?dept=${encodeURIComponent(d.slug)}`} aria-current={dept === d.slug ? 'page' : undefined}>{d.name}</Link>)}</nav></div>
        <div key={dept ?? 'all'} className="filter-results-transition">
        <div className="hospital-section-title"><h2>{departments.find((d) => d.slug === dept)?.name ?? (ar ? 'أطباؤنا' : 'Our doctors')}</h2><span>{filteredDoctors.length} {ar ? 'طبيب' : filteredDoctors.length === 1 ? 'doctor' : 'doctors'}</span></div>
        <div className="hospital-doctor-grid">{filteredDoctors.map((doc) => <DoctorCard key={doc.id} doctor={doc} locale={locale} />)}</div>
        {filteredDoctors.length === 0 && <div className="hospital-directory-empty"><Stethoscope size={36} /><h3>{ar ? 'لا يوجد أطباء للعرض حالياً' : 'No doctors to display right now'}</h3><p>{ar ? 'جرّب تخصصاً آخر أو تواصل معنا لمساعدتك في اختيار الطبيب المناسب.' : 'Try another specialty or contact our team for help choosing a doctor.'}</p><Link href={`/${locale}/contact`}>{ar ? 'تواصل معنا' : 'Contact our team'}</Link></div>}
        </div>
      </section>
    </div>
  )
}
