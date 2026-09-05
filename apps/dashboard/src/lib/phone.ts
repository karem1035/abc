import { parsePhoneNumberFromString, getExampleNumber, type CountryCode } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'

export type Country = {
  code: string // ISO country code
  dial: string // calling code
  name: string
  flag: string
}

/** Curated country list — Egypt first/default, rest by regional relevance. */
export const COUNTRIES: Country[] = [
  { code: 'EG', dial: '+20', name: 'مصر / Egypt', flag: '🇪🇬' },
  { code: 'SA', dial: '+966', name: 'السعودية / Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', dial: '+971', name: 'الإمارات / UAE', flag: '🇦🇪' },
  { code: 'KW', dial: '+965', name: 'الكويت / Kuwait', flag: '🇰🇼' },
  { code: 'QA', dial: '+974', name: 'قطر / Qatar', flag: '🇶🇦' },
  { code: 'JO', dial: '+962', name: 'الأردن / Jordan', flag: '🇯🇴' },
  { code: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', dial: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷' },
]

export const DEFAULT_COUNTRY = 'EG'

export function countryByDial(dial: string): Country {
  return COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0]
}

/**
 * Normalize to E.164, fixing common Egyptian mistakes:
 * "+20 01011678830" → "+201011678830", "01011678830" → "+201011678830".
 * Returns null when the number is invalid for its country.
 */
export function normalizePhone(input: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  let raw = input.replace(/[\s\-()]/g, '')
  if (!raw) return null

  if (/^0?1[0125]\d{8}$/.test(raw) && !raw.startsWith('+')) {
    raw = `+20${raw.replace(/^0/, '')}`
  }
  raw = raw.replace(/^\+(\d+?)0(\d{9})$/, '+$1$2')

  try {
    const parsed = parsePhoneNumberFromString(raw, country)
    if (!parsed || !parsed.isValid()) return null
    return parsed.number
  } catch {
    return null
  }
}

export function isValidPhone(input: string, country: CountryCode = DEFAULT_COUNTRY): boolean {
  return input.trim() === '' || normalizePhone(input, country) !== null
}

export function exampleNumber(country: CountryCode = DEFAULT_COUNTRY): string {
  try {
    return getExampleNumber(country, examples)?.formatNational() ?? ''
  } catch {
    return ''
  }
}
