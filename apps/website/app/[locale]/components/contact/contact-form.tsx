'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Send } from 'lucide-react'
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import ReactSelect from 'react-select'
import { useState, type FormEvent } from 'react'
import type { Dictionary } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

const DEFAULT_COUNTRY: CountryCode = 'EG'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1'

const TYPE_KEYS = ['general', 'appointment', 'complaint', 'insurance', 'other'] as const
type FormType = (typeof TYPE_KEYS)[number]

function RequiredDot() {
  return <span className="ms-1 inline-block size-1.5 rounded-full bg-destructive align-middle" aria-hidden />
}

export function ContactForm({ locale, t }: { locale: 'ar' | 'en'; t: Dictionary }) {
  const [name, setName] = useState('')
  const [national, setNational] = useState('')
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [email, setEmail] = useState('')
  const [type, setType] = useState<FormType>('general')
  const [otherType, setOtherType] = useState('')
  const [message, setMessage] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [received, setReceived] = useState(false)
  const [serverError, setServerError] = useState(false)

  // Searchable, translated country options (Egypt first)
  const regionNames = new Intl.DisplayNames([locale], { type: 'region' })
  const countryOptions = [
    DEFAULT_COUNTRY,
    ...getCountries().filter((c) => c !== DEFAULT_COUNTRY),
  ].map((c) => ({
    value: c,
    label: `${String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0)))}  ${regionNames.of(c) ?? c}  +${getCountryCallingCode(c)}`,
  }))

  function validate(): boolean {
    const next: Record<string, string> = {}

    if (name.trim().length < 2) next.name = t.contact.required
    if (!national.trim()) {
      next.phone = t.contact.required
    } else {
      const parsed = parsePhoneNumberFromString(national, country)
      if (!parsed || !parsed.isValid()) next.phone = t.contact.invalidPhone
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t.contact.invalidEmail
    if (type === 'other' && otherType.trim().length < 2) next.otherType = t.contact.required

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(false)
    if (!validate()) return

    const parsed = parsePhoneNumberFromString(national, country)
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/contact/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: parsed?.number ?? national,
          email: email.trim(),
          type,
          otherType: type === 'other' ? otherType.trim() : undefined,
          message: message.trim(),
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setReceived(true)
    } catch {
      setServerError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = (invalid?: string) =>
    cn(
      'h-11 w-full rounded-lg border bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/30',
      invalid ? 'border-destructive' : 'border-border',
    )

  return (
    <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {received ? (
          <motion.div
            key="received"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 px-6 py-14 text-center"
          >
            {/* Soft hospital-style success mark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
              className="relative flex size-16 items-center justify-center rounded-full bg-success/15"
            >
              <motion.span
                className="absolute inset-0 rounded-full bg-success/20"
                animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
              <Check className="size-8 text-success" strokeWidth={3} />
            </motion.div>
            <h3 className="font-heading text-xl font-bold">{t.contact.receivedTitle}</h3>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t.contact.receivedText}
            </p>
            <button
              type="button"
              onClick={() => {
                setReceived(false)
                setName('')
                setNational('')
                setEmail('')
                setType('general')
                setOtherType('')
                setMessage('')
              }}
              className="mt-2 text-sm font-bold text-brand-deep underline-offset-4 hover:underline"
            >
              {t.contact.receivedAgain}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            onSubmit={onSubmit}
            noValidate
            className="space-y-4"
          >
            <h2 className="font-heading text-xl font-bold">{t.contact.formTitle}</h2>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="text-sm font-semibold">
                {t.contact.name}
                <RequiredDot />
              </label>
              <input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls(errors.name)}
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Phone with searchable country select */}
            <div className="space-y-1.5">
              <label htmlFor="contact-phone" className="text-sm font-semibold">
                {t.contact.phone}
                <RequiredDot />
              </label>
              <div className="flex gap-0" dir="ltr">
                <div className={cn('w-44 shrink-0', errors.phone && '[&_.select__control]:border-destructive')}>
                  <ReactSelect
                    inputId="contact-country"
                    classNamePrefix="select"
                    value={countryOptions.find((o) => o.value === country)}
                    onChange={(opt) => opt && setCountry(opt.value as CountryCode)}
                    options={countryOptions}
                    isSearchable
                    menuPlacement="auto"
                    menuShouldScrollIntoView={false}
                    placeholder={locale === 'ar' ? 'ابحث عن دولة…' : 'Search country…'}
                    noOptionsMessage={() => (locale === 'ar' ? 'لا توجد نتائج' : 'No results')}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '0.5rem 0 0 0.5rem',
                        borderRight: 'none',
                        borderColor: errors.phone ? 'var(--destructive)' : 'var(--border)',
                        boxShadow: state.isFocused ? '0 0 0 2px color-mix(in srgb, var(--brand) 30%, transparent)' : 'none',
                        '&:hover': { borderColor: errors.phone ? 'var(--destructive)' : 'var(--border)' },
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }),
                      input: (base) => ({ ...base, minWidth: '5rem' }),
                      valueContainer: (base) => ({ ...base, fontSize: '0.8rem' }),
                      menu: (base) => ({ ...base, borderRadius: '0.5rem', zIndex: 50, overflow: 'hidden' }),
                      menuList: (base) => ({ ...base, maxHeight: '16rem' }),
                      option: (base, state) => ({
                        ...base,
                        fontSize: '0.875rem',
                        backgroundColor: state.isSelected
                          ? 'color-mix(in srgb, var(--brand) 20%, transparent)'
                          : state.isFocused
                            ? 'var(--muted)'
                            : 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                      }),
                    }}
                  />
                </div>
                <input
                  id="contact-phone"
                  value={national}
                  onChange={(e) => setNational(e.target.value.replace(/[^\d\s]/g, ''))}
                  placeholder={'10 1234 5678'}
                  inputMode="tel"
                  className={cn(inputCls(errors.phone), 'rounded-s-none')}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="text-sm font-semibold">
                {t.contact.email}
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls(errors.email)}
                autoComplete="email"
                dir="ltr"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Type (shadcn select) + other open input */}
            <div className="space-y-1.5">
              <label htmlFor="contact-type">{t.contact.type}</label>
              <Select value={type} onValueChange={(v) => setType((v ?? 'general') as FormType)}>
                <SelectTrigger id="contact-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t.contact.types[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {type === 'other' && (
                <input
                  value={otherType}
                  onChange={(e) => setOtherType(e.target.value)}
                  placeholder={t.contact.otherType}
                  className={cn(inputCls(errors.otherType), 'mt-2')}
                />
              )}
              {errors.otherType && <p className="text-xs text-destructive">{errors.otherType}</p>}
            </div>

            {/* Message (optional) */}
            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="text-sm font-semibold">
                {t.contact.message}
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className={cn(inputCls(), 'h-auto resize-y py-2.5')}
              />
            </div>

            {serverError && <p className="text-sm text-destructive">{t.contact.error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2.5 rounded-lg bg-brand px-8 py-3 text-base font-bold text-brand-foreground transition-colors hover:bg-brand-strong disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              {submitting ? t.contact.submitting : t.contact.submit}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
