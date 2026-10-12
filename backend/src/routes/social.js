import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { canView } from '../access.js'
import { audit, db, docs, newId, now, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { canSeePerson, isMentor, personView, uniCache } from '../directory.js'
import { notify } from '../notify.js'

export const socialRoutes = Router()
socialRoutes.use(requireAuth)

const requireStudent = (req, res, next) =>
  req.user.role === 'student' ? next() : next(new HttpError(403, 'Only verified campus students can do that.'))

const message = z.string().trim().max(500).optional()
const nameOf = (row) => JSON.parse(row.data).name

// ---------------- connections (peers & mentors) ----------------
const present = (c, otherId, unis) => {
  const row = users.byId(otherId)
  return { id: c.id, kind: c.kind, status: c.status, message: c.message, createdAt: c.created_at, person: row ? personView(row, unis) : null }
}

socialRoutes.get('/connections', wrap(async (req, res) => {
  const unis = uniCache()
  const rows = db.prepare('SELECT * FROM connections WHERE from_id = ? OR to_id = ? ORDER BY updated_at DESC').all(req.user.id, req.user.id)
  const out = { accepted: [], incoming: [], outgoing: [] }
  for (const c of rows) {
    const mine = c.from_id === req.user.id
    const item = present(c, mine ? c.to_id : c.from_id, unis)
    if (!item.person) continue
    if (c.status === 'accepted') out.accepted.push(item)
    else if (c.status === 'pending') (mine ? out.outgoing : out.incoming).push(item)
  }
  res.json(out)
}))

socialRoutes.post('/connections', requireStudent, wrap(async (req, res) => {
  const { to, kind, message: note } = parse(z.object({ to: z.string(), kind: z.enum(['peer', 'mentor']), message }), req.body)
  const target = users.byId(to)
  if (!target || to === req.user.id || !canSeePerson(req.user, target)) throw new HttpError(404, 'Person not found.')
  const theirs = JSON.parse(target.data)
  if (kind === 'peer' && target.university !== req.user.university) throw new HttpError(403, 'You can connect with peers on your own campus. Cross-university collaboration happens through projects and mentors.')
  if (kind === 'mentor' && !isMentor(theirs)) throw new HttpError(400, "That student isn't offering mentorship.")

  const reverse = db.prepare('SELECT * FROM connections WHERE from_id = ? AND to_id = ? AND kind = ?').get(to, req.user.id, kind)
  if (reverse?.status === 'pending') {
    // They already asked you: asking back is the same as accepting.
    db.prepare("UPDATE connections SET status = 'accepted', updated_at = ? WHERE id = ?").run(now(), reverse.id)
    notify([to], { type: 'connection_accepted', title: `${nameOf(req.user)} accepted your request`, data: { userId: req.user.id } })
    return res.status(200).json({ id: reverse.id, status: 'accepted' })
  }
  const existing = db.prepare('SELECT * FROM connections WHERE from_id = ? AND to_id = ? AND kind = ?').get(req.user.id, to, kind)
  if (existing && existing.status !== 'declined') throw new HttpError(409, existing.status === 'accepted' ? "You're already connected." : 'Request already sent.')
  if (existing) throw new HttpError(409, "They've declined this request.")

  const id = newId('con')
  db.prepare('INSERT INTO connections (id, from_id, to_id, kind, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, req.user.id, to, kind, note ?? null, now(), now())
  notify([to], {
    type: 'connection_request',
    title: kind === 'mentor' ? `${nameOf(req.user)} asked you to mentor them` : `${nameOf(req.user)} wants to connect`,
    body: note, data: { connectionId: id, userId: req.user.id },
  })
  res.status(201).json({ id, status: 'pending' })
}))

function decide(status) {
  return wrap(async (req, res) => {
    const c = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id)
    if (!c || c.to_id !== req.user.id) throw new HttpError(404, 'Request not found.')
    if (c.status !== 'pending') throw new HttpError(409, 'That request was already answered.')
    db.prepare('UPDATE connections SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), c.id)
    if (status === 'accepted') notify([c.from_id], { type: 'connection_accepted', title: `${nameOf(req.user)} accepted your request`, data: { userId: req.user.id } })
    res.json({ id: c.id, status })
  })
}
socialRoutes.post('/connections/:id/accept', decide('accepted'))
socialRoutes.post('/connections/:id/decline', decide('declined'))

socialRoutes.delete('/connections/:id', wrap(async (req, res) => {
  const done = db.prepare('DELETE FROM connections WHERE id = ? AND (from_id = ? OR to_id = ?)').run(req.params.id, req.user.id, req.user.id)
  if (!done.changes) throw new HttpError(404, 'Connection not found.')
  res.status(204).end()
}))

// ---------------- student-created projects & startups ----------------
const url = z.string().trim().url().max(300).refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) link.')
const list = (max, len = 80) => z.array(z.string().trim().min(1).max(len)).max(max)

const projectBody = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(400),
  longDescription: z.string().trim().max(4000),
  category: z.string().trim().min(2).max(60),
  stage: z.string().trim().min(2).max(30),
  tags: list(15, 40), skills: list(20, 40), lookingFor: list(10),
  visibility: z.enum(['campus', 'cross-university']),
  github: url, demo: url,
  maxMembers: z.number().int().min(1).max(50),
}).partial().strict()

