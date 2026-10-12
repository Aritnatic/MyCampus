import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth.js'
import { toUniversity } from '../bus.js'
import { audit, db, newId, now, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { notify, studentsOf } from '../notify.js'

export const alertRoutes = Router()
alertRoutes.use(requireAuth)

const present = (a, mine) => ({
  id: a.id, kind: a.kind, severity: a.severity, title: a.title, message: a.message, location: a.location,
  status: a.status, createdAt: a.created_at, resolvedAt: a.resolved_at, ...(mine !== undefined && { myResponse: mine ?? null }),
})

// Safety alerts are campus-layer: only members of that campus (and its safety admins) see them.
const campusOf = (user) => {
  if (!user.university) throw new HttpError(403, 'Safety alerts are for verified campus members.')
  return user.university
}

alertRoutes.get('/alerts', wrap(async (req, res) => {
  const uni = campusOf(req.user)
  const rows = db.prepare("SELECT * FROM alerts WHERE university = ? AND (status = 'active' OR created_at > ?) ORDER BY created_at DESC LIMIT 30")
    .all(uni, new Date(Date.now() - 7 * 86400_000).toISOString())
  const acks = Object.fromEntries(db.prepare('SELECT alert_id, status FROM alert_acks WHERE user_id = ?').all(req.user.id).map((r) => [r.alert_id, r.status]))
  res.json(rows.map((a) => present(a, acks[a.id])))
}))

alertRoutes.post('/alerts/:id/ack', wrap(async (req, res) => {
  const uni = campusOf(req.user)
  const { status } = parse(z.object({ status: z.enum(['safe', 'need_help']) }), req.body)
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ? AND university = ?').get(req.params.id, uni)
  if (!alert || alert.status !== 'active') throw new HttpError(404, 'That alert is no longer active.')
  db.prepare('INSERT INTO alert_acks (alert_id, user_id, status, created_at) VALUES (?, ?, ?, ?) ON CONFLICT (alert_id, user_id) DO UPDATE SET status = excluded.status, created_at = excluded.created_at')
    .run(alert.id, req.user.id, status, now())
  if (status === 'need_help') toUniversity(uni, { type: 'alert_help', data: { alertId: alert.id, userId: req.user.id } })
  res.json({ alertId: alert.id, status })
}))

// ---- admin: raise / resolve / monitor ----
export const alertAdminRoutes = Router()
// Guard each route (not the whole router): this router is mounted at /api alongside others.
const guard = [requireAuth, requirePermission('safety')]

const alertBody = z.object({
  kind: z.enum(['evacuation', 'safety', 'info']),
  severity: z.enum(['critical', 'warning', 'info']),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(1000),
  location: z.string().trim().max(120).optional(),
})

alertAdminRoutes.post('/admin/alerts', ...guard, wrap(async (req, res) => {
  const body = parse(alertBody, req.body)
  const id = newId('alt')
  const uni = req.user.university
  db.prepare('INSERT INTO alerts (id, university, kind, severity, title, message, location, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, uni, body.kind, body.severity, body.title, body.message, body.location ?? null, req.user.id, now())
  const alert = present(db.prepare('SELECT * FROM alerts WHERE id = ?').get(id))
  toUniversity(uni, { type: 'alert', data: alert })
  notify(studentsOf(uni), { type: 'alert', title: body.title, body: body.message, data: { alertId: id, severity: body.severity, kind: body.kind } })
  audit(req.user, 'alert.create', id, { kind: body.kind, severity: body.severity })
  res.status(201).json(alert)
}))

alertAdminRoutes.get('/admin/alerts', ...guard, wrap(async (req, res) => {
  const rows = db.prepare('SELECT * FROM alerts WHERE university = ? ORDER BY created_at DESC LIMIT 50').all(req.user.university)
  res.json(rows.map((a) => present(a)))
}))

alertAdminRoutes.post('/admin/alerts/:id/resolve', ...guard, wrap(async (req, res) => {
  const done = db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ? AND university = ? AND status = 'active'").run(now(), req.params.id, req.user.university)
  if (!done.changes) throw new HttpError(404, 'No active alert found.')
  toUniversity(req.user.university, { type: 'alert_resolved', data: { id: req.params.id } })
  audit(req.user, 'alert.resolve', req.params.id)
  res.json({ id: req.params.id, status: 'resolved' })
}))

// Roll call: who has said they're safe, who needs help, who hasn't responded.
alertAdminRoutes.get('/admin/alerts/:id/responses', ...guard, wrap(async (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ? AND university = ?').get(req.params.id, req.user.university)
  if (!alert) throw new HttpError(404, 'Alert not found.')
  const acks = db.prepare('SELECT user_id, status, created_at FROM alert_acks WHERE alert_id = ?').all(alert.id)
  const named = (rows) => rows.map((r) => ({ id: r.user_id, name: users.profile(users.byId(r.user_id)).name, at: r.created_at }))
  const total = studentsOf(alert.university).length
  res.json({
    total, safe: acks.filter((a) => a.status === 'safe').length, needHelp: named(acks.filter((a) => a.status === 'need_help')),
    notResponded: total - acks.length,
  })
}))

