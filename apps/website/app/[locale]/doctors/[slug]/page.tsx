import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, UserRound } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { SlotBooking } from '../../components/doctor/slot-booking'

type Session = { weekday: number; startTime: string; endTime: string; slotMinutes: number }

type DoctorDetail = {
  id: string
  slug: string
  name: string
  title: string | null
  photoUrl: string | null
  content: string | null
  departmentSlug: string | null
  departmentName: string | null
  schedule: Session[]
}

async function getDoctor(slug: string, locale: Locale): Promise<DoctorDetail | null> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/doctors/${slug}?locale=${locale}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return ((await res.json()) as { data: DoctorDetail }).data
  } catch {
    return null
  }
}

export async function generateMetadata(props: {
  params: Promise<{ locale: Locale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await props.params
  const doc = await getDoctor(slug, locale)
  return { title: doc?.name }
}

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  const [t, doc] = await Promise.all([getDictionary(locale), getDoctor(slug, locale)])
  if (!doc) notFound()

  const ar = locale === 'ar'
  const dayNames = ar
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <>
      {/* Doctor header */}
      <section className="border-b border-border bg-muted/50">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 sm:flex-row sm:items-start" data-aos="fade-up">
          {doc.photoUrl ? (
            <Image
              src={doc.photoUrl}
              alt={doc.name}
              width={144}
              height={144}
              className="size-36 rounded-full border-4 border-brand/20 object-cover"
              priority
            />
          ) : (
            <span className="flex size-36 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <UserRound className="size-14" />
            </span>
          )}
          <div className="flex-1 text-center sm:text-start">
            <h1 className="font-heading text-3xl font-bold">{doc.name}</h1>
            {doc.title && <p className="mt-2 text-lg text-muted-foreground">{doc.title}</p>}
            {doc.departmentName && doc.departmentSlug && (
              <Link
                href={`/${locale}/departments/${doc.departmentSlug}`}
                className="mt-4 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand-deep transition-colors hover:bg-brand/30"
              >
                {doc.departmentName}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          {/* Bio from the TipTap editor */}
          {doc.content && (
            <div data-aos="fade-up">
              <article className="prose-hospital" dangerouslySetInnerHTML={{ __html: doc.content }} />
            </div>
          )}

          {/* Clinic schedule */}
          {doc.schedule.length > 0 && (
            <div data-aos="fade-up" className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
                <CalendarDays className="size-5 text-brand-deep" />
                {ar ? 'مواعيد العيادة' : 'Clinic schedule'}
              </h2>
              <ul className="divide-y divide-border">
                {doc.schedule.map((s, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-bold">{dayNames[s.weekday]}</span>
                    <span className="text-muted-foreground" dir="ltr">
                      {s.startTime} — {s.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Slot picker + booking request */}
        <SlotBooking locale={locale} t={t} doctorSlug={doc.slug} schedule={doc.schedule} />
      </section>
    </>
  )
}
