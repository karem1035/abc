import { LatestPosts } from './components/posts/post-cards'
import { HomeHero } from './components/home-hero'
import { HomeSections } from './components/home-sections'
import type { Locale } from '@/lib/i18n'

type DeptOption = { slug: string; name: string }
type DoctorOption = { slug: string; name: string; departmentSlug: string | null }

async function getBookingOptions(locale: Locale) {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  const fallback = { departments: [] as DeptOption[], doctors: [] as DoctorOption[] }
  try {
    const [deptRes, docRes] = await Promise.all([
      fetch(`${api}/departments?locale=${locale}`, { next: { revalidate: 120 } }),
      fetch(`${api}/doctors?locale=${locale}`, { next: { revalidate: 120 } }),
    ])
    if (!deptRes.ok || !docRes.ok) return fallback
    const [depts, docs] = await Promise.all([deptRes.json(), docRes.json()])
    return {
      departments: (depts.data ?? []) as DeptOption[],
      doctors: (docs.data ?? []) as DoctorOption[],
    }
  } catch {
    return fallback
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: 'ar' | 'en' }>
}) {
  const { locale } = await params
  const { departments, doctors } = await getBookingOptions(locale)
  return <><HomeHero locale={locale} departments={departments} doctors={doctors} /><HomeSections locale={locale} /><LatestPosts locale={locale} /></>
}
