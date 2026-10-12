import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { ADMIN_PERMISSION, KINDS, branchCode } from '../access.js'
import { exposeCodes, sendMail } from '../mailer.js'
import { adminPermissions, hasPermission, hashPassword, issueCode, requireAuth, requirePermission } from '../auth.js'
import { audit, db, docs, newId, now, publicUser, universities, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { notify, studentsOf } from '../notify.js'
import { toUniversity } from '../bus.js'

export const adminRoutes = Router()

// ---------------- content management ----------------
const ADMIN_KINDS = Object.fromEntries(Object.entries(KINDS).filter(([, kind]) => ADMIN_PERMISSION[kind]))
const REQUIRED = {
  notice: ['title', 'body', 'category'], event: ['title', 'startDate'], exam: ['title', 'branch', 'semester', 'startDate'],
  result: ['branch', 'semester'], job: ['title', 'company'], faculty: ['name', 'department', 'designation'],
  research: ['title', 'supervisor', 'description'],
}
// Fields clients may never set; they're assigned by the server.
const PROTECTED = ['id', 'university', 'publishedBy', 'ownerId']
const clean = (body) => Object.fromEntries(Object.entries(body ?? {}).filter(([k]) => !PROTECTED.includes(k)))
const LIVE_STATUS = { notice: ['published'], result: ['published'], event: ['approved', 'published'], exam: ['scheduled', 'published'], job: ['open'] }
const becameLive = (kind, before, after) => LIVE_STATUS[kind]?.includes(after.status) && !LIVE_STATUS[kind].includes(before?.status)

const studentsWhere = (university, test) => studentsOf(university, test)
const inBranch = (code, semester) => (p) => branchCode(p.branch) === code && (semester === undefined || p.semester === semester)

// Tells the right students when something goes live.
function announce(kind, doc) {
  const uni = doc.university
  if (kind === 'notice') {
    if (doc.targetAudience === 'faculty') return
    const branches = doc.branches?.length ? doc.branches : null
    notify(studentsWhere(uni, (p) => !branches || branches.includes(branchCode(p.branch))), {
      type: 'notice', title: doc.title, body: String(doc.body ?? '').replace(/\*\*/g, '').slice(0, 140), data: { noticeId: doc.id, priority: doc.priority },
    })
  } else if (kind === 'result') {
    notify(studentsWhere(uni, inBranch(doc.branch, doc.semester)), { type: 'result', title: 'Your results are out', body: `${doc.branch} semester ${doc.semester} results were published.`, data: { resultId: doc.id } })
  } else if (kind === 'event') {
    notify(studentsWhere(uni, () => true), { type: 'event', title: `New event: ${doc.title}`, body: doc.venue, data: { eventId: doc.id } })
  } else if (kind === 'exam') {
    notify(studentsWhere(uni, inBranch(doc.branch, doc.semester)), { type: 'exam', title: 'Exam timetable published', body: doc.title, data: { examId: doc.id } })
  } else if (kind === 'job') {
    const eligible = doc.branch?.length ? doc.branch : null
    notify(studentsWhere(uni, (p) => !eligible || eligible.includes(branchCode(p.branch))), { type: 'job', title: `${doc.company} is hiring`, body: doc.title, data: { jobId: doc.id } })
  }
}

// Content-management routes share one guard. Express 5 has no inline param regexes, so a
// path like /admin/users (which isn't a content type) is passed on to the next matching route.
const contentGuard = [requireAuth, (req, res, next) => {
  const kind = ADMIN_KINDS[req.params.plural]
  if (!kind) return next('route')
  req.kind = kind
  return requirePermission(ADMIN_PERMISSION[kind])(req, res, next)
}]
const adminPath = '/admin/:plural'

adminRoutes.get(adminPath, ...contentGuard, (req, res) => {
  res.json(docs.list(req.kind).filter((d) => d.university === req.user.university))
})

adminRoutes.post(adminPath, ...contentGuard, wrap(async (req, res) => {
  const body = clean(req.body)
  const missing = REQUIRED[req.kind].filter((f) => body[f] === undefined || body[f] === '')
  if (missing.length) throw new HttpError(400, `Missing: ${missing.join(', ')}`)
  const doc = {
    ...body, id: newId(req.kind.slice(0, 3)), university: req.user.university,
    status: body.status ?? (req.kind === 'job' ? 'open' : 'published'),
    ...(req.kind === 'notice' && { publishedBy: req.user.id, publishedAt: body.publishedAt ?? now() }),
  }
  docs.put(req.kind, doc)
  audit(req.user, `${req.kind}.create`, doc.id)
  if (becameLive(req.kind, null, doc)) announce(req.kind, doc)
  res.status(201).json(doc)
}))

adminRoutes.put(`${adminPath}/:id`, ...contentGuard, wrap(async (req, res) => {
  const existing = docs.get(req.kind, req.params.id)
  if (!existing || existing.university !== req.user.university) throw new HttpError(404, 'Not found.')
  const next = docs.put(req.kind, { ...existing, ...clean(req.body) })
  audit(req.user, `${req.kind}.update`, next.id)
  if (becameLive(req.kind, existing, next)) announce(req.kind, next)
  res.json(next)
}))

adminRoutes.delete(`${adminPath}/:id`, ...contentGuard, wrap(async (req, res) => {
  const existing = docs.get(req.kind, req.params.id)
  if (!existing || existing.university !== req.user.university) throw new HttpError(404, 'Not found.')
  docs.remove(req.kind, req.params.id)
  audit(req.user, `${req.kind}.delete`, req.params.id, { title: existing.title ?? existing.name })
  res.status(204).end()
}))

// Who registered for an event (events permission).
adminRoutes.get('/admin/events/:id/registrations', requireAuth, requirePermission('events'), wrap(async (req, res) => {
  const event = docs.get('event', req.params.id)
  if (!event || event.university !== req.user.university) throw new HttpError(404, 'Not found.')
  const rows = db.prepare('SELECT user_id, status, created_at FROM registrations WHERE event_id = ? ORDER BY created_at').all(event.id)
  res.json(rows.map((r) => {
    const u = users.byId(r.user_id)
    return { userId: r.user_id, name: users.profile(u).name, email: u.email, status: r.status, registeredAt: r.created_at }
  }))
}))

// ---------------- research interest inbox ----------------
adminRoutes.get('/admin/collab', requireAuth, requirePermission('research'), wrap(async (req, res) => {
  const mine = new Map(docs.list('research').filter((r) => r.university === req.user.university).map((r) => [r.id, r]))
  const rows = db.prepare("SELECT * FROM collab_requests WHERE target_kind = 'research' ORDER BY created_at DESC").all().filter((r) => mine.has(r.target_id))
  res.json(rows.map((r) => ({
    id: r.id, status: r.status, role: r.role, message: r.message, createdAt: r.created_at,
    research: { id: r.target_id, title: mine.get(r.target_id).title },
    from: (() => { const u = users.byId(r.from_id); return { id: u.id, name: users.profile(u).name, email: u.email } })(),
  })))
}))

for (const status of ['accepted', 'declined']) {
  adminRoutes.post(`/admin/collab/:id/${status === 'accepted' ? 'accept' : 'decline'}`, requireAuth, requirePermission('research'), wrap(async (req, res) => {
    const r = db.prepare("SELECT * FROM collab_requests WHERE id = ? AND target_kind = 'research'").get(req.params.id)
    const research = r && docs.get('research', r.target_id)
    if (!research || research.university !== req.user.university) throw new HttpError(404, 'Request not found.')
    if (r.status !== 'pending') throw new HttpError(409, 'That request was already answered.')
    db.prepare('UPDATE collab_requests SET status = ?, decided_at = ? WHERE id = ?').run(status, now(), r.id)
    notify([r.from_id], {
      type: status === 'accepted' ? 'collab_accepted' : 'collab_declined',
      title: status === 'accepted' ? `Your interest in "${research.title}" was accepted` : `"${research.title}" couldn't take your request`,
      data: { targetKind: 'research', targetId: research.id },
    })
    audit(req.user, `collab.${status}`, r.id)
    res.json({ id: r.id, status })
  }))
}

// ---------------- users ----------------
const ADMIN_ROLES = ['superadmin', 'moderator', 'exams', 'placements', 'content']
const PERMISSIONS = ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users', 'safety', 'faculty', 'research']

const presentAdmin = (row) => {
  const p = users.profile(row)
  return { id: row.id, name: p.name, email: row.email, adminRole: p.adminRole, permissions: p.permissions ?? [], status: row.status, lastLoginAt: row.last_login_at, createdAt: row.created_at }
}

adminRoutes.get('/admin/users', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  res.json(db.prepare("SELECT * FROM users WHERE role = 'admin' AND university = ?").all(req.user.university).map(presentAdmin))
}))

