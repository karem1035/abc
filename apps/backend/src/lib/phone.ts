import { parsePhoneNumberFromString } from 'libphonenumber-js'

const DEFAULT_COUNTRY = 'EG'

/**
 * Normalize a phone number to E.164. Fixes common Egyptian mistakes like
 * "+20 01011678830" (leading 0 after the country code), "01…" without a
 * country code, and stray spaces/dashes. Returns null when unparseable.
 */
export function normalizePhone(input: string): string | null {
  let raw = input.replace(/[\s\-()]/g, '')
  if (!raw) return null

  // Egyptian mobile without country code: 01012345678 / 201012345678
  if (/^0?1[0125]\d{8}$/.test(raw) && !raw.startsWith('+')) {
    raw = `+20${raw.replace(/^0/, '')}`
  }
  // Country code followed by a leading zero: +20 0XXXXXXXXX → +20XXXXXXXXX
  raw = raw.replace(/^\+(\d+?)0(\d{9})$/, '+$1$2')

  try {
    const parsed = parsePhoneNumberFromString(raw, DEFAULT_COUNTRY)
    if (!parsed || !parsed.isValid()) return null
    return parsed.number // E.164, e.g. +201011678830
  } catch {
    return null
  }
}

/** Zod-style transform: returns E.164 or null for optional/empty input. */
export function normalizeOptionalPhone(input: string | null | undefined): string | null {
  if (input === null || input === undefined || input.trim() === '') return null
  return normalizePhone(input)
}
