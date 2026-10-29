import { Router } from 'express'
import { canView } from '../access.js'
import { requireAuth, requirePermission } from '../auth.js'
import { audit, db, docs, newId, now, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { sendMail } from '../mailer.js'
import { notify } from '../notify.js'

export const guidanceRoutes = Router()
guidanceRoutes.use(requireAuth)

const MAX_OPEN = 3 // pending requests per student, so nobody spams the whole department

const requireStudent = (req, res, next) =>
  req.user.role === 'student' ? next() : next(new HttpError(403, 'Only verified campus students can ask faculty for guidance.'))

const view = (r) => {
  const f = docs.get('faculty', r.faculty_id)
  return {
    id: r.id, status: r.status, topic: r.topic, message: r.message, note: r.note, createdAt: r.created_at, decidedAt: r.decided_at,
    faculty: f ? { id: f.id, name: f.name, department: f.department, designation: f.designation } : { id: r.faculty_id, name: 'Faculty member' },
  }
}

// ---------------- student side ----------------

// Ask a teacher to guide your project or research. The teacher gets an email with who you are and
// how to reach you; a campus admin records their answer, and you're notified.
guidanceRoutes.post('/faculty/:id/guidance', requireStudent, wrap(async (req, res) => {
  const { topic, message } = parse(z.object({
    topic: z.string().trim().min(3, 'Say what you want guidance on (at least 3 characters).').max(120),
    message: z.string().trim().max(500).optional(),
  }), req.body)
  const f = docs.get('faculty', req.params.id)
  if (!f || !canView(req.user, 'faculty', f)) throw new HttpError(404, 'Faculty member not found.')

  const open = db.prepare("SELECT faculty_id FROM guidance_requests WHERE from_id = ? AND status = 'pending'").all(req.user.id)
  if (open.some((r) => r.faculty_id === f.id)) throw new HttpError(409, `You've already asked ${f.name}. Wait for a reply or withdraw it first.`)
  if (open.length >= MAX_OPEN) throw new HttpError(429, `You have ${MAX_OPEN} requests waiting. Withdraw one or wait for a reply before asking another teacher.`)

  const id = newId('gui')
  db.prepare('INSERT INTO guidance_requests (id, from_id, faculty_id, university, topic, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, f.id, f.university, topic, message ?? null, now())

  const me = users.profile(req.user)
  if (f.email) {
    sendMail({
      to: f.email,
      subject: `MyCampus: ${me.name} would like your guidance`,
      text: [
        `${me.name} (${me.branch ?? 'student'}${me.semester ? `, semester ${me.semester}` : ''}) asked for your guidance on:`,
        topic,
        message ? `\n"${message}"` : '',
        me.skills?.length ? `\nSkills: ${me.skills.slice(0, 8).join(', ')}` : '',
        `\nYou can reply to them directly at ${req.user.email}. Your campus admin can also record your answer in MyCampus.`,
      ].join('\n'),
    }).catch(() => {}) // a mail outage must not fail the request; the admin panel still lists it
  }
  res.status(201).json({ id, status: 'pending' })
}))

guidanceRoutes.get('/me/guidance', wrap(async (req, res) => {
  res.json(db.prepare('SELECT * FROM guidance_requests WHERE from_id = ? ORDER BY created_at DESC').all(req.user.id).map(view))
}))

guidanceRoutes.post('/guidance/:id/withdraw', wrap(async (req, res) => {
  const done = db.prepare("UPDATE guidance_requests SET status = 'withdrawn', decided_at = ? WHERE id = ? AND from_id = ? AND status = 'pending'").run(now(), req.params.id, req.user.id)
  if (!done.changes) throw new HttpError(404, 'No waiting request found.')
  res.json({ id: req.params.id, status: 'withdrawn' })
}))

// ---------------- admin side ----------------

// Guidance requests from this campus's students, newest first. Needs the "faculty" permission.
guidanceRoutes.get('/admin/guidance', requirePermission('faculty'), wrap(async (req, res) => {
  const status = ['pending', 'accepted', 'declined', 'withdrawn'].includes(req.query.status) ? req.query.status : null
  const rows = db.prepare(`SELECT * FROM guidance_requests WHERE university = ? ${status ? 'AND status = ?' : ''} ORDER BY created_at DESC LIMIT 200`)
    .all(...[req.user.university, ...(status ? [status] : [])])
  res.json(rows.map((r) => {
    const s = users.byId(r.from_id)
    const p = s ? users.profile(s) : {}
    return { ...view(r), from: { name: p.name ?? 'Student', email: s?.email, branch: p.branch, semester: p.semester } }
  }))
}))

// Record the teacher's answer. The student is told, with the teacher's note if there is one.
guidanceRoutes.post('/admin/guidance/:id/decide', requirePermission('faculty'), wrap(async (req, res) => {
  const { status, note } = parse(z.object({ status: z.enum(['accepted', 'declined']), note: z.string().trim().max(300).optional() }), req.body)
  const r = db.prepare('SELECT * FROM guidance_requests WHERE id = ? AND university = ?').get(req.params.id, req.user.university)
  if (!r) throw new HttpError(404, 'Request not found.')
  if (r.status !== 'pending') throw new HttpError(409, 'That request was already answered.')
  db.prepare('UPDATE guidance_requests SET status = ?, note = ?, decided_at = ? WHERE id = ?').run(status, note ?? null, now(), r.id)
  const f = docs.get('faculty', r.faculty_id)
  notify([r.from_id], {
    type: status === 'accepted' ? 'guidance_accepted' : 'guidance_declined',
    title: status === 'accepted' ? `${f?.name ?? 'The teacher'} can guide you` : `${f?.name ?? 'The teacher'} can't take this on right now`,
    body: note ?? (status === 'accepted' ? 'Reach out to arrange a time.' : 'Try another teacher whose work fits yours.'),
    data: { facultyId: r.faculty_id },
  })
  audit(req.user, `guidance.${status}`, r.id, { facultyId: r.faculty_id })
  res.json({ id: r.id, status })
}))
