/** Display a clinic wall-clock time without converting it to the visitor's timezone.
 * Arabic renders with Arabic-Indic digits and ص/م (e.g. "٤:٣٠ م"), English as 4:30 PM. */
export function formatTime(time: string, locale: string = 'en'): string {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time)
  if (!match) return time
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return time
  const date = new Date(2000, 0, 1, hour, minute)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
