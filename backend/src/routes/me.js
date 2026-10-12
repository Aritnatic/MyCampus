import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { bus } from '../bus.js'
import { db, now, publicUser, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { stripRanking } from '../access.js'

export const meRoutes = Router()
meRoutes.use(requireAuth)

const tag = z.string().trim().min(1).max(40)
const tags = (max) => z.array(tag).max(max).transform((xs) => [...new Map(xs.map((x) => [x.toLowerCase(), x])).values()])

// Only these fields are user-editable. `.strict()` rejects anything else, so a client can't
// set `verified`, `university`, `rating` and so on.
const profileBody = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500),
  skills: tags(30),
  interests: tags(30),
  lookingFor: z.array(z.string().trim().min(1).max(80)).max(10),
  achievements: z.array(z.string().trim().min(1).max(120)).max(10),
  branch: z.string().trim().max(80),
  year: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
  socials: z.object({ github: z.string().trim().max(60), linkedin: z.string().trim().max(60), twitter: z.string().trim().max(60) }).partial().strict(),
  mentor: z.object({ open: z.boolean(), topics: tags(10) }).strict(),
}).partial().strict()

const connectionCount = (id) =>
  db.prepare("SELECT COUNT(*) AS n FROM connections WHERE status = 'accepted' AND (from_id = ? OR to_id = ?)").get(id, id).n

meRoutes.get('/me', (req, res) => {
  res.json(stripRanking({ ...publicUser(req.user), connections: connectionCount(req.user.id) }))
})

meRoutes.patch('/me', wrap(async (req, res) => {
  const patch = parse(profileBody, req.body)
  const isStudent = req.user.role === 'student'
  // Academic fields only make sense for campus students.
  if (!isStudent && ('branch' in patch || 'year' in patch || 'semester' in patch)) throw new HttpError(400, 'Only campus students have branch, year and semester.')
  const next = { ...users.profile(req.user), ...patch }
  if (patch.name) next.avatar = patch.name.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  users.setProfile(req.user.id, next)
  res.json(stripRanking({ ...publicUser(users.byId(req.user.id)), connections: connectionCount(req.user.id) }))
}))

// ---- push tokens (Expo) ----
meRoutes.post('/me/push-token', wrap(async (req, res) => {
  const { token, platform } = parse(z.object({ token: z.string().min(10).max(200), platform: z.enum(['ios', 'android', 'web']).optional() }), req.body)
  // A device belongs to whoever signed in last on it.
  db.prepare('INSERT INTO push_tokens (token, user_id, platform, created_at) VALUES (?, ?, ?, ?) ON CONFLICT (token) DO UPDATE SET user_id = excluded.user_id, platform = excluded.platform')
    .run(token, req.user.id, platform ?? null, now())
  res.status(204).end()
}))

meRoutes.delete('/me/push-token', wrap(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(200) }), req.body)
  db.prepare('DELETE FROM push_tokens WHERE token = ? AND user_id = ?').run(token, req.user.id)
  res.status(204).end()
}))

// ---- notifications ----
const present = (r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, data: r.data ? JSON.parse(r.data) : null, createdAt: r.created_at, read: !!r.read_at })

meRoutes.get('/notifications', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const before = typeof req.query.before === 'string' ? req.query.before : '9999'
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?').all(req.user.id, before, limit)
  const unread = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL').get(req.user.id).n
  res.json({ unread, items: rows.map(present) })
})

meRoutes.post('/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(now(), req.user.id)
  res.status(204).end()
})

meRoutes.post('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND user_id = ?').run(now(), req.params.id, req.user.id)
  res.status(204).end()
})

// ---- real-time stream (Server-Sent Events) ----
// EventSource can't send an Authorization header, and tokens in URLs end up in logs, so the
// client trades its token for a one-time ticket that is only valid for a minute.
const tickets = new Map()
meRoutes.post('/stream/ticket', (req, res) => {
  const ticket = randomBytes(24).toString('hex')
  tickets.set(ticket, { userId: req.user.id, expires: Date.now() + 60_000 })
  for (const [t, v] of tickets) if (v.expires < Date.now()) tickets.delete(t)
  res.json({ ticket })
})

// Mounted without requireAuth in app.js (the ticket is the credential).
export function streamHandler(req, res) {
  const entry = tickets.get(String(req.query.ticket ?? ''))
  tickets.delete(String(req.query.ticket ?? ''))
  if (!entry || entry.expires < Date.now()) return res.status(401).json({ error: 'Stream ticket is invalid or expired.' })
  const user = users.byId(entry.userId)
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Account unavailable.' })

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
  const send = (event) => res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`)
  send({ type: 'ready', data: { userId: user.id } })

  const channels = [`user:${user.id}`, ...(user.university ? [`uni:${user.university}`] : [])]
  channels.forEach((c) => bus.on(c, send))
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)
  req.on('close', () => {
    clearInterval(heartbeat)
    channels.forEach((c) => bus.off(c, send))
  })
}
