import type { Metadata } from 'next'
import Link from 'next/link'
import { Stethoscope } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { DirectoryHeader } from '../components/directory/directory-header'
import { DoctorCard } from '../components/directory/doctor-card'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ar' ? 'الأطباء' : 'Our doctors' }
}

type DoctorCard = {
  id: string
  slug: string
  name: string
  title: string | null
  photoUrl: string | null
  departmentSlug: string | null
  departmentName: string | null
}

async function getDoctors(locale: Locale, dept?: string): Promise<DoctorCard[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const url = new URL(`${api}/doctors`)
    url.searchParams.set('locale', locale)
    if (dept) url.searchParams.set('dept', dept)
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: DoctorCard[] }).data
  } catch {
    return []
  }
}

async function getDepartmentNames(locale: Locale) {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/departments?locale=${locale}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: Array<{ id: string; slug: string; name: string }> }).data
  } catch {
    return []
  }
}

export default async function DoctorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ dept?: string }>
}) {
  const { locale } = await params
  const { dept } = await searchParams
  const [t, doctors, departments] = await Promise.all([
    getDictionary(locale),
    getDoctors(locale, dept),
    getDepartmentNames(locale),
  ])

  const ar = locale === 'ar'
  return (
    <div className="hospital-directory">
      <DirectoryHeader locale={locale} title={t.nav.doctors} label={ar ? 'فريق مستشفى ABC' : 'THE ABC HOSPITAL TEAM'} description={ar ? 'تعرّف على أطبائنا واختر التخصص المناسب لاحتياجاتك. نحن هنا لمساعدتك في ترتيب زيارتك.' : 'Meet our doctors and find the right specialty for your needs. We’re here to help you arrange your visit.'} />
      <section className="hospital-container hospital-directory-content">
        <div className="hospital-filter-panel"><p>{ar ? 'اختر التخصص' : 'Find a doctor by specialty'}</p><nav className="hospital-filter-links" aria-label={ar ? 'تصفية حسب التخصص' : 'Filter by specialty'}><Link scroll={false} href={`/${locale}/doctors`} aria-current={!dept ? 'page' : undefined}>{t.departments.allDoctors}</Link>{departments.map((d) => <Link scroll={false} key={d.id} href={`/${locale}/doctors?dept=${encodeURIComponent(d.slug)}`} aria-current={dept === d.slug ? 'page' : undefined}>{d.name}</Link>)}</nav></div>
        <div key={dept ?? 'all'} className="filter-results-transition">
        <div className="hospital-section-title"><h2>{departments.find((d) => d.slug === dept)?.name ?? (ar ? 'أطباؤنا' : 'Our doctors')}</h2><span>{doctors.length} {ar ? 'طبيب' : doctors.length === 1 ? 'doctor' : 'doctors'}</span></div>
        <div className="hospital-doctor-grid">{doctors.map((doc) => <DoctorCard key={doc.id} doctor={doc} locale={locale} />)}</div>
        {doctors.length === 0 && <div className="hospital-directory-empty"><Stethoscope size={36} /><h3>{ar ? 'لا يوجد أطباء للعرض حالياً' : 'No doctors to display right now'}</h3><p>{ar ? 'جرّب تخصصاً آخر أو تواصل معنا لمساعدتك في اختيار الطبيب المناسب.' : 'Try another specialty or contact our team for help choosing a doctor.'}</p><Link href={`/${locale}/contact`}>{ar ? 'تواصل معنا' : 'Contact our team'}</Link></div>}
        </div>
      </section>
    </div>
  )
}
