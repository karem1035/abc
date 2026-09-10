import Link from 'next/link'
import { ArrowUpRight, Award, HeartPulse, Stethoscope, Users } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { DoctorCard } from './directory/doctor-card'

type Dept = { id: string; slug: string; name: string; description: string | null; imageUrl: string | null }
type DoctorCardData = {
  id: string; slug: string; name: string; title: string | null
  photoUrl: string | null; departmentName?: string | null; departmentSlug?: string | null
}

async function getHomeData(locale: Locale) {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  const empty = { departments: [] as Dept[], doctors: [] as DoctorCardData[] }
  try {
    const [deptRes, docRes] = await Promise.all([
      fetch(`${api}/departments?locale=${locale}`, { next: { revalidate: 120 } }),
      fetch(`${api}/doctors?locale=${locale}`, { next: { revalidate: 120 } }),
    ])
    if (!deptRes.ok || !docRes.ok) return empty
    const [depts, docs] = await Promise.all([deptRes.json(), docRes.json()])
    return {
      departments: (depts.data ?? []) as Dept[],
      doctors: (docs.data ?? []) as DoctorCardData[],
    }
  } catch {
    return empty
  }
}

/** Home page sections: about strip, departments, doctors. Matches the hospital design system. */
export async function HomeSections({ locale }: { locale: Locale }) {
  const ar = locale === 'ar'
  const { departments, doctors } = await getHomeData(locale)
  const featuredDepartments = departments.slice(0, 6)
  const featuredDoctors = doctors.slice(0, 3)

  return (
    <>
      {/* About strip */}
      <section className="hospital-container home-about">
        <div className="home-about-copy" data-aos="fade-up">
          <p className="hospital-eyebrow">{ar ? 'من نحن' : 'ABOUT ABC HOSPITAL'}</p>
          <h2>
            {ar
              ? 'أول مستشفى مستقل معتمد دوليًا في الجراحات العامة وجراحات السمنة والتجميل في مصر والشرق الأوسط وأفريقيا'
              : 'The first stand-alone internationally accredited hospital specialized in general, bariatric and plastic surgery in Egypt, the Middle East and Africa'}
          </h2>
          <p>
            {ar
              ? 'منذ ٢٠١٩ ونحن نقدم رعاية جراحية بمعايير عالمية، بفريق من الاستشاريين وأحدث المعامل وغرف العمليات — مع إدارة تمريض ورعاية منزلية عبر برنامج B-Home.'
              : 'Since 2019 we have delivered surgical care to international standards, with a team of consultants, modern labs and operating theaters — plus home nursing care through B-Home.'}
          </p>
          <ul className="home-about-marks">
            <li><Award size={18} /><span>{ar ? 'اعتماد أمريكي SRC' : 'SRC accreditation'}</span></li>
            <li><HeartPulse size={18} /><span>{ar ? 'معمل قسطرة حديث' : 'Modern cath lab'}</span></li>
            <li><Users size={18} /><span>{ar ? 'استشاريون بخبرات عالمية' : 'Internationally experienced consultants'}</span></li>
          </ul>
          <div className="home-about-actions">
            <Link href={`/${locale}/departments`} className="home-about-cta">
              {ar ? 'استكشف أقسامنا' : 'Explore departments'}
              <ArrowUpRight size={18} className="rtl:-scale-x-100" />
            </Link>
            <a href={`tel:${site.hotline}`} dir="ltr" className="home-about-phone">
              {site.hotline}
            </a>
          </div>
        </div>
        <div className="home-about-media" data-aos="fade-up" data-aos-delay="120">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000&q=80&auto=format&fit=crop"
            alt={ar ? 'مستشفى ABC' : 'ABC Hospital'}
            loading="lazy"
          />
          <span className="home-about-badge">
            <Stethoscope size={16} />
            {ar ? 'المهندسين — الجيزة' : 'MOHANDESEEN — GIZA'}
          </span>
        </div>
      </section>

      {/* Departments */}
      {featuredDepartments.length > 0 && (
        <section className="hospital-container home-departments">
          <div className="hospital-section-title" data-aos="fade-up">
            <div>
              <p className="hospital-eyebrow">{ar ? 'تخصصاتنا' : 'OUR SPECIALTIES'}</p>
              <h2>{ar ? 'أقسام المستشفى' : 'Hospital departments'}</h2>
            </div>
            <Link href={`/${locale}/departments`}>{ar ? 'كل الأقسام' : 'All departments'}</Link>
          </div>
          <div className="hospital-department-grid">
            {featuredDepartments.map((dept) => (
              <Link
                key={dept.id}
                href={`/${locale}/departments/${dept.slug}`}
                className="hospital-department-card"
                data-aos="fade-up"
              >
                <div className="hospital-department-image">
                  {dept.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dept.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <Stethoscope size={40} strokeWidth={1.3} />
                  )}
                </div>
                <div className="hospital-department-body">
                  <h2>{dept.name}</h2>
                  {dept.description && <p>{dept.description}</p>}
                  <span className="hospital-department-action">
                    {ar ? 'تعرف على القسم' : 'Explore department'}
                    <ArrowUpRight size={17} className="rtl:-scale-x-100" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Doctors */}
      {featuredDoctors.length > 0 && (
        <section className="hospital-container home-doctors">
          <div className="hospital-section-title" data-aos="fade-up">
            <div>
              <p className="hospital-eyebrow">{ar ? 'فريقنا الطبي' : 'OUR MEDICAL TEAM'}</p>
              <h2>{ar ? 'نخبة من الأطباء' : 'Leading doctors'}</h2>
            </div>
            <Link href={`/${locale}/doctors`}>{ar ? 'كل الأطباء' : 'All doctors'}</Link>
          </div>
          <div className="hospital-doctor-grid">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
