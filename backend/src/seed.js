import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { config } from './config.js'
import { db, docs, users } from './db.js'
import { hashPassword } from './auth.js'

// Demo content lives in seed-data/ as plain ESM files. Load them through a data: URL so
// they don't need a package.json of their own to be treated as modules.
const dataDir = join(config.root, 'seed-data')
async function load(file) {
  const src = readFileSync(join(dataDir, `${file}.js`), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`)
}

const DEFAULT_UNI = 'cvrp' // exams/results/notes in the mock data predate multi-university

// The demo data was authored around 1 Feb 2024. Shift every date by the same number of days so that
// "now" lands where the data expects it — upcoming exams, open registrations, a drill "today" — instead
// of everything looking two years old. Year-only strings ("2023") and non-dates are left alone.
const ANCHOR = Date.parse('2024-02-01T00:00:00Z')
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/
export function shiftDates(value, days) {
  if (typeof value === 'string') {
    if (!DATE_ONLY.test(value) && !ISO_DATETIME.test(value)) return value
    const t = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value)
    if (Number.isNaN(t)) return value
    const shifted = new Date(t + days * 86400_000).toISOString()
    return value.length === 10 ? shifted.slice(0, 10) : shifted
  }
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, days))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shiftDates(v, days)]))
  return value
}
const daysSinceAnchor = () => Math.round((new Date().setUTCHours(0, 0, 0, 0) - ANCHOR) / 86400_000)

const slug = (s) => s.toLowerCase().replace(/^(dr|prof)\.?\s+/, '').replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.')

export async function seed() {
  // notices/events/exams/results/jobs use the admin panel's data model (admins own them);
  // `exams.js` here only supplies per-student grades, which no admin screen creates yet.
  const [uni, students, grades, notes, projects, startups, research, faculty, notices, events, exams, placements, campus, career] = await Promise.all(
    ['universities', 'students', 'exams', 'notes', 'projects', 'startups', 'research', 'faculty', 'admin-notices', 'admin-events', 'admin-exams', 'admin-placements', 'campus-map', 'career'].map(load),
  )

  const passwordHash = await hashPassword(config.seedPassword) // before the transaction: don't await inside it
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM universities; DELETE FROM users; DELETE FROM docs; DELETE FROM alerts; DELETE FROM audit_log; DELETE FROM email_codes;')
    const insertUni = db.prepare('INSERT INTO universities (id, data) VALUES (?, ?)')
    // Verified-membership rule: an email on one of these domains belongs to that campus.
    const domainsOf = (u) => { const key = u.short.toLowerCase().replace(/[^a-z]/g, ''); return [`${key}.edu.in`, `students.${key}.edu.in`] }
    for (const u of uni.universities) insertUni.run(u.id, JSON.stringify({ ...u, domains: domainsOf(u) }))

    const content = {
      notice: notices.notices, event: events.events, exam: exams.exams, result: exams.results, job: placements.jobs,
      grade: grades.results, note: notes.notes, project: projects.projects, startup: startups.startups,
      research: research.research, faculty: faculty.faculty, career: career.careers,
    }
    for (const [kind, items] of Object.entries(content)) {
      for (const item of items) docs.put(kind, shiftDates({ university: DEFAULT_UNI, ...item }, daysSinceAnchor()))
    }

    docs.put('campus_map', { id: 'map-cvrp', university: 'cvrp', status: 'published', buildings: campus.campusBuildings, paths: campus.campusPaths, landmarks: campus.campusLandmarks })

    const insertUser = db.prepare(
      'INSERT INTO users (id, email, password_hash, role, university, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    const shortOf = Object.fromEntries(uni.universities.map((u) => [u.id, u.short.toLowerCase().replace('-', '')]))

    // Students ("university" login mode). stu-001 is the demo user the phone app used before.
    for (const s of students.students) {
      const email = `${slug(s.name)}@students.${shortOf[s.university]}.edu.in`
      insertUser.run(s.id, email, passwordHash, 'student', s.university, 'active', JSON.stringify(s))
    }

    // Admins (from admin-page/src/data/admin.js).
    const admins = [
      ['admin-001', 'Dr. Rajesh Kumar', 'rajesh.kumar@cvrp.edu.in', 'superadmin', ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users']],
      ['admin-002', 'Prof. Anita Sharma', 'anita.sharma@cvrp.edu.in', 'moderator', ['notices', 'events', 'placements']],
      ['admin-003', 'Dr. Vikram Singh', 'vikram.singh@cvrp.edu.in', 'exams', ['exams', 'results']],
    ]
    for (const [id, name, email, adminRole, permissions] of admins) {
      insertUser.run(id, email, passwordHash, 'admin', 'cvrp', 'active', JSON.stringify({ name, adminRole, permissions: adminRole === 'superadmin' ? [...permissions, 'safety', 'faculty', 'research'] : permissions }))
    }

    // Individuals (no university): only cross-university content is visible to them.
    const individuals = [
      ['ind-001', 'Priya Sharma', 'priya.sharma@gmail.com', ['AI/ML', 'Web Development', 'Hackathons']],
      ['ind-002', 'Rohit Kumar', 'rohit.kumar@gmail.com', ['Robotics', 'IoT', 'Startups']],
    ]
    for (const [id, name, email, interests] of individuals) {
      insertUser.run(id, email, passwordHash, 'individual', null, 'active', JSON.stringify({ name, interests, skills: [], verified: true }))
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export async function ensureSeeded() {
  if (users.count() === 0) await seed()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await seed()
  const rows = db.prepare('SELECT email, role FROM users ORDER BY role, id').all()
  console.log(`Seeded ${rows.length} accounts (password: ${config.seedPassword}):`)
  for (const r of rows) console.log(`  ${r.role.padEnd(10)} ${r.email}`)
}
