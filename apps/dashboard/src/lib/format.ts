/**
 * Canonical system-wide date-time format: `20-5-2026 10:30 pm`.
 * Always LTR (digits), so callers keep the element `dir="ltr"`.
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()

  let hours = d.getHours() % 12
  if (hours === 0) hours = 12
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = d.getHours() < 12 ? 'am' : 'pm'

  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
}