adminRoutes.post('/admin/users', requireAuth, requirePermission('*'), wrap(async (req, res) => {
  const body = parse(z.object({
    name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(),
    adminRole: z.enum(ADMIN_ROLES), permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length).default([]),
  }), req.body)
  const uni = universities.get(req.user.university)
  if (!(uni.domains ?? []).includes(body.email.split('@')[1])) throw new HttpError(400, `Admin emails must use one of: ${(uni.domains ?? []).join(', ')}`)
  if (users.byEmail(body.email)) throw new HttpError(409, 'An account with that email already exists.')

  const id = newId('admin')
  // The new admin sets their own password through the reset flow; nobody ever sees a temporary one.
  db.prepare("INSERT INTO users (id, email, password_hash, role, university, status, data, created_at) VALUES (?, ?, ?, 'admin', ?, 'active', ?, ?)")
    .run(id, body.email, await hashPassword(randomBytes(24).toString('hex')), req.user.university, JSON.stringify({ name: body.name, adminRole: body.adminRole, permissions: body.adminRole === 'superadmin' ? PERMISSIONS : body.permissions }), now())
  const otp = issueCode(body.email, 'reset')
  await sendMail({ to: body.email, subject: 'Your MyCampus admin account', text: `You've been added as an admin. Set your password with this code: ${otp} (valid 15 minutes).` })
  audit(req.user, 'user.create_admin', id, { name: body.name, adminRole: body.adminRole })
  res.status(201).json({ ...presentAdmin(users.byId(id)), ...(exposeCodes() && { devCode: otp }) })
}))

