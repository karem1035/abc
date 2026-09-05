import { parsePhoneNumberFromString, getExampleNumber, type CountryCode } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import { DEFAULT_COUNTRY } from './countries'

export { DEFAULT_COUNTRY }

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
