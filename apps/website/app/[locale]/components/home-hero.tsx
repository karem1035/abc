'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Phone, CalendarDays, CheckCircle2 } from 'lucide-react'
import { site } from '@/lib/site'
import type { Locale } from '@/lib/i18n'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { PhoneInput } from './ui/phone-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

// Temporary photography reused from the Astro prototype; replace with approved ABC images.
const slides = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=2000&q=80',
]
const departments = [
  { id: 'cardiology', en: 'Cardiology', ar: 'القلب والأوعية الدموية' },
  { id: 'orthopedics', en: 'Orthopedics', ar: 'العظام' },
  { id: 'internal', en: 'Internal medicine', ar: 'الباطنة' },
]

export function HomeHero({ locale }: { locale: Locale }) {
  const ar = locale === 'ar'
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [mobile, setMobile] = useState(true)
  const [department, setDepartment] = useState('')
  const [preview, setPreview] = useState(false)
  const [country, setCountry] = useState<CountryCode>('EG')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 800px)')
    const update = () => {
      setReducedMotion(query.matches)
      setMobile(mobileQuery.matches)
    }
    update()
    query.addEventListener('change', update)
    mobileQuery.addEventListener('change', update)
    return () => {
      query.removeEventListener('change', update)
      mobileQuery.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (paused || reducedMotion || mobile) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % slides.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion, mobile])

  function selectSlide(index: number) {
    setActive((index + slides.length) % slides.length)
    setPaused(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valid = Boolean(parsePhoneNumberFromString(phone, country)?.isValid())
    setPhoneError(!valid)
    setPreview(valid)
  }

  return (
    <section className="home-hero" aria-labelledby="home-hero-heading">
      <div className="home-hero-images" aria-hidden="true">
        {slides.map((src, index) => (
          // External prototype images intentionally use native loading, without a remote optimizer dependency.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className={active === index ? 'is-active' : ''} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async" />
        ))}
      </div>
      <div className="home-hero-shade" />
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow"><span />{ar ? 'مستشفى ABC · المهندسين' : 'ABC HOSPITAL · MOHANDESEEN'}</p>
          <h1 id="home-hero-heading">{ar ? 'صحتك أولاً.' : 'Your health.'}<br /><span>{ar ? 'ورعايتك اهتمامنا.' : 'Our personal commitment.'}</span></h1>
          <p className="home-hero-description">{ar ? 'رعاية تبدأ بالاستماع إليك. اختر التخصص المناسب، ودعنا نساعدك في الخطوة التالية للاطمئنان على صحتك.' : 'Care that starts with listening. Find the right specialty, and let us help you take the next step toward feeling better.'}</p>
          <a className="home-hero-call" href={`tel:${site.hotline}`}><span className="home-hero-call-icon"><Phone size={19} /></span><span><small>{ar ? 'تفضل التحدث معنا؟' : 'Prefer to speak with us?'}</small><strong dir="ltr">{site.hotline}</strong></span><ArrowUpRight size={20} className="rtl:-scale-x-100" /></a>
          <div className="home-hero-carousel" role="group" aria-label={ar ? 'صور الخلفية' : 'Background slideshow'}>
            <span className="home-hero-slide-number" aria-live="off">0{active + 1}<span> / 03</span></span>
            <div className="home-hero-dots">{slides.map((_, index) => <button type="button" key={index} onClick={() => selectSlide(index)} aria-label={ar ? `عرض الصورة ${index + 1}` : `Show image ${index + 1}`} aria-pressed={active === index}><span className={active === index ? 'is-active' : ''} /></button>)}</div>
            <button type="button" className="home-hero-control" onClick={() => selectSlide(active - 1)} aria-label={ar ? 'الصورة السابقة' : 'Previous image'}><ChevronLeft size={17} /></button>
            <button type="button" className="home-hero-control" onClick={() => selectSlide(active + 1)} aria-label={ar ? 'الصورة التالية' : 'Next image'}><ChevronRight size={17} /></button>
            {!reducedMotion && <button type="button" className="home-hero-control" onClick={() => setPaused(!paused)} aria-label={paused ? (ar ? 'تشغيل العرض' : 'Play slideshow') : (ar ? 'إيقاف العرض' : 'Pause slideshow')}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
          </div>
        </div>

        <div className="hero-booking" onFocusCapture={() => setPaused(true)}>
          <div className="hero-booking-heading"><span className="hero-booking-icon"><CalendarDays size={23} /></span><span className="hero-booking-kicker">{ar ? 'خطوتك الأولى لرعاية أفضل' : 'A LITTLE STEP. BETTER CARE.'}</span></div>
          <h2>{ar ? 'اطلب موعدك بسهولة' : 'Let’s arrange your visit.'}</h2>
          <p className="hero-booking-intro">{ar ? 'اترك بياناتك وسنتواصل معك لتأكيد الموعد.' : 'Leave your details. We’ll call to confirm your appointment.'}</p>
          <form onSubmit={submit} className="hero-booking-form">
            <div className="hero-booking-fields">
              <div className="hero-field"><label htmlFor="hero-department">{ar ? 'التخصص' : 'Department'}</label><Select value={department || 'any'} onValueChange={(value) => setDepartment(value === 'any' ? '' : value)} dir={ar ? 'rtl' : 'ltr'}><SelectTrigger id="hero-department" className="hero-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">{ar ? 'ساعدني في الاختيار' : 'Help me choose'}</SelectItem>{departments.map((item) => <SelectItem value={item.id} key={item.id}>{item[locale]}</SelectItem>)}</SelectContent></Select></div>
              <div className="hero-field"><label htmlFor="hero-doctor">{ar ? 'الطبيب' : 'Doctor'}</label><Select value="any" disabled={!department} dir={ar ? 'rtl' : 'ltr'}><SelectTrigger id="hero-doctor" className="hero-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">{ar ? 'أي طبيب مناسب' : 'Any suitable doctor'}</SelectItem></SelectContent></Select></div>
              <label htmlFor="hero-name">{ar ? 'الاسم' : 'Your name'} <span aria-hidden="true">*</span><input id="hero-name" name="name" autoComplete="name" required maxLength={100} placeholder={ar ? 'اسمك بالكامل' : 'Full name'} /></label>
              <div className="hero-phone-field"><label htmlFor="hero-phone">{ar ? 'رقم الموبايل' : 'Mobile number'} <span aria-hidden="true">*</span></label><PhoneInput id="hero-phone" locale={locale} country={country} onCountryChange={setCountry} value={phone} onChange={setPhone} invalid={phoneError} required />{phoneError && <p role="alert" className="mt-2 text-xs text-destructive">{ar ? 'أدخل رقم هاتف صحيح.' : 'Enter a valid phone number.'}</p>}</div>
            </div>
            <button className="hero-booking-submit" type="submit">{ar ? 'اطلب موعدك' : 'Request an appointment'}<ArrowUpRight size={19} className="rtl:-scale-x-100" /></button>
            <p className="hero-booking-note">{ar ? 'الموعد يتم تأكيده باتصال من فريقنا.' : 'Your appointment is confirmed by a call from our team.'}</p>
            <p className="hero-booking-preview-label">{ar ? 'نموذج للمعاينة فقط — لا يتم إرسال البيانات.' : 'Form preview only — no details are sent.'}</p>
            {preview && <div className="hero-booking-feedback" role="status"><CheckCircle2 size={19} /><span>{ar ? 'المعاينة جاهزة. لم يتم إرسال طلب أو حفظ بياناتك.' : 'Preview complete. No request was sent or details saved.'}</span></div>}
          </form>
        </div>
      </div>
      <div className="home-hero-bottom"><span>{ar ? 'رعاية أقرب إليك' : 'CARE, CLOSER TO YOU'}</span><span>{ar ? 'المهندسين، الجيزة' : 'MOHANDESEEN, GIZA'}</span></div>
    </section>
  )
}
