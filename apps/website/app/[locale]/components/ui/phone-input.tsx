'use client'

import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js'
import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

function flag(code: string) {
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)))
}

export function PhoneInput({ id, locale, country, onCountryChange, value, onChange, invalid = false, required = false }: {
  id: string
  locale: 'ar' | 'en'
  country: CountryCode
  onCountryChange: (country: CountryCode) => void
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  required?: boolean
}) {
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'region' })
    return ['EG' as CountryCode, ...getCountries().filter((code) => code !== 'EG')].map((code) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) }))
  }, [locale])
  return (
    <div className="phone-input flex min-w-0" dir="ltr">
      <Select value={country} onValueChange={(next) => onCountryChange(next as CountryCode)} dir="ltr">
        <SelectTrigger className="phone-country-trigger h-12 w-[120px] shrink-0 rounded-r-none border-r-0 px-2 text-base" aria-label={locale === 'ar' ? 'كود الدولة' : 'Country calling code'} aria-invalid={invalid}>
          <SelectValue><span className="flex items-center gap-2"><span aria-hidden="true">{flag(country)}</span><span>+{getCountryCallingCode(country)}</span></span></SelectValue>
        </SelectTrigger>
        <SelectContent className="w-72 max-w-[calc(100vw-2rem)]">
          {countries.map(({ code, name, dial }) => <SelectItem key={code} value={code} textValue={`${name} ${code} +${dial}`}><span aria-hidden="true">{flag(code)}</span> {name} (+{dial})</SelectItem>)}
        </SelectContent>
      </Select>
      <input id={id} name="phone" type="tel" autoComplete="tel-national" inputMode="tel" value={value} onChange={(event) => onChange(event.target.value.replace(/[^\d\s]/g, ''))} placeholder={country === 'EG' ? '10 1234 5678' : (locale === 'ar' ? 'رقم الهاتف' : 'Phone number')} required={required} maxLength={20} aria-invalid={invalid} className="phone-national h-12 min-w-0 w-full rounded-r-lg border border-border bg-background px-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
    </div>
  )
}
