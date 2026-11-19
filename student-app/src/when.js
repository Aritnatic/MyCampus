// "Today", "current" and "older" for notices, events and jobs, judged on the phone's own calendar day.

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export function isToday(value) {
  if (!value) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && dayKey(d) === dayKey(new Date())
}

// A date-only value ("2026-11-20") lasts through that whole day; a timestamp ends at that moment.
export function hasEnded(value) {
  if (!value) return false
  const s = String(value)
  const end = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T23:59:59`) : new Date(s)
  return !Number.isNaN(end.getTime()) && end < new Date()
}

// The server marks these too (`expired`, event `status: 'past'`); the phone re-checks so a list left open
// past midnight still sorts correctly.
export const noticeEnded = (n) => n.expired || hasEnded(n.expiresAt)
export const eventEnded = (e) => e.status === 'past' || hasEnded(e.endDate ?? e.startDate)
export const jobClosed = (j) => j.acceptingApplications === false || j.expired || hasEnded(j.deadline) || (j.status && j.status !== 'open')

// Is an event on today (it starts today, or today falls inside a multi-day event)?
export function eventIsToday(e) {
  if (isToday(e.startDate) || isToday(e.endDate)) return true
  const start = new Date(e.startDate), end = new Date(e.endDate ?? e.startDate), now = new Date()
  return start <= now && now <= end
}
