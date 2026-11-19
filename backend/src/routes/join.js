import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth.js'
import { sendMail } from '../mailer.js'
import { audit, db, newId, now, universities, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { notify } from '../notify.js'

// Joining a college without a college email address.
//
// Some colleges (CVRP included) give students no email on a college domain, so "your email proves you're a
// student" can't work there. Instead: sign up with any email (an "individual" account, which only sees
// cross-university content), ask to join with your roll number, and an admin who manages students checks it
// against their records and approves or rejects. Approval turns the account into a verified student of that
// college at once (the server re-reads the account on every request, so no new sign-in is needed).
export const joinRoutes = Router()

const MAX_REQUESTS_PER_DAY = 5

const view = (row) => {
  const d = JSON.parse(row.data)
  return { id: row.id, university: row.university, status: row.status, createdAt: row.created_at, decidedAt: row.decided_at, ...d }
}

// Colleges someone can ask to join (names only: nothing campus-private).
joinRoutes.get('/join/colleges', requireAuth, (req, res) => {
  res.json(universities.all().map((u) => ({ id: u.id, name: u.name, short: u.short, city: u.city ?? null })))
})

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
