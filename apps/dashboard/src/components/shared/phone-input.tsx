import { useState } from 'react'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryByDial,
  exampleNumber,
  normalizePhone,
} from '@/lib/phone'
import { cn } from '@/lib/utils'

type PhoneInputProps = {
  id?: string
  /** E.164 value, e.g. +201011678830. Empty string when unset. */
  value: string
  onChange: (e164: string) => void
  invalid?: boolean
}

/**
 * Country-code phone input: country select (Egypt default) + national number.
 * The value is always emitted in E.164. Common mistakes like "+20 01…"
 * are silently corrected while typing.
 */
export function PhoneInput({ id, value, onChange, invalid }: PhoneInputProps) {
  const initial = value
    ? (() => {
        try {
          const parsed = parsePhoneNumberFromString(value)
          if (parsed) {
            return {
              country: parsed.country ?? DEFAULT_COUNTRY,
              national: parsed.formatNational().replace(/\D/g, ''),
            }
          }
        } catch {
          /* fall through */
        }
        const country = countryByDial(`+${value.replace(/\D/g, '').slice(0, 2)}`)
        return { country: country.code, national: value.replace(/\D/g, '').replace(/^20/, '') }
      })()
    : { country: DEFAULT_COUNTRY, national: '' }

  const [country, setCountry] = useState<CountryCode>(initial.country as CountryCode)
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
      <Select
        value={country}
        onValueChange={(next) => {
          const code = String(next) as CountryCode
          setCountry(code)
          emit(code, national)
        }}
      >
        <SelectTrigger className="w-32 shrink-0" aria-label="Country code">
          <SelectValue>
            {(() => {
              const c = COUNTRIES.find((x) => x.code === country)
              return c ? `${c.flag} ${c.dial}` : ''
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code} label={`${c.flag} ${c.dial}`}>
              <span className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span className="font-mono text-xs">{c.dial}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
