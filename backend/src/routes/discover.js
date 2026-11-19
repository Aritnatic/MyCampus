import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { branchCode, canView, DISCOVER, matchScore } from '../access.js'
import { docs, studentsVersion, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { canSeePerson, connectionCounts, isMentor, personView, studentRows, uniCache, withUni , contactFor} from '../directory.js'
import { search } from '../search.js'
import { coverage, skillInText } from '../skills.js'
import { viewDocs } from '../views.js'

export const discoverRoutes = Router()
discoverRoutes.use(requireAuth)

const profileOf = (user) => JSON.parse(user.data)

// Students this person may see, with each profile parsed once. Cards are built later, only for who is shown.
function visiblePeople(user, scope, { mentorsOnly } = {}) {
  return studentRows()
    .filter(({ row }) => row.id !== user.id && canSeePerson(user, row))
    .filter(({ row }) => (scope === 'all' ? true : row.university === user.university))
    .filter(({ profile }) => !mentorsOnly || isMentor(profile))
}

function candidates(user, kind, scope) {
  const unis = uniCache()
  const dk = DISCOVER[kind].kind
  const items = viewDocs(dk, docs.list(dk).filter((d) => canView(user, dk, d)), user)
  // Jobs aren't tied to a campus; faculty are already campus-only via canView.
  const scoped = scope === 'campus' && kind !== 'jobs' ? items.filter((d) => d.university === user.university) : items
  return scoped.map((d) => withUni(unis, d))
}

// A list never needs to be longer than a screen or two; "search to narrow" covers the rest. Capping it
// keeps a campus of thousands from being sent (and rendered) in full on every visit.
const LIST_LIMIT = 100

discoverRoutes.get('/discover/:kind', wrap(async (req, res) => {
  const spec = DISCOVER[req.params.kind]
  if (!spec) throw new HttpError(404, 'Unknown discovery type.')
  const scope = req.query.scope === 'all' ? 'all' : 'campus'
  const needle = String(req.query.q ?? '').trim().toLowerCase()
  const me = profileOf(req.user)
  // Order is by relevance to *you* (shared skills/interests) — never a ranking of people.
  const rank = (list, get) => list
    .filter((x) => !needle || spec.text(get(x)).some((t) => String(t).toLowerCase().includes(needle)))
    .map((x) => ({ x, score: matchScore(me, spec.terms(get(x))) }))
    .sort((a, b) => b.score - a.score)

  if (req.params.kind === 'people') {
    // Score the raw profiles and build cards only for the ones that are shown.
    const unis = uniCache()
    const counts = connectionCounts()
    const shown = rank(visiblePeople(req.user, scope, { mentorsOnly: req.query.mentors === '1' }), (p) => p.profile).slice(0, LIST_LIMIT)
    return res.json(shown.map(({ x, score }) => ({ item: personView(x.row, unis, counts, x.profile), score })))
  }
  res.json(rank(candidates(req.user, req.params.kind, scope), (x) => x).slice(0, LIST_LIMIT).map(({ x, score }) => ({ item: x, score })))
}))

discoverRoutes.get('/discover/:kind/:id', wrap(async (req, res) => {
  const spec = DISCOVER[req.params.kind]
  if (!spec) throw new HttpError(404, 'Unknown discovery type.')
  const unis = uniCache()
  if (req.params.kind === 'people') {
    const row = users.byId(req.params.id)
    if (!row || !canSeePerson(req.user, row)) throw new HttpError(404, 'Not found.')
    // Real count of what they're on (projects, startups and approved research), not a stored number.
    const projects = ['project', 'startup', 'research']
      .flatMap((k) => docs.list(k).filter((d) => (d.teamIds ?? []).includes(row.id) && !['proposed', 'rejected'].includes(d.status))).length
    return res.json({ ...personView(row, unis), projects, contact: contactFor(req.user, row) })
  }
  const doc = docs.get(spec.kind, req.params.id)
  const [view] = doc && canView(req.user, spec.kind, doc) ? viewDocs(spec.kind, [doc], req.user) : []
  if (!view) throw new HttpError(404, 'Not found.')
  res.json(withUni(unis, view))
}))

// ---- semantic-ish search across everything you can see ----
discoverRoutes.get('/search', wrap(async (req, res) => {
  const { q, kinds } = parse(z.object({
    q: z.string().trim().min(2, 'Type at least 2 characters.').max(200),
    kinds: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  }), req.query)
  res.json(search(req.user, q, { kinds }))
}))

// ---- collaboration matching: what you can offer vs what others need ----
// Skill lists are compared through src/skills.js (PostgreSQL covers SQL), and free-text roles or
// "looking for" lines are searched for a skill you hold. Reasons quote the real phrases from the
// listing and your profile so they read naturally.
const offer = (me) => [...(me.skills ?? []), ...(me.interests ?? [])]
const roleHit = (roles = [], skills) => roles.flatMap((role) => {
  const by = skills.find((s) => skillInText(s, role))
  return by ? [{ role, by }] : []
})

// Suggestions are the costliest thing the app asks for (every request compares you with every student),
// and Home and Discover both ask. The answer only changes when a student account or a listing changes,
// so keep each person's last answer until then. Bounded, so memory stays flat as the campus grows.
const MATCH_CACHE_MAX = 1000
const matchCache = new Map()
function cachedMatches(user, compute) {
  const stamp = docs.stamp()
  const key = `${studentsVersion()}|${stamp.n}|${stamp.t}`
  const hit = matchCache.get(user.id)
  if (hit?.key === key) return hit.value
  const value = compute()
  matchCache.delete(user.id)
  matchCache.set(user.id, { key, value })
  if (matchCache.size > MATCH_CACHE_MAX) matchCache.delete(matchCache.keys().next().value) // oldest first
  return value
}

discoverRoutes.get('/matches', wrap(async (req, res) => {
  res.json(cachedMatches(req.user, () => computeMatches(req.user)))
}))

function computeMatches(user) {
  const req = { user }
  const me = profileOf(req.user)
  const mine = offer(me)
  const rank = (list) => list.filter((m) => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 8)
  const notOnTeam = (x) => !(x.teamIds ?? []).includes(req.user.id)

  const projects = rank(candidates(req.user, 'projects', 'all').filter(notOnTeam).map((p) => {
    const roles = roleHit(p.lookingFor, mine)
    const skills = coverage(mine, p.skills)
    return { item: p, score: roles.length * 3 + skills.length * 2, reasons: [
      ...roles.map((r) => `They need "${r.role}" — you know ${r.by}`),
      ...skills.slice(0, 3).map((c) => `Uses ${c.required} — you list ${c.by}`),
    ] }
  }))

  const startups = rank(candidates(req.user, 'startups', 'all').filter(notOnTeam).map((st) => {
    const roles = roleHit(st.rolesOpen?.map((r) => r.role), mine)
    const skills = coverage(mine, st.skills)
    return { item: st, score: roles.length * 3 + skills.length * 2, reasons: [
      ...roles.map((r) => `Hiring a ${r.role} — you know ${r.by}`),
      ...skills.slice(0, 3).map((c) => `Needs ${c.required} — you list ${c.by}`),
    ] }
  }))

  const research = rank(candidates(req.user, 'research', 'all').map((r) => {
    const required = coverage(mine, r.requiredSkills)
    const preferred = coverage(mine, r.preferredSkills)
    return { item: r, score: required.length * 3 + preferred.length, reasons: [
      ...required.map((c) => `Requires ${c.required} — you list ${c.by}`),
      ...preferred.map((c) => `Prefers ${c.required} — you list ${c.by}`),
    ] }
  }))

  // People are matched on complementarity: they need what you have, or have what you're looking for.
  // Score on the raw profiles and only build cards for the few shown (the card needs extra queries).
  const unis = uniCache()
  const people = rank(visiblePeople(req.user, 'all').map(({ row, profile: p }) => {
    const theyNeed = roleHit(p.lookingFor, mine)
    const youNeed = (me.lookingFor ?? []).flatMap((want) => { const by = (p.skills ?? []).find((s) => skillInText(s, want)); return by ? [{ want, by }] : [] })
    return { item: { row, profile: p }, score: theyNeed.length * 2 + youNeed.length * 2, reasons: [
      ...theyNeed.map((r) => `Looking for "${r.role}" — you know ${r.by}`),
      ...youNeed.map((r) => `You want "${r.want}" — they know ${r.by}`),
    ] }
  }))

  const shownPeople = people.map((m) => ({ ...m, item: personView(m.item.row, unis, undefined, m.item.profile) }))

  // Teachers on your campus whose research overlaps what you know: possible project guides.
  const faculty = rank(candidates(req.user, 'faculty', 'campus').map((f) => {
    const fit = coverage(mine, f.researchInterests)
    return { item: f, score: fit.length * 2, reasons: fit.slice(0, 3).map((c) => `Researches ${c.required} — you list ${c.by}`) }
  })).slice(0, 4)

  return { projects, startups, research, people: shownPeople, faculty, profileComplete: mine.length > 0 }
}

// Every verified student at your college, A–Z, with search and branch / year filters, a page at a time. (The
// People list is ranked by how well people match you and stops at 100; this is the full directory.)
discoverRoutes.get('/directory/students', wrap(async (req, res) => {
  if (!req.user.university) throw new HttpError(403, 'Join your college to see its students.')
  const { q, branch, year, page, limit } = parse(z.object({
    q: z.string().trim().max(80).optional(), branch: z.string().trim().max(20).optional(),
    year: z.coerce.number().int().min(1).max(6).optional(),
    page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(40),
  }), req.query)
  const needle = q?.toLowerCase()
  const all = studentRows()
    .filter(({ row }) => row.university === req.user.university && canSeePerson(req.user, row))
    .filter(({ profile: p }) => (!branch || branchCode(p.branch) === branch) && (!year || p.year === year))
    .filter(({ row, profile: p }) => !needle || p.name.toLowerCase().includes(needle) || String(row.public_id ?? '').toLowerCase().includes(needle)
      || (p.skills ?? []).some((s) => s.toLowerCase().includes(needle)))
    .sort((a, b) => a.profile.name.localeCompare(b.profile.name))
  const unis = uniCache()
  const counts = connectionCounts()
  res.json({ total: all.length, page, limit, items: all.slice((page - 1) * limit, page * limit).map(({ row, profile }) => ({ ...personView(row, unis, counts, profile), isMe: row.id === req.user.id })) })
}))
