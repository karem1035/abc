'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Check, Clock, Loader2 } from 'lucide-react'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { useEffect, useState } from 'react'
import type { Dictionary, Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { PhoneInput } from '../ui/phone-input'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1'

type Session = { weekday: number; startTime: string; endTime: string; slotMinutes: number }

function fmtDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Next `count` dates on any of the given weekdays (0=Sunday), starting tomorrow. */
function upcomingDays(weekdays: number[], count = 7, maxDays = 30) {
  const days: Date[] = []
  const cursor = new Date()
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

  const weekdays = [...new Set(schedule.map((s) => s.weekday))]
  const days = upcomingDays(weekdays)

  const [date, setDate] = useState<string>(days[0] ? fmtDate(days[0]) : '')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
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
    setLoadingSlots(true)
    setSlot('')
    fetch(`${API_URL}/doctors/${doctorSlug}/slots?date=${date}`)
      .then((r) => r.json())
      .then((body: { data: { slots: string[] } }) => setSlots(body.data?.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [date, doctorSlug])

  async function submit() {
    setServerError(false)
    const parsed = parsePhoneNumberFromString(phone, country)
    const valid = Boolean(parsed?.isValid())
    setPhoneError(!valid)
    if (!valid || !slot || submitting) return

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
                ? `موعدك المبدئي: ${slot} — ${date}. سيتواصل معك فريقنا للتأكيد.`
                : `Provisional appointment: ${date} at ${slot}. Our team will call to confirm.`}
            </p>
          </motion.div>
        ) : (
          <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* day chips */}
            <div className="flex flex-wrap gap-2">
              {days.map((d) => {
                const value = fmtDate(d)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDate(value)}
                    className={cn(
                      'flex min-w-18 flex-col items-center rounded-lg border px-3 py-2 transition-colors',
                      date === value
                        ? 'border-brand bg-brand-soft text-brand-deep'
                        : 'border-border text-muted-foreground hover:border-brand/50',
                    )}
                  >
                    <span className="text-xs font-bold">{dayNames[d.getDay()]}</span>
                    <span className="text-sm" dir="ltr">{d.getDate()}/{d.getMonth() + 1}</span>
                  </button>
                )
              })}
            </div>

            {/* slots */}
            {loadingSlots ? (
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
                    onClick={() => setSlot(s)}
                    dir="ltr"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-bold transition-colors',
                      slot === s
                        ? 'border-brand bg-brand text-brand-foreground'
                        : 'border-border text-muted-foreground hover:border-brand/50 hover:text-foreground',
                    )}
                  >
                    <Clock className="size-3.5" />
                    {s}
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
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ar ? 'الاسم بالكامل' : 'Full name'}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
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