adminRoutes.patch('/admin/users/:id', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const body = parse(z.object({
    status: z.enum(['active', 'suspended']), adminRole: z.enum(ADMIN_ROLES), permissions: z.array(z.enum(PERMISSIONS)),
  }).partial().strict(), req.body)
  const row = users.byId(req.params.id)
  if (!row || row.university !== req.user.university || row.role === 'individual') throw new HttpError(404, 'User not found.')
  if (row.id === req.user.id) throw new HttpError(400, "You can't change your own account here.")
  const target = users.profile(row)
  const isSuper = hasPermission(req.user, '*')
  if (row.role === 'admin' && target.adminRole === 'superadmin' && !isSuper) throw new HttpError(403, 'Only a superadmin can change a superadmin.')
  if (('adminRole' in body || 'permissions' in body) && !isSuper) throw new HttpError(403, 'Only a superadmin can change roles and permissions.')
  if (('adminRole' in body || 'permissions' in body) && row.role !== 'admin') throw new HttpError(400, 'Only admin accounts have roles.')

  if (body.status) db.prepare('UPDATE users SET status = ?, token_version = token_version + 1 WHERE id = ?').run(body.status, row.id) // sign them out everywhere
  if (body.adminRole || body.permissions) {
    users.setProfile(row.id, { ...target, ...(body.adminRole && { adminRole: body.adminRole }), ...(body.permissions && { permissions: body.permissions }) })
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(row.id)
  }
  // Name the person in the log so it reads "Suspended Vikram Singh", not an id.
  audit(req.user, 'user.update', row.id, { name: target.name, ...body })
  const fresh = users.byId(row.id)
  res.json(row.role === 'admin' ? presentAdmin(fresh) : publicUser(fresh))
}))

