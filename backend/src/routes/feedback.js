import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { audit, db, newId, now, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'

export const feedbackRoutes = Router()

const DAILY_LIMIT = 10 // per person, so one account can't flood the inbox

// Any signed-in person (student or individual) can tell the team what's broken or missing.
feedbackRoutes.post('/feedback', requireAuth, wrap(async (req, res) => {
  const body = parse(z.object({
    category: z.enum(['bug', 'idea', 'other']),
    message: z.string().trim().min(5, 'Tell us a little more (at least 5 characters).').max(2000),
    screen: z.string().trim().max(80).optional(),
    appVersion: z.string().trim().max(40).optional(),
  }), req.body)
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  if (db.prepare('SELECT COUNT(*) AS n FROM feedback WHERE user_id = ? AND created_at > ?').get(req.user.id, since).n >= DAILY_LIMIT) {
    throw new HttpError(429, "You've sent a lot of feedback today. Thank you — please try again tomorrow.")
  }
  const id = newId('fb')
  db.prepare('INSERT INTO feedback (id, user_id, university, category, message, screen, app_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, req.user.university ?? null, body.category, body.message, body.screen ?? null, body.appVersion ?? null, now())
  res.status(201).json({ id })
}))

const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : next(new HttpError(403, "You don't have permission to do that.")))

// Feedback from this campus's people, newest first. Any admin of the campus can triage it.
feedbackRoutes.get('/admin/feedback', requireAuth, adminOnly, wrap(async (req, res) => {
  const status = req.query.status
  const rows = db.prepare(`SELECT * FROM feedback WHERE university = ? ${['new', 'seen', 'done'].includes(status) ? 'AND status = ?' : ''} ORDER BY created_at DESC LIMIT 200`)
    .all(...[req.user.university, ...(['new', 'seen', 'done'].includes(status) ? [status] : [])])
  res.json(rows.map((r) => {
    const u = users.byId(r.user_id)
    return {
      id: r.id, category: r.category, message: r.message, screen: r.screen, appVersion: r.app_version, status: r.status, createdAt: r.created_at,
      from: { name: users.profile(u).name, email: u.email },
    }
  }))
}))

feedbackRoutes.patch('/admin/feedback/:id', requireAuth, adminOnly, wrap(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['new', 'seen', 'done']) }), req.body)
  const row = db.prepare('SELECT * FROM feedback WHERE id = ? AND university = ?').get(req.params.id, req.user.university)
  if (!row) throw new HttpError(404, 'Not found.')
  db.prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, row.id)
  audit(req.user, 'feedback.update', row.id, { status })
  res.json({ id: row.id, status })
}))
