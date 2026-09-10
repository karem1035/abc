import { contentFetch } from '@/lib/content-fetch'
import { Suspense } from 'react'
import { DoctorsDirectory } from '../components/doctors-directory'
import type { Metadata } from 'next'
import { getDictionary, type Locale } from '@/lib/i18n'

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
    const res = await contentFetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: DoctorCard[] }).data
  } catch {
    return []
  }
}

async function getDepartmentNames(locale: Locale) {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await contentFetch(`${api}/departments?locale=${locale}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return ((await res.json()) as { data: Array<{ id: string; slug: string; name: string }> }).data
  } catch {
    return []
  }
}

export default async function DoctorsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const [t, doctors, departments] = await Promise.all([
    getDictionary(locale),
    getDoctors(locale),
    getDepartmentNames(locale),
  ])

  return <Suspense><DoctorsDirectory locale={locale} t={t} doctors={doctors} departments={departments} /></Suspense>
}