adminRoutes.get('/admin/students', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const { q, branch, semester, page, limit } = parse(z.object({
    q: z.string().trim().max(80).optional(), branch: z.string().max(20).optional(),
    semester: z.coerce.number().int().min(1).max(12).optional(),
    page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25),
  }), req.query)
  const needle = q?.toLowerCase()
  const everyone = db.prepare("SELECT * FROM users WHERE role = 'student' AND university = ?").all(req.user.university)
    .map((r) => ({ row: r, p: users.profile(r) }))
  // Campus-wide numbers for the page header, independent of whatever filter is applied below.
  const summary = {
    total: everyone.length,
    active: everyone.filter(({ row }) => row.status === 'active').length,
    suspended: everyone.filter(({ row }) => row.status !== 'active').length,
    unverified: everyone.filter(({ row }) => !row.email_verified).length,
  }
  const all = everyone
    .filter(({ row, p }) => (!branch || branchCode(p.branch) === branch) && (!semester || p.semester === semester)
      && (!needle || p.name.toLowerCase().includes(needle) || row.email.includes(needle)))
    .sort((a, b) => a.p.name.localeCompare(b.p.name))
  res.json({
    total: all.length, page, limit, summary,
    items: all.slice((page - 1) * limit, page * limit).map(({ row, p }) => ({
      id: row.id, name: p.name, email: row.email, branch: branchCode(p.branch), year: p.year, semester: p.semester,
      status: row.status, verified: !!row.email_verified, lastLoginAt: row.last_login_at,
    })),
  })
}))

// ---------------- roster import ----------------
const importRow = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  branch: z.string().trim().max(80).optional().default(''),
  year: z.coerce.number().int().min(1).max(6).optional().default(1),
  semester: z.coerce.number().int().min(1).max(12).optional().default(1),
})

