import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { canView } from '../access.js'
import { db, docs, now } from '../db.js'
import { HttpError, wrap } from '../http.js'
import { notify } from '../notify.js'

export const eventRoutes = Router()
eventRoutes.use(requireAuth)

function loadEvent(user, id) {
  const e = docs.get('event', id)
  if (!e || !canView(user, 'event', e)) throw new HttpError(404, 'Event not found.')
  return e
}

const registeredCount = (e) =>
  (e.registeredAttendees ?? 0) + db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'registered'").get(e.id).n

function summary(e, userId) {
  const mine = db.prepare('SELECT status FROM registrations WHERE event_id = ? AND user_id = ?').get(e.id, userId)
  const capacity = e.maxParticipants ?? null
  return { eventId: e.id, status: mine?.status ?? null, registered: registeredCount(e), capacity, full: capacity !== null && registeredCount(e) >= capacity }
}

eventRoutes.get('/events/:id/registration', wrap(async (req, res) => {
  res.json(summary(loadEvent(req.user, req.params.id), req.user.id))
}))

eventRoutes.post('/events/:id/register', wrap(async (req, res) => {
  const e = loadEvent(req.user, req.params.id)
  if (e.registrationDeadline && new Date(e.registrationDeadline) < new Date()) throw new HttpError(400, 'Registration for this event has closed.')
  const before = summary(e, req.user.id)
  if (before.status) return res.json(before) // already in: idempotent
  db.prepare('INSERT INTO registrations (event_id, user_id, status, created_at) VALUES (?, ?, ?, ?)').run(e.id, req.user.id, before.full ? 'waitlist' : 'registered', now())
  res.status(201).json(summary(e, req.user.id))
}))

eventRoutes.delete('/events/:id/register', wrap(async (req, res) => {
  const e = loadEvent(req.user, req.params.id)
  const gone = db.prepare('DELETE FROM registrations WHERE event_id = ? AND user_id = ?').run(e.id, req.user.id)
  // A freed seat goes to the longest-waiting person.
  if (gone.changes && !summary(e, req.user.id).full) {
    const next = db.prepare("SELECT user_id FROM registrations WHERE event_id = ? AND status = 'waitlist' ORDER BY created_at LIMIT 1").get(e.id)
    if (next) {
      db.prepare("UPDATE registrations SET status = 'registered' WHERE event_id = ? AND user_id = ?").run(e.id, next.user_id)
      notify([next.user_id], { type: 'event_seat', title: `A seat opened up for ${e.title}`, body: "You're now registered.", data: { eventId: e.id } })
    }
  }
  res.json(summary(e, req.user.id))
}))

eventRoutes.get('/me/events', wrap(async (req, res) => {
  const rows = db.prepare('SELECT event_id, status FROM registrations WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows.flatMap((r) => {
    const e = docs.get('event', r.event_id)
    return e ? [{ status: r.status, event: { id: e.id, title: e.title, startDate: e.startDate, venue: e.venue, type: e.type } }] : []
  }))
}))
