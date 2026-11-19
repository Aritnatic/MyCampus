import { createReadStream, existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import express, { Router } from 'express'
import { requireAuth, requirePermission } from '../auth.js'
import { config } from '../config.js'
import { sendMail } from '../mailer.js'
import { audit, collegeCard, db, newId, now, universities, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { eraseAccount } from './privacy.js'
import { notify } from '../notify.js'

// Joining a college without a college email address.
//
// Some colleges (CVRP included) give students no email on a college domain, so "your email proves you're a
// student" can't work there. Instead: sign up with any email (an "individual" account, which only sees
// cross-university content), ask to join with your roll number, and an admin who manages students checks it
// against their records and approves or rejects. Approval turns the account into a verified student of that
// college at once (the server re-reads the account on every request, so no new sign-in is needed).
export const joinRoutes = Router()
// Routes anyone may call without signing in. Mounted before the routers that require sign-in for everything
// passing through them, or those would answer 401 first.
export const publicCollegeRoutes = Router()

const MAX_REQUESTS_PER_DAY = 5

const view = (row) => {
  const d = JSON.parse(row.data)
  return { id: row.id, university: row.university, status: row.status, createdAt: row.created_at, decidedAt: row.decided_at, ...d }
}

// Colleges someone can ask to join, searchable by name, short name or city (names and logos only: nothing
// campus-private). An empty search lists them all; a college that isn't on MyCampus simply doesn't appear.
joinRoutes.get('/join/colleges', requireAuth, (req, res) => {
  const words = String(req.query.q ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 6)
  const list = universities.all()
    .map((u) => ({ card: collegeCard(u.id), hay: `${u.name} ${u.short} ${u.city ?? ''} ${u.state ?? ''}`.toLowerCase() }))
    .filter(({ hay }) => words.every((w) => hay.includes(w)))
    .map(({ card }) => ({ ...card, members: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND university = ? AND status = 'active'").get(card.id).n }))
    .sort((a, b) => b.members - a.members || a.name.localeCompare(b.name))
  res.json(list.slice(0, 50))
})

// ---- college logo ----
// Public (no sign-in) so it loads in an <img> or <Image> without headers; a logo isn't private.
const LOGO_TYPES = { 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/jpeg': [0xff, 0xd8, 0xff], 'image/webp': [0x52, 0x49, 0x46, 0x46] }
const logoFile = (id) => join(config.uploadDir, `logo-${id.replace(/[^a-z0-9-]/gi, '')}`)

publicCollegeRoutes.get('/colleges/:id/logo', (req, res) => {
  const u = universities.get(req.params.id)
  const file = u && logoFile(u.id)
  if (!u?.logoVersion || !existsSync(file)) return res.status(404).json({ error: 'No logo.' })
  res.set({ 'Content-Type': u.logoType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'cross-origin' })
  createReadStream(file).pipe(res)
})

// What a college admin sees and edits about their own college.
joinRoutes.get('/admin/college', requireAuth, requirePermission('settings'), (req, res) => {
  res.json(collegeCard(req.user.university))
})

// Upload a PNG, JPEG or WebP (no SVG: it can carry scripts), up to 1 MB. Square images look best.
joinRoutes.put('/admin/college/logo', requireAuth, requirePermission('settings'), express.raw({ type: () => true, limit: 1024 * 1024 }), wrap(async (req, res) => {
  const type = (req.get('content-type') ?? '').split(';')[0].trim()
  const magic = LOGO_TYPES[type]
  if (!magic) throw new HttpError(415, 'Upload a PNG, JPEG or WebP image.')
  const body = req.body
  if (!Buffer.isBuffer(body) || !body.length) throw new HttpError(400, 'The image is empty.')
  if (!magic.every((b, i) => body[i] === b)) throw new HttpError(400, 'The file contents don’t match its type.')
  const u = universities.get(req.user.university)
  writeFileSync(logoFile(u.id), body)
  universities.put({ ...u, logoVersion: Date.now(), logoType: type })
  audit(req.user, 'college.logo', u.id)
  res.json(collegeCard(u.id))
}))

joinRoutes.delete('/admin/college/logo', requireAuth, requirePermission('settings'), (req, res) => {
  const u = universities.get(req.user.university)
  if (existsSync(logoFile(u.id))) unlinkSync(logoFile(u.id))
  const { logoVersion, logoType, ...rest } = u // eslint-disable-line no-unused-vars
  universities.put(rest)
  audit(req.user, 'college.logo_remove', u.id)
  res.status(204).end()
})

// ---- the college's own registration number for a student ----
// Set by the college (it starts as the roll number given when asking to join). Only the student and their
// college's admins ever see it.
joinRoutes.patch('/admin/students/:id/registration', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const { rollNumber } = parse(z.object({ rollNumber: z.string().trim().max(40) }), req.body)
  const row = users.byId(req.params.id)
  if (!row || row.role !== 'student' || row.university !== req.user.university) throw new HttpError(404, 'Student not found.')
  if (rollNumber) {
    const clash = db.prepare("SELECT id, data FROM users WHERE role = 'student' AND university = ? AND id != ?").all(row.university, row.id)
      .find((u) => String(JSON.parse(u.data).rollNumber ?? '').trim().toLowerCase() === rollNumber.toLowerCase())
    if (clash) throw new HttpError(409, `That registration number already belongs to ${JSON.parse(clash.data).name}.`)
  }
  db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify({ ...users.profile(row), rollNumber }), row.id)
  audit(req.user, 'student.registration', row.id)
  res.json({ id: row.id, rollNumber })
}))

// The signed-in person's latest request (or null), so the app can show "waiting for approval" or the reason it was rejected.
joinRoutes.get('/me/join-request', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM join_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id)
  res.json(row ? view(row) : null)
})

const requestBody = z.object({
  university: z.string().trim().min(1).max(40),
  rollNumber: z.string().trim().min(2, 'Enter your roll number.').max(40),
  branch: z.string().trim().min(1, 'Choose your branch.').max(80),
  year: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
  note: z.string().trim().max(300).optional().default(''),
})

joinRoutes.post('/me/join-request', requireAuth, wrap(async (req, res) => {
  if (req.user.role !== 'individual') throw new HttpError(400, req.user.role === 'student' ? 'You are already a verified student.' : 'This account can’t join a college.')
  const body = parse(requestBody, req.body)
  const uni = universities.get(body.university)
  if (!uni) throw new HttpError(400, 'Choose a college from the list.')
  if (db.prepare("SELECT 1 FROM join_requests WHERE user_id = ? AND status = 'pending'").get(req.user.id)) {
    throw new HttpError(409, 'You already have a request waiting. You’ll be notified when it’s decided.')
  }
  const dayAgo = new Date(Date.now() - 864e5).toISOString()
  if (db.prepare('SELECT COUNT(*) AS n FROM join_requests WHERE user_id = ? AND created_at > ?').get(req.user.id, dayAgo).n >= MAX_REQUESTS_PER_DAY) {
    throw new HttpError(429, 'Too many requests today. Try again tomorrow.')
  }

  const profile = users.profile(req.user)
  const id = newId('join')
  const data = { ...body, name: profile.name, email: req.user.email }
  delete data.university
  db.prepare('INSERT INTO join_requests (id, user_id, university, status, data, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, uni.id, 'pending', JSON.stringify(data), now())
  audit(req.user, 'join.request', id, { university: uni.id })

  // Tell the admins who manage students at that college.
  const admins = db.prepare("SELECT id, data FROM users WHERE role = 'admin' AND university = ? AND status = 'active'").all(uni.id)
    .filter((a) => { const p = JSON.parse(a.data); return p.adminRole === 'superadmin' || p.permissions?.includes('users') })
  notify(admins.map((a) => a.id), { type: 'join_request', title: `${profile.name} asked to join ${uni.short}`, body: `Roll no. ${body.rollNumber} · ${body.branch}, semester ${body.semester}`, data: { requestId: id } })

  res.status(201).json(view(db.prepare('SELECT * FROM join_requests WHERE id = ?').get(id)))
}))

// Withdraw a waiting request (to fix a typo in the roll number, say).
joinRoutes.delete('/me/join-request', requireAuth, (req, res) => {
  const done = db.prepare("UPDATE join_requests SET status = 'withdrawn', decided_at = ? WHERE user_id = ? AND status = 'pending'").run(now(), req.user.id)
  if (!done.changes) throw new HttpError(404, 'You have no request waiting.')
  res.status(204).end()
})

// ---- admin side (permission: users) ----

// Another verified student of this college already uses this roll number, or someone else asked with it.
function rollClash(university, rollNumber, requestId) {
  const roll = String(rollNumber).trim().toLowerCase()
  const student = db.prepare("SELECT id, data FROM users WHERE role = 'student' AND university = ?").all(university)
    .find((u) => String(JSON.parse(u.data).rollNumber ?? '').trim().toLowerCase() === roll)
  if (student) return `Roll number already used by ${JSON.parse(student.data).name}`
  const other = db.prepare("SELECT data FROM join_requests WHERE university = ? AND status = 'pending' AND id != ?").all(university, requestId)
    .find((r) => String(JSON.parse(r.data).rollNumber).trim().toLowerCase() === roll)
  if (other) return `Also requested by ${JSON.parse(other.data).name}`
  return null
}

joinRoutes.get('/admin/join-requests', requireAuth, requirePermission('users'), (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending'
  const rows = db.prepare('SELECT * FROM join_requests WHERE university = ? AND status = ? ORDER BY created_at DESC LIMIT 200').all(req.user.university, status)
  res.json(rows.map((r) => ({ ...view(r), warning: r.status === 'pending' ? rollClash(r.university, JSON.parse(r.data).rollNumber, r.id) : null })))
})

function pendingRequest(req) {
  const row = db.prepare('SELECT * FROM join_requests WHERE id = ?').get(req.params.id)
  if (!row || row.university !== req.user.university) throw new HttpError(404, 'Request not found.')
  if (row.status !== 'pending') throw new HttpError(409, `This request was already ${row.status}.`)
  return row
}

joinRoutes.post('/admin/join-requests/:id/approve', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const row = pendingRequest(req)
  const person = users.byId(row.user_id)
  if (!person || person.status !== 'active') throw new HttpError(409, 'That account is no longer active.')
  if (person.role !== 'individual') throw new HttpError(409, 'That account is already a member of a college.')
  const d = JSON.parse(row.data)
  const uni = universities.get(row.university)

  db.exec('BEGIN')
  try {
    const profile = { ...users.profile(person), university: uni.id, branch: d.branch, year: d.year, semester: d.semester, rollNumber: d.rollNumber, verified: true }
    db.prepare("UPDATE users SET role = 'student', university = ?, data = ? WHERE id = ?").run(uni.id, JSON.stringify(profile), person.id)
    db.prepare("UPDATE join_requests SET status = 'approved', decided_at = ?, decided_by = ? WHERE id = ?").run(now(), req.user.id, row.id)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  audit(req.user, 'join.approve', row.id, { user: person.id })
  notify([person.id], { type: 'join_approved', title: `You’re in: welcome to ${uni.short}`, body: 'Your college notices, exams, results and safety alerts are now in the app.', data: { requestId: row.id } })
  sendMail({ to: person.email, subject: `You've joined ${uni.short} on MyCampus`, text: `${uni.name} approved your request. Open MyCampus to see your college's notices, exams and results.` })
  res.json({ id: row.id, status: 'approved' })
}))

joinRoutes.post('/admin/join-requests/:id/reject', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().max(300).optional().default('') }), req.body)
  const row = pendingRequest(req)
  const d = JSON.parse(row.data)
  db.prepare("UPDATE join_requests SET status = 'rejected', decided_at = ?, decided_by = ?, data = ? WHERE id = ?")
    .run(now(), req.user.id, JSON.stringify({ ...d, reason }), row.id)
  audit(req.user, 'join.reject', row.id, { user: row.user_id })
  const uni = universities.get(row.university)
  notify([row.user_id], { type: 'join_rejected', title: `${uni.short} couldn’t confirm your request`, body: reason || 'Check your roll number and details, then ask again.', data: { requestId: row.id } })
  res.json({ id: row.id, status: 'rejected' })
}))

// Delete a student's account for good (their notes, solo projects, connections, requests and notifications go
// with it). Only admins who manage students, only for their own college. Suspending is the reversible option.
joinRoutes.delete('/admin/students/:id', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const row = users.byId(req.params.id)
  if (!row || row.role !== 'student' || row.university !== req.user.university) throw new HttpError(404, 'Student not found.')
  const name = users.profile(row).name
  eraseAccount(row)
  audit(req.user, 'student.deleted', null, { name })
  res.status(204).end()
}))