// Loads a class list. Each student gets an account with no usable password and an unconfirmed email, so they
// claim it themselves ("Forgot password" in the app). Nothing is created for a row that has a problem, and
// `dryRun` reports exactly what would happen without writing anything.
adminRoutes.post('/admin/students/import', requireAuth, requirePermission('users'), wrap(async (req, res) => {
  const { rows, dryRun, sendInvites } = parse(z.object({ rows: z.array(z.record(z.any())).min(1, 'The file has no rows.').max(2000, 'Import at most 2000 students at a time.'), dryRun: z.boolean().default(false), sendInvites: z.boolean().default(false) }), req.body)
  const uni = universities.get(req.user.university)
  const domains = new Set(uni.domains ?? [])
  const seen = new Set()
  const created = []
  const skipped = []

  rows.forEach((raw, i) => {
    const line = i + 2 // +1 for the header row, +1 because people count from 1
    const parsed = importRow.safeParse(raw)
    if (!parsed.success) return skipped.push({ line, email: raw?.email ?? null, reason: parsed.error.issues[0].message.replace(/^Invalid/, 'Invalid') + (parsed.error.issues[0].path[0] ? ` (${parsed.error.issues[0].path[0]})` : '') })
    const r = parsed.data
    if (!domains.has(r.email.split('@')[1])) return skipped.push({ line, email: r.email, reason: `Not a ${uni.short} email address (allowed: ${[...domains].join(', ')})` })
    if (seen.has(r.email)) return skipped.push({ line, email: r.email, reason: 'Listed twice in this file' })
    seen.add(r.email)
    if (users.byEmail(r.email)) return skipped.push({ line, email: r.email, reason: 'Already has an account' })
    created.push(r)
  })

  if (!dryRun && created.length) {
    const unusable = await hashPassword(randomBytes(24).toString('hex')) // one throwaway hash: nobody can sign in with it
    db.exec('BEGIN')
    try {
      const insert = db.prepare("INSERT INTO users (id, email, password_hash, role, university, status, data, email_verified, created_at) VALUES (?, ?, ?, 'student', ?, 'active', ?, 0, ?)")
      for (const r of created) {
        const profile = {
          name: r.name, avatar: r.name.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join(''), bio: '', skills: [], interests: [], lookingFor: [], achievements: [],
          socials: {}, mentor: { open: false, topics: [] }, verified: true, university: req.user.university, branch: r.branch, year: r.year, semester: r.semester,
        }
        insert.run(newId('stu'), r.email, unusable, req.user.university, JSON.stringify(profile), now())
      }
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
    audit(req.user, 'students.import', null, { recipients: created.length, title: `${created.length} students imported` })
    if (sendInvites) {
      // Fire and forget: a slow mail provider must not hold the admin's request open.
      const text = `${uni.name} has set up MyCampus for you.\n\nOpen the app, choose "Forgot password?" on the sign-in screen, enter this email address, and set your password with the code we send.`
      ;(async () => { for (const r of created) await sendMail({ to: r.email, subject: `Your ${uni.short} MyCampus account`, text }) })()
    }
  }

  res.json({ dryRun, created: created.length, skipped, invitesQueued: !dryRun && sendInvites ? created.length : 0, preview: created.slice(0, 5).map((r) => ({ name: r.name, email: r.email, branch: r.branch })) })
}))

// ---------------- stats, domains, audit, broadcast ----------------
adminRoutes.get('/admin/stats', requireAuth, wrap(async (req, res) => {
  if (req.user.role !== 'admin') throw new HttpError(403, "You don't have permission to do that.")
  const uni = req.user.university
  const of = (kind) => docs.list(kind).filter((d) => d.university === uni)
  const count = (list, pred) => list.filter(pred).length
  const events = of('event'); const results = of('result'); const notices = of('notice')
  res.json({
    students: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND university = ? AND status = 'active'").get(uni).n,
    notices: { published: count(notices, (n) => n.status === 'published'), draft: count(notices, (n) => n.status === 'draft') },
    events: { live: count(events, (e) => ['approved', 'published'].includes(e.status)), pending: count(events, (e) => e.approvalStatus === 'pending' || e.status === 'pending') },
    exams: { scheduled: count(of('exam'), (e) => e.status === 'scheduled') },
    results: { published: count(results, (r) => r.status === 'published'), pending: count(results, (r) => r.status !== 'published') },
    jobs: { open: count(of('job'), (j) => j.status === 'open') },
    alerts: { active: db.prepare("SELECT COUNT(*) AS n FROM alerts WHERE university = ? AND status = 'active'").get(uni).n },
    registrations: db.prepare('SELECT COUNT(*) AS n FROM registrations').get().n,
  })
}))

adminRoutes.get('/admin/domains', requireAuth, requirePermission('settings'), (req, res) => {
  res.json({ domains: universities.get(req.user.university).domains ?? [] })
})

// Which email domains count as "verified members" of this campus.
adminRoutes.put('/admin/domains', requireAuth, requirePermission('settings'), wrap(async (req, res) => {
  const { domains } = parse(z.object({
    domains: z.array(z.string().trim().toLowerCase().regex(/^(?=.{4,100}$)([a-z0-9-]+\.)+[a-z]{2,}$/, 'Enter a valid domain like students.college.edu.in')).min(1).max(10),
  }), req.body)
  const unique = [...new Set(domains)]
  const clash = universities.all().find((u) => u.id !== req.user.university && (u.domains ?? []).some((d) => unique.includes(d)))
  if (clash) throw new HttpError(409, `${clash.short} already uses one of those domains.`)
  // A shared mail domain (gmail.com) would make anyone a "verified" student, so refuse the obvious ones.
  const open = unique.find((d) => ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me'].includes(d))
  if (open) throw new HttpError(400, `${open} is a public mail provider and can't prove campus membership.`)
  universities.put({ ...universities.get(req.user.university), domains: unique })
  audit(req.user, 'settings.domains', req.user.university, { domains: unique })
  res.json({ domains: unique })
}))

adminRoutes.get('/admin/audit', requireAuth, requirePermission('settings'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const rows = db.prepare('SELECT * FROM audit_log WHERE university = ? ORDER BY id DESC LIMIT ?').all(req.user.university, limit)
  res.json(rows.map((r) => ({
    id: r.id, action: r.action, target: r.target, data: r.data ? JSON.parse(r.data) : null, at: r.created_at,
    actor: r.actor_id ? { id: r.actor_id, name: users.byId(r.actor_id) ? users.profile(users.byId(r.actor_id)).name : null } : null,
  })))
})

adminRoutes.post('/admin/notify', requireAuth, requirePermission('notices'), wrap(async (req, res) => {
  const body = parse(z.object({
    title: z.string().trim().min(3).max(100), body: z.string().trim().max(300).optional(),
    branches: z.array(z.string().max(20)).max(12).optional(), semesters: z.array(z.number().int().min(1).max(12)).max(12).optional(),
  }), req.body)
  const ids = studentsOf(req.user.university, (p) =>
    (!body.branches?.length || body.branches.includes(branchCode(p.branch))) && (!body.semesters?.length || body.semesters.includes(p.semester)))
  notify(ids, { type: 'announcement', title: body.title, body: body.body })
  audit(req.user, 'notify.broadcast', null, { title: body.title, recipients: ids.length })
  res.json({ recipients: ids.length })
}))


