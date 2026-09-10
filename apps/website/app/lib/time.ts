/** Display a clinic wall-clock time without converting it to the visitor's timezone. */
export function formatTime(time: string): string {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time)
  if (!match) return time
  const hour = Number(match[1])
  if (hour > 23 || Number(match[2]) > 59) return time
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`
}
