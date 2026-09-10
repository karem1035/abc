import type { Metadata } from 'next'
import { ArrowUpRight, MapPin, Phone, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { getDictionary, type Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { ContactForm } from '../components/contact/contact-form'
import { ContactInfo } from '../components/contact/contact-info'
import { FaqAccordion, type FaqItem } from '../components/faq-accordion'

export async function generateMetadata(props: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getDictionary(locale)
  return { title: t.contact.title }
}

async function getFaqs(locale: Locale): Promise<FaqItem[]> {
  const api = process.env.API_URL ?? 'http://localhost:3000/v1'
  try {
    const res = await fetch(`${api}/contact/faqs?page=contact&locale=${locale}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const body = (await res.json()) as { data: FaqItem[] }
    return body.data
  } catch {
    return []
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const t = await getDictionary(locale)
  const faqs = await getFaqs(locale)

  const mapEmbed =
    'https://maps.google.com/maps?q=30.053688,31.20023&z=15&output=embed&hl=' + locale

  const ar = locale === 'ar'
  const directions = 'https://www.google.com/maps/search/?api=1&query=30.053688,31.20023'

  return (
    <div className="contact-page">
      <section className="contact-masthead">
        <div className="contact-container">
          <nav className="contact-breadcrumb" aria-label={ar ? 'مسار الصفحة' : 'Breadcrumb'}><Link href={`/${locale}`}>{ar ? 'الرئيسية' : 'Home'}</Link><span>/</span><span>{t.contact.title}</span></nav>
          <div className="contact-masthead-grid">
            <div><p className="contact-eyebrow">{ar ? 'نحن هنا من أجلك' : 'LET’S TALK ABOUT YOUR CARE'}</p><h1>{ar ? 'تواصل معنا.' : 'A conversation.'}<br /><span>{ar ? 'نحن هنا لنساعدك.' : 'A little reassurance.'}</span></h1></div>
            <p className="contact-lead">{ar ? 'لديك سؤال أو تحتاج مساعدة في ترتيب زيارتك؟ اختر الطريقة الأنسب لك للتواصل مع فريق مستشفى ABC.' : 'A question on your mind, or a visit to arrange? Choose the way that works for you to reach the ABC Hospital team.'}</p>
          </div>
          <div className="contact-quick-links">
            <a href={`tel:${site.hotline}`}><Phone size={22} /><span><small>{ar ? 'اتصل بنا' : 'Give us a call'}</small><strong dir="ltr">{site.hotline}</strong></span><ArrowUpRight className="contact-link-arrow" size={20} /></a>
            <a href={`https://wa.me/${site.whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={22} /><span><small>{ar ? 'تواصل عبر واتساب' : 'Message our team'}</small><strong>{ar ? 'واتساب' : 'WhatsApp'}</strong></span><ArrowUpRight className="contact-link-arrow" size={20} /></a>
            <a href="#location"><MapPin size={22} /><span><small>{ar ? 'خطط لزيارتك' : 'Find your way here'}</small><strong>{ar ? 'المهندسين، الجيزة' : 'Mohandeseen, Giza'}</strong></span><ArrowUpRight className="contact-link-arrow" size={20} /></a>
          </div>
        </div>
      </section>

      <section className="contact-container contact-main-grid" aria-label={t.contact.title}>
        <aside className="contact-sidebar">
          <p className="contact-eyebrow">{ar ? 'لنبدأ بالتواصل' : 'HERE TO HELP'}</p>
          <h2>{ar ? 'كل سؤال يستحق اهتمامنا.' : 'Every question deserves our attention.'}</h2>
          <p>{ar ? 'استفسار عام، حجز موعد أو مشاركة رأيك — أخبرنا كيف يمكننا مساعدتك.' : 'An inquiry, an appointment, or feedback about your experience. Tell us how we can help.'}</p>
          <ContactInfo locale={locale} t={t} />
          <div className="contact-urgent"><Phone size={18} /><p>{ar ? 'للمساعدة العاجلة، يرجى الاتصال مباشرة بدلاً من انتظار الرد على الرسالة.' : 'For urgent assistance, please call directly rather than wait for a message response.'}<a href={`tel:${site.emergency}`} dir="ltr">{site.emergency}</a></p></div>
        </aside>
        <ContactForm locale={locale} t={t} />
      </section>

      <section className="contact-container contact-location" id="location" aria-labelledby="location-title">
        <div className="contact-location-copy"><p className="contact-eyebrow">{ar ? 'نتطلع لاستقبالك' : 'COME SAY HELLO'}</p><h2 id="location-title">{ar ? 'رعاية قريبة منك.' : 'Good care. Close to home.'}</h2><p>{site.address[locale]}</p><a href={directions} target="_blank" rel="noopener noreferrer" className="contact-directions">{ar ? 'احصل على الاتجاهات' : 'Get directions'}<ArrowUpRight size={19} /></a><span className="contact-location-caption"><MapPin size={15} />{ar ? 'مستشفى ABC · المهندسين' : 'ABC Hospital · Mohandeseen'}</span></div>
        <iframe src={mapEmbed} title={t.contact.location} className="contact-map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </section>

      <section className="contact-container contact-faq" aria-labelledby="contact-faq-title">
        <div><p className="contact-eyebrow">{ar ? 'معلومات تساعدك' : 'A FEW HELPFUL ANSWERS'}</p><h2 id="contact-faq-title">{t.contact.faq}</h2><p>{ar ? 'هل لديك سؤال آخر؟ يسعد فريقنا بمساعدتك.' : 'Still have something on your mind? Our team is happy to help.'}</p><a href={`tel:${site.hotline}`}>{ar ? 'تحدث مع فريقنا' : 'Speak with our team'}<ArrowUpRight size={17} /></a></div>
        <div>{faqs.length > 0 ? <FaqAccordion items={faqs} /> : <div className="contact-faq-empty"><MessageCircle size={27} /><h3>{ar ? 'سؤالك مهم لنا' : 'Your question matters.'}</h3><p>{ar ? 'تواصل معنا للاستفسار عن زيارتك أو الخدمات المتاحة.' : 'Get in touch for help with your visit or the services available.'}</p><a href="#contact-name">{ar ? 'أرسل لنا سؤالك' : 'Send us your question'}<ArrowUpRight size={17} /></a></div>}</div>
      </section>
    </div>
  )
}
