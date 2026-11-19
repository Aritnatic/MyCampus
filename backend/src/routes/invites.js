import { Router } from 'express'
import { hasPermission, requireAuth } from '../auth.js'
import { canView } from '../access.js'
import { audit, db, docs, newId, now, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { canSeePerson, personView, uniCache } from '../directory.js'
import { notify } from '../notify.js'

// Invitations: whoever runs a project or startup (its owner), or an admin who manages research for a research
// listing, invites someone to join. The invitee accepts (they're added to the team) or declines. The reverse
// of "Ask to join" (collab requests), which stays as it is.
export const inviteRoutes = Router()

const KINDS = ['project', 'startup', 'research']
const titleOf = (doc) => doc.title ?? doc.name
const nameOf = (row) => JSON.parse(row.data).name
const isOwner = (user, doc) => (doc.ownerId ?? doc.teamIds?.[0]) === user.id

// Who may invite people to `doc`.
function canInvite(user, kind, doc) {
  if (kind === 'research') return user.role === 'admin' && doc.university === user.university && hasPermission(user, 'research')
  return isOwner(user, doc)
}

function present(r, unis) {
  const doc = docs.get(r.target_kind, r.target_id)
  const from = users.byId(r.from_id)
  const to = users.byId(r.to_id)
  return {
    id: r.id, status: r.status, role: r.role, message: r.message, createdAt: r.created_at, decidedAt: r.decided_at,
    target: doc && { kind: r.target_kind, id: doc.id, title: titleOf(doc) },
    from: from && (from.role === 'admin' ? { id: from.id, name: nameOf(from), admin: true } : personView(from, unis)),
    to: to && personView(to, unis),
  }
}

// Invites you've received (to answer) and ones you've sent (to follow or cancel).
inviteRoutes.get('/invites', requireAuth, wrap(async (req, res) => {
  const unis = uniCache()
  const received = db.prepare('SELECT * FROM invites WHERE to_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id)
  const sent = db.prepare('SELECT * FROM invites WHERE from_id = ? ORDER BY created_at DESC LIMIT 200').all(req.user.id)
  res.json({ received: received.map((r) => present(r, unis)), sent: sent.map((r) => present(r, unis)) })
}))

// The invites already sent for one listing, so its page can show who's been asked.
inviteRoutes.get('/invites/for/:kind/:id', requireAuth, wrap(async (req, res) => {
  const kind = req.params.kind
  const doc = KINDS.includes(kind) && docs.get(kind, req.params.id)
  if (!doc || !canInvite(req.user, kind, doc)) throw new HttpError(404, 'Not found.')
  const rows = db.prepare('SELECT * FROM invites WHERE target_kind = ? AND target_id = ? ORDER BY created_at DESC').all(kind, doc.id)
  res.json(rows.map((r) => present(r, uniCache())))
}))

inviteRoutes.post('/invites', requireAuth, wrap(async (req, res) => {
  const body = parse(z.object({
    targetKind: z.enum(KINDS), targetId: z.string().min(1).max(60), to: z.string().trim().min(1).max(60),
    role: z.string().trim().max(80).optional(), message: z.string().trim().max(500).optional(),
  }), req.body)
  const doc = docs.get(body.targetKind, body.targetId)
  if (!doc || !canInvite(req.user, body.targetKind, doc)) throw new HttpError(404, 'Not found.')
  // `to` is an account id or a MyCampus ID (MC-XXXX-XXXX), so people can be invited by the ID they share.
  const person = /^MC-/i.test(body.to)
    ? db.prepare('SELECT * FROM users WHERE public_id = ?').get(body.to.toUpperCase())
    : users.byId(body.to)
  const viewer = req.user.role === 'admin' ? { ...req.user, university: req.user.university } : req.user
  if (!person || person.id === req.user.id || person.role !== 'student' || person.status !== 'active' || !canSeePerson(viewer, person)) {
    throw new HttpError(404, 'We couldn’t find that student.')
  }
  if (!canView(person, body.targetKind, doc)) throw new HttpError(400, 'They can’t see this listing, so they can’t join it.')
  if ((doc.teamIds ?? []).includes(person.id)) throw new HttpError(409, `${nameOf(person)} is already on the team.`)
  if (db.prepare("SELECT 1 FROM invites WHERE target_kind = ? AND target_id = ? AND to_id = ? AND status = 'pending'").get(body.targetKind, doc.id, person.id)) {
    throw new HttpError(409, `You've already invited ${nameOf(person)}.`)
  }
  const asked = db.prepare("SELECT id FROM collab_requests WHERE from_id = ? AND target_kind = ? AND target_id = ? AND status = 'pending'").get(person.id, body.targetKind, doc.id)
  if (asked) throw new HttpError(409, `${nameOf(person)} already asked to join. Accept their request in your Inbox.`)

  const id = newId('inv')
  db.prepare('INSERT INTO invites (id, target_kind, target_id, from_id, to_id, role, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, body.targetKind, doc.id, req.user.id, person.id, body.role ?? null, body.message ?? null, now())
  notify([person.id], {
    type: 'invite', title: `${nameOf(req.user)} invited you to join ${titleOf(doc)}`,
    body: body.message || (body.role ? `As ${body.role}` : null), data: { inviteId: id, targetKind: body.targetKind, targetId: doc.id },
  })
  audit(req.user, 'invite.send', id, { target: doc.id, to: person.id })
  res.status(201).json(present(db.prepare('SELECT * FROM invites WHERE id = ?').get(id), uniCache()))
}))

function decide(status) {
  return wrap(async (req, res) => {
    const r = db.prepare('SELECT * FROM invites WHERE id = ?').get(req.params.id)
    const byInvitee = status !== 'cancelled'
    if (!r || (byInvitee ? r.to_id : r.from_id) !== req.user.id) throw new HttpError(404, 'Invite not found.')
    if (r.status !== 'pending') throw new HttpError(409, `This invite was already ${r.status}.`)
    const doc = docs.get(r.target_kind, r.target_id)
    if (!doc) throw new HttpError(410, 'That listing no longer exists.')

    db.exec('BEGIN')
    try {
      db.prepare('UPDATE invites SET status = ?, decided_at = ? WHERE id = ?').run(status, now(), r.id)
      if (status === 'accepted') {
        const team = [...new Set([...(doc.teamIds ?? []), req.user.id])]
        docs.put(r.target_kind, {
          ...doc, teamIds: team, team: [...new Set([...(doc.team ?? []), nameOf(req.user)])],
          ...(doc.members !== undefined && { members: team.length }), ...(doc.teamSize !== undefined && { teamSize: team.length }),
        })
        // Any pending "ask to join" from them for the same listing is now moot.
        db.prepare("UPDATE collab_requests SET status = 'accepted', decided_at = ? WHERE from_id = ? AND target_kind = ? AND target_id = ? AND status = 'pending'").run(now(), req.user.id, r.target_kind, doc.id)
      }
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
    if (byInvitee) {
      notify([r.from_id], {
        type: status === 'accepted' ? 'invite_accepted' : 'invite_declined',
        title: status === 'accepted' ? `${nameOf(req.user)} joined ${titleOf(doc)}` : `${nameOf(req.user)} declined your invite to ${titleOf(doc)}`,
        data: { inviteId: r.id, targetKind: r.target_kind, targetId: doc.id },
      })
    }
    audit(req.user, `invite.${status}`, r.id, { target: doc.id })
    res.json({ id: r.id, status })
  })
}
inviteRoutes.post('/invites/:id/accept', requireAuth, decide('accepted'))
inviteRoutes.post('/invites/:id/decline', requireAuth, decide('declined'))
inviteRoutes.post('/invites/:id/cancel', requireAuth, decide('cancelled'))