const startupBody = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(600),
  longDescription: z.string().trim().max(4000),
  sector: z.string().trim().min(2).max(60),
  stage: z.string().trim().min(2).max(30),
  skills: list(20, 40),
  rolesOpen: z.array(z.object({
    role: z.string().trim().min(2).max(80),
    type: z.enum(['co-founder', 'full-time', 'part-time', 'contract', 'intern']),
    equity: z.string().trim().max(40).optional(),
    salary: z.string().trim().max(60).optional(),
  }).strict()).max(10),
  website: url,
  status: z.enum(['hiring', 'active', 'paused']),
}).partial().strict()

const REQUIRED = { project: ['title', 'description', 'category'], startup: ['name', 'tagline', 'description', 'sector'] }

const isOwner = (user, doc) => (doc.ownerId ?? doc.teamIds?.[0]) === user.id
const ownerIds = (kind, doc) => (kind === 'research' ? [] : doc.ownerId ? [doc.ownerId] : (doc.teamIds ?? []).slice(0, 1))

function ownedContent(plural, kind, schema, defaults) {
  socialRoutes.post(`/${plural}`, requireStudent, wrap(async (req, res) => {
    const body = parse(schema, req.body)
    const missing = REQUIRED[kind].filter((f) => body[f] === undefined)
    if (missing.length) throw new HttpError(400, `Missing: ${missing.join(', ')}`)
    const doc = {
      stage: 'idea', skills: [], tags: [], lookingFor: [], rolesOpen: [], visibility: 'cross-university', ...defaults(req.user), ...body,
      id: newId(kind.slice(0, 3)), university: req.user.university, ownerId: req.user.id, teamIds: [req.user.id], team: [nameOf(req.user)],
      createdAt: now(), featured: false,
    }
    res.status(201).json(docs.put(kind, doc))
  }))

  socialRoutes.put(`/${plural}/:id`, requireStudent, wrap(async (req, res) => {
    const doc = docs.get(kind, req.params.id)
    if (!doc || !isOwner(req.user, doc)) throw new HttpError(404, 'Not found.')
    res.json(docs.put(kind, { ...doc, ...parse(schema, req.body), updatedAt: now() }))
  }))

  socialRoutes.delete(`/${plural}/:id`, requireStudent, wrap(async (req, res) => {
    const doc = docs.get(kind, req.params.id)
    if (!doc || !isOwner(req.user, doc)) throw new HttpError(404, 'Not found.')
    docs.remove(kind, doc.id)
    db.prepare('DELETE FROM collab_requests WHERE target_kind = ? AND target_id = ?').run(kind, doc.id)
    res.status(204).end()
  }))
}
ownedContent('projects', 'project', projectBody, () => ({ status: 'active', members: 1, maxMembers: 5, startDate: now().slice(0, 10) }))
ownedContent('startups', 'startup', startupBody, () => ({ status: 'hiring', founded: String(new Date().getFullYear()) }))

// ---------------- collaboration requests ----------------
const KIND_OF = { project: 'project', startup: 'startup', research: 'research' }

function presentRequest(r, unis) {
  const target = docs.get(r.target_kind, r.target_id)
  const sender = users.byId(r.from_id)
  return {
    id: r.id, status: r.status, role: r.role, message: r.message, createdAt: r.created_at, decidedAt: r.decided_at,
    target: target && { kind: r.target_kind, id: target.id, title: target.title ?? target.name },
    from: sender && personView(sender, unis),
  }
}

socialRoutes.get('/collab', wrap(async (req, res) => {
  const unis = uniCache()
  const sent = db.prepare('SELECT * FROM collab_requests WHERE from_id = ? ORDER BY created_at DESC').all(req.user.id)
  // Requests for things you own: projects/startups where you're the owner.
  const owned = [...docs.list('project').map((d) => ['project', d]), ...docs.list('startup').map((d) => ['startup', d])].filter(([, d]) => isOwner(req.user, d))
  const received = owned.flatMap(([kind, d]) => db.prepare('SELECT * FROM collab_requests WHERE target_kind = ? AND target_id = ? ORDER BY created_at DESC').all(kind, d.id))
  res.json({ sent: sent.map((r) => presentRequest(r, unis)), received: received.map((r) => presentRequest(r, unis)) })
}))

