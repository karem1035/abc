import { contentFetch } from '@/lib/content-fetch'
import { staticSlugs } from '@/lib/static-content'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, ArrowUpRight } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { DirectoryHeader } from '../../components/directory/directory-header'
import { DoctorCard } from '../../components/directory/doctor-card'

type DoctorPreview = {
  id: string
  slug: string
  name: string
  title: string | null
  photoUrl: string | null
}

type DepartmentDetail = {
  id: string
  slug: string
  name: string
  description: string | null
  content: string | null
  imageUrl: string | null
  doctors: DoctorPreview[]
}

async function getDepartment(slug: string, locale: Locale): Promise<DepartmentDetail | null> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await contentFetch(`${api}/departments/${slug}?locale=${locale}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return ((await res.json()) as { data: DepartmentDetail }).data
  } catch {
    return null
  }
}

export async function generateMetadata(props: {
  params: Promise<{ locale: Locale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await props.params
  const dept = await getDepartment(slug, locale)
  return { title: dept?.name }
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  const [t, dept] = await Promise.all([getDictionary(locale), getDepartment(slug, locale)])
  if (!dept) notFound()

  const ar = locale === 'ar'
  return <div className="hospital-directory">
    <DirectoryHeader locale={locale} title={dept.name} label={ar ? 'الأقسام الطبية' : 'MEDICAL DEPARTMENTS'} description={dept.description ?? (ar ? 'تعرّف على القسم وفريق الأطباء.' : 'Discover our department and its medical team.')} />
    <section className="hospital-container hospital-department-detail">
      <div>
        <Link className="hospital-back-link" href={`/${locale}/departments`}>{ar ? 'جميع الأقسام الطبية' : 'All medical departments'}</Link>
        {dept.imageUrl && <div className="hospital-detail-image"><Image src={dept.imageUrl} alt={dept.name} fill sizes="(max-width: 800px) 100vw, 65vw" /></div>}
        {dept.content && <article className="prose-hospital hospital-detail-prose" dangerouslySetInnerHTML={{ __html: dept.content }} />}
      </div>
      <aside className="hospital-visit-panel"><Phone size={28} /><h2>{ar ? 'دعنا نساعدك في ترتيب زيارتك' : 'Let us help arrange your visit'}</h2><p>{ar ? 'تواصل مع فريقنا للاستفسار عن أطباء القسم ومواعيد العيادات.' : 'Talk to our team about the department’s doctors and clinic schedules.'}</p><a href={`tel:${site.hotline}`}><Phone size={17} />{ar ? 'اتصل بنا' : 'Call our team'}<span dir="ltr">{site.hotline}</span></a><Link href={`/${locale}/contact`}>{ar ? 'أرسل استفسارك' : 'Send an inquiry'}<ArrowUpRight size={17} /></Link></aside>
    </section>
    <section className="hospital-container hospital-department-team"><div className="hospital-section-title"><h2>{t.departments.doctorsIn}</h2><Link href={`/${locale}/doctors?dept=${encodeURIComponent(slug)}`}>{ar ? 'عرض أطباء القسم' : 'View department doctors'}</Link></div>{dept.doctors.length === 0 ? <p className="hospital-directory-empty">{t.departments.noDoctors}</p> : <div className="hospital-doctor-grid">{dept.doctors.map((doc) => <DoctorCard key={doc.id} doctor={{ ...doc, departmentName: dept.name }} locale={locale} />)}</div>}</section>
  </div>
}

export const revalidate = 300
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return staticSlugs('departments', params.locale)
}
