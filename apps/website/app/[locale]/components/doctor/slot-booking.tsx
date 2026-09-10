'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Check, Clock, Loader2 } from 'lucide-react'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { useEffect, useMemo, useState } from 'react'
import type { Dictionary, Locale } from '@/lib/i18n'
import { formatTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { PhoneInput } from '../ui/phone-input'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1'

type Session = { weekday: number; startTime: string; endTime: string; slotMinutes: number }

function fmtDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Next `count` dates on any of the given weekdays (0=Sunday), starting tomorrow. */
function upcomingDays(weekdays: number[], count = 30, maxDays = 30) {
  const days: Date[] = []
  const cursor = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())}T12:00:00`)
  cursor.setDate(cursor.getDate() + 1)
  for (let i = 0; i < maxDays && days.length < count; i++) {
    if (weekdays.includes(cursor.getDay())) days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function SlotBooking({
  locale,
  t,
  doctorSlug,
  schedule,
}: {
  locale: Locale
  t: Dictionary
  doctorSlug: string
  schedule: Session[]
}) {
  const ar = locale === 'ar'
  const dayNames = ar
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const days = useMemo(() => mounted ? upcomingDays([...new Set(schedule.map(s => s.weekday))]) : [], [mounted, schedule])
  const [datePage, setDatePage] = useState(0)

  const [date, setDate] = useState<string>(days[0] ? fmtDate(days[0]) : '')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => { setDate(days[0] ? fmtDate(days[0]) : ''); setDatePage(0) }, [days, doctorSlug])
  const [slot, setSlot] = useState('')

  const [name, setName] = useState('')
  const [country, setCountry] = useState<CountryCode>('EG')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState(false)

  // fetch slots whenever the selected date changes
  useEffect(() => {
    if (!date) return
    const controller = new AbortController()
    setLoadingSlots(true)
    setSlotsError(false)
    setSlots([])
    setSlot('')
    fetch(`${API_URL}/doctors/${doctorSlug}/slots?date=${date}`, { signal: controller.signal, cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('Unavailable'); return r.json() })
      .then((body: { data: { slots: string[] } }) => { if (!controller.signal.aborted) setSlots(body.data?.slots ?? []) })
      .catch(() => { if (!controller.signal.aborted) setSlotsError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false) })
    return () => controller.abort()
  }, [date, doctorSlug, retry])

  function changeDatePage(next: number) {
    const first = days[next * 6]
    if (!first) return
    setDatePage(next)
    setSlot('')
    setSlots([])
    setLoadingSlots(true)
    setDate(fmtDate(first))
  }

  async function submit() {
    setServerError(false)
    const parsed = parsePhoneNumberFromString(phone, country)
    const valid = Boolean(parsed?.isValid())
    setPhoneError(!valid)
    if (!valid || !slot || loadingSlots || name.trim().length < 2 || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/bookings/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: name.trim(),
          phone: parsed?.number ?? phone,
          doctorSlug,
          date,
          time: slot,
        }),
      })
      if (!res.ok) throw new Error('failed')
      setSent(true)
    } catch {
      setServerError(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (schedule.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-6" data-aos="fade-up">
      <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-bold">
        <CalendarDays className="size-5 text-brand-deep" />
        {ar ? 'احجز مع الطبيب' : 'Book with this doctor'}
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        {ar
          ? 'اختر اليوم والموعد المتاح، وسنتواصل معك للتأكيد.'
          : 'Pick a day and an available time — we will call you to confirm.'}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="flex size-14 items-center justify-center rounded-full bg-success/15"
            >
              <Check className="size-7 text-success" strokeWidth={3} />
            </motion.span>
            <p className="font-bold">{ar ? 'تم استلام طلبك' : 'Request received'}</p>
            <p className="text-sm text-muted-foreground">
              {ar
                ? `موعدك المبدئي: ${formatTime(slot, locale)} — ${date}. سيتواصل معك فريقنا للتأكيد.`
                : `Provisional appointment: ${date} at ${formatTime(slot, locale)}. Our team will call to confirm.`}
            </p>
          </motion.div>
        ) : (
          <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{ar ? '١. اختر اليوم' : '1. Choose a date'}</h3>
              <div className="flex gap-2">
                <button type="button" className="min-h-11 rounded-lg border px-3 disabled:opacity-40" disabled={datePage === 0} onClick={() => changeDatePage(datePage - 1)}>{ar ? 'السابق' : 'Earlier'}</button>
                <button type="button" className="min-h-11 rounded-lg border px-3 disabled:opacity-40" disabled={(datePage + 1) * 6 >= days.length} onClick={() => changeDatePage(datePage + 1)}>{ar ? 'التالي' : 'Later'}</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2" aria-label={ar ? 'الأيام المتاحة' : 'Available dates'}>
              {days.slice(datePage * 6, datePage * 6 + 6).map((d) => {
                const value = fmtDate(d)
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={date === value}
                    onClick={() => { if (date !== value) { setSlot(''); setSlots([]); setLoadingSlots(true); setDate(value) } }}
                    className={cn(
                      'flex min-h-24 min-w-0 flex-col justify-center items-center rounded-lg border px-3 py-2 transition-colors',
                      date === value
                        ? 'border-brand bg-brand-soft text-brand-deep'
                        : 'border-border text-muted-foreground hover:border-brand/50',
                    )}
                  >
                    <span className="text-xs font-bold">{dayNames[d.getDay()]}</span>
                    <span className="text-2xl font-bold">{d.toLocaleDateString(locale, { day: 'numeric' })}</span><span className="text-xs">{d.toLocaleDateString(locale, { month: 'long' })}</span>
                  </button>
                )
              })}
            </div>

            {mounted && !days.length && <p role="status">{ar ? 'لا توجد أيام متاحة خلال الشهر القادم.' : 'No scheduled dates in the next 30 days.'}</p>}
            <h3 className="font-bold">{ar ? '٢. اختر الوقت' : '2. Choose a time'}</h3>
            {slotsError ? <div role="alert"><p>{ar ? 'تعذر تحميل المواعيد.' : 'Unable to load times.'}</p><button type="button" className="min-h-11 underline" onClick={() => setRetry(n => n + 1)}>{ar ? 'حاول مرة أخرى' : 'Try again'}</button></div> : !mounted || loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {ar ? 'جارٍ تحميل المواعيد…' : 'Loading times…'}
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                {ar ? 'لا توجد مواعيد متاحة في هذا اليوم — جرّب يومًا آخر.' : 'No available times this day — try another.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={slot === s}
                    onClick={() => setSlot(s)}
                    dir="ltr"
                    className={cn(
                      'flex min-h-12 items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-bold transition-colors',
                      slot === s
                        ? 'border-brand bg-brand text-brand-foreground'
                        : 'border-border text-muted-foreground hover:border-brand/50 hover:text-foreground',
                    )}
                  >
                    <Clock className="size-3.5" />
                    {formatTime(s, locale)}
                  </button>
                ))}
              </div>
            )}

            {/* patient details once a slot is picked */}
            {slot && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 overflow-hidden"
              >
                <p className="rounded-lg bg-brand-soft p-3 font-bold" role="status">{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · <bdi>{formatTime(slot, locale)}</bdi></p>
                <h3 className="font-bold">{ar ? '٣. بيانات التواصل' : '3. Your details'}</h3>
                <label htmlFor="booking-name" className="block text-sm">{ar ? 'الاسم بالكامل' : 'Full name'}</label>
                <input
                  id="booking-name"
                  autoComplete="name"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ar ? 'الاسم بالكامل' : 'Full name'}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
                <label htmlFor="slot-phone" className="block text-sm">{ar ? 'رقم الهاتف' : 'Phone number'}</label>
                <PhoneInput
                  id="slot-phone"
                  locale={locale}
                  country={country}
                  onCountryChange={setCountry}
                  value={phone}
                  onChange={setPhone}
                  invalid={phoneError}
                />
                {phoneError && (
                  <p className="text-xs text-destructive">
                    {ar ? 'أدخل رقم هاتف صحيح.' : 'Enter a valid phone number.'}
                  </p>
                )}
                {serverError && (
                  <p className="text-sm text-destructive">
                    {ar ? 'حدث خطأ — حاول مرة أخرى.' : 'Something went wrong — try again.'}
                  </p>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || name.trim().length < 2}
                  className="flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-strong disabled:opacity-60"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {ar ? 'تأكيد طلب الموعد' : 'Request this appointment'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
