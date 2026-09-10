import Image from 'next/image'
import Link from 'next/link'
import { Phone, UserRound } from 'lucide-react'
import { site } from '@/lib/site'
import type { Locale } from '@/lib/i18n'

export function DoctorCard({ doctor, locale }: { doctor: { name: string; title: string | null; photoUrl: string | null; departmentName?: string | null; departmentSlug?: string | null }; locale: Locale }) {
  return <article className="hospital-doctor-card">
    <div className="hospital-doctor-photo">{doctor.photoUrl ? <Image src={doctor.photoUrl} alt={doctor.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <div className="hospital-doctor-placeholder"><UserRound size={88} strokeWidth={1} /><span>{locale === 'ar' ? 'مستشفى ABC' : 'ABC HOSPITAL'}</span></div>}</div>
    <div className="hospital-doctor-body">
      {doctor.departmentName && (doctor.departmentSlug ? <Link className="hospital-specialty" href={`/${locale}/departments/${doctor.departmentSlug}`}>{doctor.departmentName}</Link> : <p className="hospital-specialty">{doctor.departmentName}</p>)}
      <h3>{doctor.name}</h3>
      {doctor.title && <p className="hospital-doctor-title">{doctor.title}</p>}
      <a className="hospital-doctor-action" href={`tel:${site.hotline}`}><Phone size={17} />{locale === 'ar' ? 'اتصل لحجز موعد' : 'Call to arrange a visit'}<span dir="ltr">{site.hotline}</span></a>
    </div>
  </article>
}
