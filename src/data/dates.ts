/**
 * All "calendar day" values in this app are plain YYYY-MM-DD strings in the
 * user's local timezone — never raw `Date` objects — because
 * `new Date('YYYY-MM-DD')` parses as UTC midnight and silently shifts a day
 * near midnight in most timezones. These helpers are the only place that
 * boundary gets crossed, so the rest of the app never has to think about it.
 */

export function todayStr(): string {
  return toDateStr(new Date())
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses a YYYY-MM-DD string as a local-midnight Date (never UTC). */
export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDateStr(dateStr)
  date.setDate(date.getDate() + days)
  return toDateStr(date)
}

/** Positive = dateStr is in the past relative to `today`, negative = future, 0 = same day. */
export function daysOverdue(dateStr: string, today: string = todayStr()): number {
  const diffMs = parseDateStr(today).getTime() - parseDateStr(dateStr).getTime()
  return Math.round(diffMs / 86_400_000)
}

export function isOverdue(dueDate: string, today: string = todayStr()): boolean {
  return dueDate < today
}

export function formatShortDate(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** "Today" / "Tomorrow" / "3 days overdue" / "Aug 20" — used on task rows. */
export function formatDueLabel(dueDate: string, today: string = todayStr()): string {
  const diff = daysOverdue(dueDate, today)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Tomorrow'
  if (diff === 1) return 'Yesterday'
  if (diff > 1) return `${diff} days overdue`
  return formatShortDate(dueDate)
}

/** "Today" / "Yesterday" / "Tomorrow" / "Mon, Aug 17" — used as a day-group heading. */
export function formatDayHeading(dateStr: string, today: string = todayStr()): string {
  const diff = daysOverdue(dateStr, today)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Tomorrow'
  if (diff === 1) return 'Yesterday'
  return parseDateStr(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
