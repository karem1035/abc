import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

export type Country = {
  code: CountryCode
  dial: string // +20
  nameAr: string
  nameEn: string
  flag: string
}

const arNames = new Intl.DisplayNames(['ar'], { type: 'region' })
const enNames = new Intl.DisplayNames(['en'], { type: 'region' })

function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
}

/** All libphonenumber-js countries with Arabic + English names, dial codes and flags. */
export const ALL_COUNTRIES: Country[] = getCountries()
  .map((code) => ({
    code,
    dial: `+${getCountryCallingCode(code)}`,
    nameAr: arNames.of(code) ?? code,
    nameEn: enNames.of(code) ?? code,
    flag: flagEmoji(code),
  }))
  .sort((a, b) => a.nameEn.localeCompare(b.nameEn))

export const DEFAULT_COUNTRY: CountryCode = 'EG'

export function findCountry(code: string): Country | undefined {
  return ALL_COUNTRIES.find((c) => c.code === code)
}
