import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { Router } from 'express'
import { verifyPassword, requireAuth } from '../auth.js'
import { config } from '../config.js'
import { audit, db, docs, publicUser, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'

export const privacyRoutes = Router()
privacyRoutes.use(requireAuth)

const pub = (row) => ({ name: users.profile(row).name })
const names = (rows, key) => rows.map((r) => ({ ...r, [key]: users.byId(r[key]) ? pub(users.byId(r[key])).name : 'Deleted user' }))

// Everything the platform holds about the signed-in person, in one downloadable file.
privacyRoutes.get('/me/export', wrap(async (req, res) => {
  const me = req.user
  const mine = (kind) => docs.list(kind).filter((d) => d.ownerId === me.id || d.uploadedById === me.id || (d.teamIds ?? []).includes(me.id))
  const data = {
    exportedAt: new Date().toISOString(),
    account: { ...publicUser(me), createdAt: me.created_at, lastLoginAt: me.last_login_at },
    connections: names(db.prepare('SELECT id, from_id, to_id, kind, status, message, created_at FROM connections WHERE from_id = ? OR to_id = ?').all(me.id, me.id), 'from_id').map((c) => ({ ...c, to_id: users.byId(c.to_id) ? pub(users.byId(c.to_id)).name : 'Deleted user' })),
    joinRequests: db.prepare('SELECT target_kind, target_id, role, message, status, created_at FROM collab_requests WHERE from_id = ?').all(me.id),
    eventRegistrations: db.prepare('SELECT event_id, status, created_at FROM registrations WHERE user_id = ?').all(me.id),
    notes: mine('note'), projects: mine('project'), startups: mine('startup'),
    noteRatings: db.prepare('SELECT note_id, rating, review, created_at FROM note_ratings WHERE user_id = ?').all(me.id),
    safetyResponses: db.prepare('SELECT alert_id, status, created_at FROM alert_acks WHERE user_id = ?').all(me.id),
    notifications: db.prepare('SELECT type, title, body, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 500').all(me.id),
    feedback: db.prepare('SELECT category, message, screen, status, created_at FROM feedback WHERE user_id = ?').all(me.id),
    pushDevices: db.prepare('SELECT platform, created_at FROM push_tokens WHERE user_id = ?').all(me.id),
  }
  res.set({ 'Content-Disposition': 'attachment; filename="my-campus-data.json"', 'Cache-Control': 'no-store' })
  res.json(data)
}))

const removeFile = (id) => { const f = join(config.uploadDir, id); if (existsSync(f)) unlinkSync(f) }

// Deleting an account removes the person and everything only they could vouch for. Shared things survive:
// projects with other members are handed to the next member rather than erased.
privacyRoutes.delete('/me', wrap(async (req, res) => {
  const { password } = parse(z.object({ password: z.string().min(1).max(128) }), req.body)
  const me = req.user
  if (me.role === 'admin') throw new HttpError(403, 'Admin accounts are removed by another superadmin. Ask them to suspend yours.')
  if (!(await verifyPassword(password, me.password_hash))) throw new HttpError(400, 'That password is incorrect.')

  db.exec('BEGIN')
  try {
    for (const note of docs.list('note').filter((n) => n.uploadedById === me.id)) {
      docs.remove('note', note.id)
      db.prepare('DELETE FROM note_ratings WHERE note_id = ?').run(note.id)
      removeFile(note.id)
    }
    const profile = users.profile(me)
    for (const kind of ['project', 'startup']) {
      for (const d of docs.list(kind).filter((x) => (x.teamIds ?? []).includes(me.id))) {
        const rest = d.teamIds.filter((i) => i !== me.id)
        if (rest.length === 0) {
          docs.remove(kind, d.id)
          db.prepare('DELETE FROM collab_requests WHERE target_kind = ? AND target_id = ?').run(kind, d.id)
        } else {
          const team = (d.team ?? []).filter((n) => n !== profile.name)
          docs.put(kind, { ...d, teamIds: rest, team, ownerId: (d.ownerId ?? d.teamIds[0]) === me.id ? rest[0] : d.ownerId ?? d.teamIds[0], ...(d.members !== undefined && { members: rest.length }), ...(d.teamSize !== undefined && { teamSize: rest.length }) })
        }
      }
    }
    // Foreign keys cascade the rest: connections, join requests, registrations, notifications, devices, safety responses, ratings.
    db.prepare('UPDATE audit_log SET actor_id = NULL WHERE actor_id = ?').run(me.id)
    db.prepare('DELETE FROM users WHERE id = ?').run(me.id)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  audit({ id: null, university: me.university }, 'account.deleted', null)
  res.status(204).end()
}))
