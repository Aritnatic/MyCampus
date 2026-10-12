import { branchCode, stripRanking } from './access.js'
import { db } from './db.js'

// What a student sees of admin-managed records. Admins author exam *series*, event
// submissions and job postings; the phone gets timetable rows, upcoming events and job
// cards derived from them. Admin APIs (/api/admin/*) always return the raw records.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`

function stipendText(s) {
  if (!s || typeof s !== 'object') return s ?? null
  const range = s.max && s.max !== s.min ? `${money(s.min)} - ${money(s.max)}` : money(s.min)
  return `${range} per ${s.period ?? 'month'}`
}

// Seeded `registeredAttendees` stands for sign-ups collected outside the app; live RSVPs add to it.
const liveCounts = () => Object.fromEntries(
  db.prepare("SELECT event_id, COUNT(*) AS n FROM registrations WHERE status = 'registered' GROUP BY event_id").all().map((r) => [r.event_id, r.n]),
)

const toEvent = (e, counts) => ({
  ...e,
  // Approved events are 'upcoming' until they've finished, then 'past' (still viewable, hidden from feeds).
  status: new Date(e.endDate ?? e.startDate) < new Date() ? 'past' : 'upcoming',
  location: e.venue,
  mode: e.mode ?? 'offline',
  longDescription: e.description,
  registeredCount: (e.registeredAttendees ?? 0) + (counts[e.id] ?? 0),
  maxParticipants: e.maxParticipants ?? e.expectedAttendees,
  tags: e.tags ?? [],
})

const toJob = (j) => ({
  ...j,
  location: (j.locations ?? []).join(' / '),
  type: j.type === 'full-time' ? 'Full-time' : 'Internship',
  stipend: stipendText(j.stipend),
  eligibleBranches: j.branch ?? [],
  positions: j.openings,
  applicants: j.applications,
  requirements: j.requirements ?? [],
  skills: j.skills ?? [],
})

function toTimetable(series) {
  return (series.subjects ?? []).map((s) => {
    const [startTime, endTime] = (s.time ?? '').split('-')
    return {
      id: `${series.id}:${s.code}`,
      examId: series.id,
      examTitle: series.title,
      university: series.university,
      status: series.status,
      branch: series.branch,
      semester: series.semester,
      subjectCode: s.code,
      subjectName: s.name,
      faculty: s.faculty,
      date: s.date,
      day: WEEKDAYS[new Date(`${s.date}T00:00:00Z`).getUTCDay()],
      startTime,
      endTime,
      room: series.venue,
      type: series.type === 'lab' ? 'Practical' : 'Theory',
    }
  })
}

// Returns the student-facing list for `kind`, already narrowed to the viewer's branch/semester.
export function viewDocs(kind, docs, user) {
  const profile = user.role === 'student' ? JSON.parse(user.data) : null
  const mine = (d) => !profile || d.branch === branchCode(profile.branch)
  switch (kind) {
    case 'event': { const counts = liveCounts(); return docs.map((e) => toEvent(e, counts)) }
    case 'job': return docs.map(toJob)
    case 'exam': return docs.filter((d) => mine(d) && (!profile || d.semester === profile.semester)).flatMap(toTimetable)
    case 'result':
    case 'grade': return docs.filter(mine).map(stripRanking)
    default: return docs
  }
}
