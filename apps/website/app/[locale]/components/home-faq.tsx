import { contentFetch } from '@/lib/content-fetch'
import type { Locale } from '@/lib/i18n'
import { FaqAccordion, type FaqItem } from './faq-accordion'

export async function HomeFaq({ locale }: { locale: Locale }) {
  const ar = locale === 'ar'
  let items: FaqItem[] = []
  try {
    const response = await contentFetch(`${process.env.API_URL ?? 'http://localhost:3000/v1'}/contact/faqs?page=home&locale=${locale}`, { next: { revalidate: 60 } })
    if (response.ok) items = (await response.json()).data
  } catch {}
  if (!items.length) items = [
    { id: 'booking', question: ar ? 'كيف أحجز موعدًا؟' : 'How do I book an appointment?', answer: ar ? 'اختر الطبيب واليوم والوقت المتاح، ثم أدخل اسمك ورقم هاتفك. سيتواصل معك فريقنا لتأكيد الموعد.' : 'Choose a doctor, an available date and time, then enter your name and phone number. Our team will call to confirm.' },
    { id: 'confirmation', question: ar ? 'هل طلب الموعد يعني تأكيد الحجز؟' : 'Is my appointment confirmed immediately?', answer: ar ? 'الطلب مبدئي حتى يتواصل معك فريق المستشفى لتأكيد التفاصيل.' : 'Your request is provisional until our hospital team contacts you to confirm the details.' },
  ]
  return <section className="hospital-container home-faq"><div className="hospital-section-title"><div><p className="hospital-eyebrow">{ar ? 'نجيب عن أسئلتك' : 'HERE TO HELP'}</p><h2>{ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2></div></div><FaqAccordion items={items} /></section>
}
