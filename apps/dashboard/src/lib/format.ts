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

/**
 * Format a `YYYY-MM-DD` date string as `20-5-2026` (no timezone shifting).
 */
export function formatDate(date: string): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return date
  return `${Number(m[3])}-${Number(m[2])}-${Number(m[1])}`
}

/**
 * Format an `HH:mm` time string as `2:30 pm`.
 */
export function formatTime(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return time
  const h24 = Number(m[1])
  const minutes = m[2] ?? '00'
  const ampm = h24 < 12 ? 'am' : 'pm'
  let hours = h24 % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes} ${ampm}`
}