socialRoutes.post('/collab', wrap(async (req, res) => {
  const body = parse(z.object({ targetKind: z.enum(['project', 'startup', 'research']), targetId: z.string(), role: z.string().trim().max(80).optional(), message: z.string().trim().min(1, 'Add a short message.').max(500) }), req.body)
  const kind = KIND_OF[body.targetKind]
  const doc = docs.get(kind, body.targetId)
  if (!doc || !canView(req.user, kind, doc)) throw new HttpError(404, 'Not found.')
  if ((doc.teamIds ?? []).includes(req.user.id)) throw new HttpError(400, "You're already on this team.")

  const existing = db.prepare('SELECT * FROM collab_requests WHERE from_id = ? AND target_kind = ? AND target_id = ?').get(req.user.id, kind, doc.id)
  if (existing && ['pending', 'accepted'].includes(existing.status)) throw new HttpError(409, existing.status === 'pending' ? 'You already asked to join.' : "You're already on this team.")
  if (existing?.status === 'declined') throw new HttpError(409, 'The team declined your earlier request.')

  const id = existing?.id ?? newId('col')
  if (existing) db.prepare("UPDATE collab_requests SET status = 'pending', role = ?, message = ?, created_at = ?, decided_at = NULL WHERE id = ?").run(body.role ?? null, body.message, now(), id)
  else db.prepare('INSERT INTO collab_requests (id, from_id, target_kind, target_id, role, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, req.user.id, kind, doc.id, body.role ?? null, body.message, now())

  const title = doc.title ?? doc.name
  notify(ownerIds(kind, doc), {
    type: 'collab_request', title: `${nameOf(req.user)} wants to join ${title}`, body: body.message,
    data: { requestId: id, targetKind: kind, targetId: doc.id },
  })
  // Research listings are run by faculty, who have no accounts yet: route to admins who manage research.
  if (kind === 'research') {
    const admins = db.prepare("SELECT id, data FROM users WHERE role = 'admin' AND university = ? AND status = 'active'").all(doc.university)
      .filter((a) => { const p = JSON.parse(a.data); return p.adminRole === 'superadmin' || p.permissions?.includes('research') })
    notify(admins.map((a) => a.id), { type: 'collab_request', title: `Interest in "${title}"`, body: `${nameOf(req.user)}: ${body.message}`, data: { requestId: id, targetKind: kind, targetId: doc.id } })
  }
  res.status(201).json({ id, status: 'pending' })
}))

socialRoutes.post('/collab/:id/withdraw', wrap(async (req, res) => {
  const done = db.prepare("UPDATE collab_requests SET status = 'withdrawn', decided_at = ? WHERE id = ? AND from_id = ? AND status = 'pending'").run(now(), req.params.id, req.user.id)
  if (!done.changes) throw new HttpError(404, 'No pending request found.')
  res.json({ id: req.params.id, status: 'withdrawn' })
}))

function decideRequest(status) {
  return wrap(async (req, res) => {
    const r = db.prepare('SELECT * FROM collab_requests WHERE id = ?').get(req.params.id)
    const doc = r && docs.get(r.target_kind, r.target_id)
    if (!doc || !isOwner(req.user, doc) || r.target_kind === 'research') throw new HttpError(404, 'Request not found.')
    if (r.status !== 'pending') throw new HttpError(409, 'That request was already answered.')
    db.prepare('UPDATE collab_requests SET status = ?, decided_at = ? WHERE id = ?').run(status, now(), r.id)

    if (status === 'accepted') {
      const sender = users.byId(r.from_id)
      const team = [...new Set([...(doc.teamIds ?? []), r.from_id])]
      docs.put(r.target_kind, { ...doc, teamIds: team, team: [...(doc.team ?? []), nameOf(sender)], ...(doc.members !== undefined && { members: team.length }), ...(doc.teamSize !== undefined && { teamSize: team.length }) })
      audit(req.user, 'collab.accept', r.id, { target: doc.id, member: r.from_id })
    }
    notify([r.from_id], {
      type: status === 'accepted' ? 'collab_accepted' : 'collab_declined',
      title: status === 'accepted' ? `You're in! ${doc.title ?? doc.name} accepted your request` : `${doc.title ?? doc.name} couldn't take your request`,
      data: { targetKind: r.target_kind, targetId: doc.id },
    })
    res.json({ id: r.id, status })
  })
}
socialRoutes.post('/collab/:id/accept', decideRequest('accepted'))
socialRoutes.post('/collab/:id/decline', decideRequest('declined'))
