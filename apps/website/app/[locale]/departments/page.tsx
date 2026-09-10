import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Stethoscope } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { DirectoryHeader } from '../components/directory/directory-header'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ar' ? 'الأقسام الطبية' : 'Medical departments' }
}

type PublicDepartment = {
  id: string
  slug: string
  name: string
  description: string | null
  imageUrl: string | null
}

async function getDepartments(locale: Locale): Promise<PublicDepartment[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/departments?locale=${locale}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: PublicDepartment[] }).data
  } catch {
    return []
  }
}

export default async function DepartmentsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const t = await getDictionary(locale)
  const departments = await getDepartments(locale)
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  const ar = locale === 'ar'
  return <div className="hospital-directory">
    <DirectoryHeader locale={locale} title={t.departments.title} label={ar ? 'تخصصاتنا الطبية' : 'CARE FOR YOUR NEEDS'} description={ar ? 'استكشف أقسامنا الطبية وتعرّف على خدمات كل تخصص والأطباء الذين يقدمون لك الرعاية.' : 'Explore our medical departments, learn about each specialty, and meet the doctors who provide your care.'} />
    <section className="hospital-container hospital-directory-content">
      <div className="hospital-section-title"><h2>{ar ? 'ابحث عن الرعاية المناسبة' : 'Find the care you need'}</h2><span>{departments.length} {ar ? 'قسم طبي' : 'departments'}</span></div>
      <div className="hospital-department-grid">{departments.map((dept) => <Link key={dept.id} href={`/${locale}/departments/${dept.slug}`} className="hospital-department-card">
        <div className="hospital-department-image">{dept.imageUrl ? <Image src={dept.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <Stethoscope size={56} strokeWidth={1.2} />}</div>
        <div className="hospital-department-body"><h2>{dept.name}</h2><p>{dept.description || (ar ? 'تعرّف على القسم والأطباء وخيارات التواصل لترتيب زيارتك.' : 'Meet the department’s doctors and find out how to arrange your visit.')}</p><span className="hospital-department-action">{ar ? 'استكشف القسم' : 'Explore department'}<Arrow size={19} /></span></div>
      </Link>)}</div>
      {departments.length === 0 && <div className="hospital-directory-empty"><Stethoscope size={36} /><h3>{ar ? 'معلومات الأقسام غير متاحة حالياً' : 'Department information is currently unavailable'}</h3><p>{ar ? 'تواصل مع فريقنا للاستفسار عن التخصص المناسب.' : 'Please contact our team for help finding the right specialty.'}</p><Link href={`/${locale}/contact`}>{ar ? 'تواصل معنا' : 'Contact our team'}</Link></div>}
    </section>
  </div>
}
