import { useState } from 'react'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { Input } from '@/components/ui/input'
import { exampleNumber, normalizePhone } from '@/lib/phone'
import { CountrySelect } from '@/components/shared/country-select'
import { DEFAULT_COUNTRY, findCountry } from '@/lib/countries'
import { cn } from '@/lib/utils'

type PhoneInputProps = {
  id?: string
  /** E.164 value, e.g. +201011678830. Empty string when unset. */
  value: string
  onChange: (e164: string) => void
  invalid?: boolean
}

/**
 * Country-code phone input: searchable all-countries select (Egypt default)
 * + national number. Always emits E.164. Common Egyptian mistakes like
 * "+20 01…" are silently corrected while typing.
 */
export function PhoneInput({ id, value, onChange, invalid }: PhoneInputProps) {
  const initial = (() => {
    try {
      const parsed = parsePhoneNumberFromString(value)
      if (parsed?.country) {
        return { country: parsed.country, national: parsed.nationalNumber }
      }
    } catch {
      /* fall through */
    }
    const raw = value.replace(/\D/g, '')
    if (raw.startsWith('20')) {
      return { country: DEFAULT_COUNTRY, national: raw.replace(/^20/, '') }
    }
    return { country: DEFAULT_COUNTRY, national: raw }
  })()

  const [country, setCountry] = useState<CountryCode>(
    (findCountry(initial.country)?.code as CountryCode) ?? DEFAULT_COUNTRY,
  )
  const [national, setNational] = useState(initial.national)

  function emit(nextCountry: CountryCode, nextNational: string) {
    if (!nextNational) {
      onChange('')
      return
    }
    const e164 = normalizePhone(nextNational, nextCountry)
    onChange(e164 ?? nextNational)
  }

  return (
    <div className="flex gap-2" dir="ltr">
      <CountrySelect
        value={country}
        onChange={(code) => {
          setCountry(code)
          emit(code, national)
        }}
      />
      <Input
        id={id}
        inputMode="tel"
        dir="ltr"
        value={national}
        placeholder={exampleNumber(country)}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d\s]/g, '')
          setNational(next)
          emit(country, next)
        }}
        className={cn(invalid && national.trim() !== '' && 'border-destructive')}
      />
    </div>
  )
}
