import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Award, Building2, HeartPulse, Microscope, ShieldCheck, Stethoscope, Syringe, Users } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { PageHero } from '../components/page-hero'

export async function generateMetadata(props: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await props.params
  return { title: locale === 'ar' ? 'من نحن' : 'About Us' }
}

const facilities = [
  { icon: Microscope, ar: 'معامل وغرف عمليات مجهزة بأحدث الأجهزة', en: 'Labs and operating theaters equipped with the latest systems' },
  { icon: HeartPulse, ar: 'معمل قسطرة القلب للتدخلات الحرجة', en: 'Cardiac catheterization lab for critical interventions' },
  { icon: ShieldCheck, ar: 'وحدة عناية مركزة بإشراف ٢٤/٧', en: 'Intensive care unit supervised 24/7' },
  { icon: Syringe, ar: 'أسطول تمريض منزلي (B-Home) في القاهرة والجيزة', en: 'B-Home nursing fleet across Cairo and Giza' },
  { icon: Building2, ar: 'موقع مركزي في المهندسين — الجيزة', en: 'Central location in Mohandeseen, Giza' },
  { icon: Users, ar: 'فريق استشاري بخبرات دولية', en: 'Consultant team with international experience' },
]

const milestones = [
  {
    year: '2019',
    image: '/about/soft-opening.jpg',
    titleAr: 'الافتتاح التجريبي',
    titleEn: 'Soft opening!',
    ar: 'بدأ العمل الكامل بالمستشفى هذا اليوم؛ عيادات الخارجية والعمليات وغرف الإقامة الداخلية بدأت في خدمة مرضانا، ومعنا فريق رائع من الاستشاريين والأطباء والممرضين. ترقبوا الافتتاح الرسمي الكبير هذا الصيف.',
    en: 'ABC Hospital is fully functional today; our outpatient clinics, operating theater and inpatient rooms started serving our patients, with a great team of consultants, doctors, and nurses. Stay tuned for our grand opening this summer.',
  },
  {
    year: '2019',
    image: '/about/accredited.jpg',
    titleAr: 'معتمدون دوليًا',
    titleEn: 'Internationally accredited!',
    ar: 'أتم مستشفى ABC زيارة لجنة اعتماد SRC بجولة كاملة داخل المستشفى وتقييم شامل، ووافقت اللجنة على اعتماد مستشفى ABC كمركز تميز في جراحة السمنة، ليصبح أول مستشفى مستقل معتمد دوليًا في جراحات السمنة.',
    en: 'ABC Hospital completed the SRC accreditation site review with a full tour and rating; the committee approved ABC as a Bariatric Center of Excellence — the first internationally accredited stand-alone bariatric hospital.',
  },
  {
    year: '2019',
    image: '/about/opening.jpg',
    titleAr: 'الافتتاح الرسمي!',
    titleEn: 'Grand opening!',
    ar: 'أقيم الافتتاح الرسمي الكبير برئاسة الدكتور كلفن هيجا رئيس الاتحاد الدولي لجراحة السمنة (IFSO)، والدكتور هيثم الفوال رئيس فرع الشرق الأوسط وأفريقيا، وبحضور صفوة الجراحين وأعز الأصدقاء، وقد شرف الافتتاح حضور شخصيات مصرية عريقة.',
    en: 'The grand opening was headed by Dr. Kelvin Higa, head of IFSO, and Dr. Hayssam El Fawal, head of the IFSO MENA chapter, with Egypt\u2019s best surgeons and dearest friends — honored by the presence of Egypt\u2019s most esteemed figures.',
  },
  {
    year: '2022',
    image: '/about/src-renewal.jpg',
    titleAr: 'الاعتماد الأمريكي SRC',
    titleEn: 'The American Accreditation (SRC)',
    ar: 'حصل المستشفى على الاعتماد الأمريكي من SRC للمرة الثانية على التوالي — أول مستشفى في مصر وأفريقيا يحصل على اعتماد SRC، تقديرًا لالتزامنا بأعلى معايير الجودة والسلامة.',
    en: 'The hospital obtained the American SRC accreditation for the second time in a row — the first hospital in Egypt and Africa to be accredited by SRC, in recognition of our commitment to the highest quality and safety standards.',
  },
]

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const t = await getDictionary(locale)
  const ar = locale === 'ar'

  return (
    <>
      <PageHero
        title={ar ? 'من نحن' : 'About ABC Hospital'}
        description={
          ar
            ? 'أول مستشفى مستقل معتمد دوليًا في الجراحات العامة وجراحات السمنة والتجميل في مصر والشرق الأوسط وأفريقيا.'
            : 'The first stand-alone internationally accredited hospital specialized in general, bariatric and plastic surgery in Egypt, the Middle East and Africa.'
        }
      />

      {/* Story + image */}
      <section className="hospital-container about-story">
        <div className="about-story-copy" data-aos="fade-up">
          <p className="hospital-eyebrow">{ar ? 'قصتنا' : 'OUR STORY'}</p>
          <h2>{ar ? 'بدأنا بفكرة واحدة: الجراحة بمعايير عالمية في مصر' : 'We started with one idea: world-class surgery in Egypt'}</h2>
          <div className="hospital-detail-prose">
            <p>
              {ar
                ? 'بدأت رحلتنا في ٢٠١٩ بافتتاح تجريبي، وتوالت المحطات: اعتماد دولي كمركز تميز في جراحة السمنة، ثم الافتتاح الرسمي برئاسة رئيس الاتحاد الدولي لجراحة السمنة IFSO — لنكون أول مستشفى مستقل متخصص في الجراحات العامة وجراحات السمنة والتجميل في مصر والشرق الأوسط وأفريقيا.'
                : 'Our journey began in 2019 with a soft opening, followed in quick succession by international accreditation as a Bariatric Center of Excellence and a grand opening headed by the president of IFSO — making us the first stand-alone hospital specialized in general, bariatric and plastic surgery in Egypt, the Middle East and Africa.'}
            </p>
            <p>
              {ar
                ? 'اليوم نخدم آلاف المرضى سنويًا عبر أقسام جراحية متخصصة ومعامل حديثة، ويمتد أثرنا خارج أسوار المستشفى عبر برنامج B-Home للرعاية المنزلية وبرنامج B-Lite للتغذية الصحية.'
                : 'Today we serve thousands of patients a year through specialized surgical departments and modern labs, and our reach extends beyond the hospital walls through the B-Home home-care program and the B-Lite nutrition system.'}
            </p>
          </div>
        </div>
        <div className="about-story-media" data-aos="fade-up" data-aos-delay="120">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1000&q=80&auto=format&fit=crop"
            alt={ar ? 'مستشفى ABC' : 'ABC Hospital'}
          />
        </div>
      </section>

      {/* Accreditation highlight */}
      <section className="about-accreditation" data-aos="fade-up">
        <div className="hospital-container about-accreditation-inner">
          <Award className="about-accreditation-icon" size={44} strokeWidth={1.5} />
          <div>
            <h2>{ar ? 'معتمدون دوليًا من SRC' : 'Internationally accredited by SRC'}</h2>
            <p>
              {ar
                ? 'أول مستشفى في مصر وأفريقيا يحصل على اعتماد Surgical Review Corporation الأمريكي كمركز تميز في جراحة السمنة — وحصلنا عليه للمرة الثانية على التوالي في ٢٠٢٢، اعترافًا عالميًا بجودة برامجنا الجراحية ومعايير سلامة المرضى.'
                : 'The first hospital in Egypt and Africa accredited by the American Surgical Review Corporation as a Bariatric Center of Excellence — renewed for the second consecutive time in 2022, global recognition of our surgical programs and patient-safety standards.'}
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="hospital-container about-timeline">
        <p className="hospital-eyebrow" data-aos="fade-up">{ar ? 'محطاتنا' : 'MILESTONES'}</p>
        <h2 className="about-timeline-title" data-aos="fade-up">{ar ? 'رحلة مستمرة من التميز' : 'A continuing journey'}</h2>
        <ol className="about-milestones">
          {milestones.map((item, i) => (
            <li key={i} data-aos="fade-up" data-aos-delay={String((i % 2) * 100)}>
              <div className="about-milestone-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={ar ? item.titleAr : item.titleEn} loading="lazy" />
                <span className="about-milestone-year" dir="ltr">{item.year}</span>
              </div>
              <div className="about-milestone-copy">
                <h3>{ar ? item.titleAr : item.titleEn}</h3>
                <p>{ar ? item.ar : item.en}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Facilities */}
      <section className="hospital-container about-facilities">
        <div className="hospital-section-title" data-aos="fade-up">
          <div>
            <p className="hospital-eyebrow">{ar ? 'مرافقنا' : 'OUR FACILITIES'}</p>
            <h2>{ar ? 'بنية تحتية بمعايير عالمية' : 'Infrastructure to international standards'}</h2>
          </div>
        </div>
        <div className="about-facilities-grid">
          {facilities.map((f, i) => (
            <div key={i} className="about-facility" data-aos="fade-up" data-aos-delay={String((i % 3) * 80)}>
              <span className="about-facility-icon"><f.icon size={22} strokeWidth={1.6} /></span>
              <p>{ar ? f.ar : f.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="hospital-container about-cta" data-aos="fade-up">
        <Stethoscope size={34} className="about-cta-icon" />
        <h2>{ar ? 'جاهزون لرعايتك' : 'Ready to care for you'}</h2>
        <p>{ar ? 'اطلب موعدك وسيتواصل معك فريقنا لتأكيد الزيارة.' : 'Request an appointment and our team will call you to confirm your visit.'}</p>
        <div className="about-cta-actions">
          <a href={`tel:${site.hotline}`} dir="ltr" className="home-about-cta">{site.hotline}</a>
          <Link href={`/${locale}/doctors`} className="about-cta-secondary">
            {ar ? 'تعرف على أطبائنا' : 'Meet our doctors'}
            <ArrowUpRight size={17} className="rtl:-scale-x-100" />
          </Link>
        </div>
      </section>
    </>
  )
}
