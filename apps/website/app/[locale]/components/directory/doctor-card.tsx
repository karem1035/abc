import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, UserRound } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

export function DoctorCard({ doctor, locale }: { doctor: { name: string; slug?: string; title: string | null; photoUrl: string | null; departmentName?: string | null; departmentSlug?: string | null }; locale: Locale }) {
  const ar = locale === 'ar'
  const profileHref = doctor.slug ? `/${locale}/doctors/${doctor.slug}` : null

  return <article className="hospital-doctor-card">
    {profileHref ? (
      <Link className="hospital-doctor-link" href={profileHref} aria-label={doctor.name}>
        <div className="hospital-doctor-photo">{doctor.photoUrl ? <Image src={doctor.photoUrl} alt={doctor.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <div className="hospital-doctor-placeholder"><UserRound size={88} strokeWidth={1} /><span>{ar ? 'مستشفى ABC' : 'ABC HOSPITAL'}</span></div>}</div>
        <div className="hospital-doctor-body">
          <span className="hospital-doctor-name">{doctor.name}</span>
          {doctor.title && <span className="hospital-doctor-title">{doctor.title}</span>}
        </div>
      </Link>
    ) : (
      <div>
        <div className="hospital-doctor-photo">{doctor.photoUrl ? <Image src={doctor.photoUrl} alt={doctor.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <div className="hospital-doctor-placeholder"><UserRound size={88} strokeWidth={1} /><span>{ar ? 'مستشفى ABC' : 'ABC HOSPITAL'}</span></div>}</div>
        <div className="hospital-doctor-body">
          <span className="hospital-doctor-name">{doctor.name}</span>
          {doctor.title && <span className="hospital-doctor-title">{doctor.title}</span>}
        </div>
      </div>
    )}
    <div className="hospital-doctor-footer">
      {doctor.departmentName && (doctor.departmentSlug ? <Link className="hospital-specialty" href={`/${locale}/departments/${doctor.departmentSlug}`}>{doctor.departmentName}</Link> : <p className="hospital-specialty">{doctor.departmentName}</p>)}
      {profileHref && (
        <Link className="hospital-doctor-cta" href={profileHref}>
          <CalendarDays size={16} />
          {ar ? 'اطلب حجزًا' : 'Request a visit'}
          <ArrowUpRight size={15} className="hospital-doctor-cta-arrow" />
        </Link>
      )}
    </div>
  </article>
}
