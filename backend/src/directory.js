import { stripRanking } from './access.js'
import { db, studentsVersion, universities, users } from './db.js'

// Whether a student has chosen to be discoverable beyond their own campus as a mentor.
// Until they decide, seniors (year 4+) default to open — that's how the app bootstraps mentors.
export const isMentor = (profile) => profile.mentor?.open ?? (profile.year ?? 0) >= 4

const uniCache = () => Object.fromEntries(universities.all().map((u) => [u.id, { short: u.short, name: u.name }]))

// A person's own campus is visible; other campuses are visible only if they're mentors.
export function canSeePerson(viewer, row) {
  if (row.role !== 'student' || row.status !== 'active' || !row.email_verified) return false
  if (row.id === viewer.id) return true
  if (viewer.university && row.university === viewer.university) return true
  return isMentor(JSON.parse(row.data))
}

const connectionCount = db.prepare("SELECT COUNT(*) AS n FROM connections WHERE status = 'accepted' AND (from_id = ? OR to_id = ?)")

// Accepted-connection totals for everyone in one query, for building many cards at once.
export function connectionCounts() {
  const rows = db.prepare(`SELECT uid, COUNT(*) AS n FROM (
    SELECT from_id AS uid FROM connections WHERE status = 'accepted'
    UNION ALL SELECT to_id FROM connections WHERE status = 'accepted') GROUP BY uid`).all()
  return new Map(rows.map((r) => [r.uid, r.n]))
}

// Public profile card: never includes email, never any rank or rating.
// Pass `counts` (from connectionCounts) and/or an already-parsed `p` when building many cards.
export function personView(row, unis = uniCache(), counts, p = JSON.parse(row.data)) {
  return stripRanking({
    ...p,
    id: row.id,
    university: row.university,
    mentor: { open: isMentor(p), topics: p.mentor?.topics ?? [] },
    connections: counts ? (counts.get(row.id) ?? 0) : connectionCount.get(row.id, row.id).n,
    _uni: unis[row.university] ?? null,
  })
}

export const withUni = (unis, item) => ({ ...item, _uni: unis[item.university] ?? null })
export { uniCache }

// Active students with their profiles already parsed. Rebuilt only when a student account changes
// (studentsVersion), not per request: with thousands of students, re-reading and re-parsing every
// profile on each Home/Discover load was the main cost. Treat the returned objects as read-only.
let studentCache = { version: -1, list: [] }
export function studentRows() {
  const version = studentsVersion()
  if (studentCache.version !== version) {
    studentCache = { version, list: users.students().map((row) => ({ row, profile: JSON.parse(row.data) })) }
  }
  return studentCache.list
}
