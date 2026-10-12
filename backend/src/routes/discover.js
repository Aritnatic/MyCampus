import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { canView, DISCOVER, matchScore } from '../access.js'
import { docs, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { canSeePerson, connectionCounts, isMentor, personView, uniCache, withUni } from '../directory.js'
import { search } from '../search.js'
import { coverage, skillInText } from '../skills.js'
import { viewDocs } from '../views.js'

export const discoverRoutes = Router()
discoverRoutes.use(requireAuth)

const profileOf = (user) => JSON.parse(user.data)

// Students this person may see, with each profile parsed once. Cards are built later, only for who is shown.
function visiblePeople(user, scope, { mentorsOnly } = {}) {
  return users.students()
    .filter((r) => r.id !== user.id && canSeePerson(user, r))
    .filter((r) => (scope === 'all' ? true : r.university === user.university))
    .map((row) => ({ row, profile: JSON.parse(row.data) }))
    .filter(({ profile }) => !mentorsOnly || isMentor(profile))
}

function candidates(user, kind, scope, { mentorsOnly } = {}) {
  const unis = uniCache()
  if (kind === 'people') {
    const counts = connectionCounts()
    return visiblePeople(user, scope, { mentorsOnly }).map(({ row, profile }) => personView(row, unis, counts, profile))
  }
  const dk = DISCOVER[kind].kind
  const items = viewDocs(dk, docs.list(dk).filter((d) => canView(user, dk, d)), user)
  // Jobs aren't tied to a campus; faculty are already campus-only via canView.
  const scoped = scope === 'campus' && kind !== 'jobs' ? items.filter((d) => d.university === user.university) : items
  return scoped.map((d) => withUni(unis, d))
}

discoverRoutes.get('/discover/:kind', wrap(async (req, res) => {
  const spec = DISCOVER[req.params.kind]
  if (!spec) throw new HttpError(404, 'Unknown discovery type.')
  const scope = req.query.scope === 'all' ? 'all' : 'campus'
  const needle = String(req.query.q ?? '').trim().toLowerCase()
  const me = profileOf(req.user)

  const out = candidates(req.user, req.params.kind, scope, { mentorsOnly: req.query.mentors === '1' })
    .filter((x) => !needle || spec.text(x).some((t) => String(t).toLowerCase().includes(needle)))
    // Order is by relevance to *you* (shared skills/interests) — never a ranking of people.
    .map((x) => ({ item: x, score: matchScore(me, spec.terms(x)) }))
    .sort((a, b) => b.score - a.score)
  res.json(out)
}))

discoverRoutes.get('/discover/:kind/:id', wrap(async (req, res) => {
  const spec = DISCOVER[req.params.kind]
  if (!spec) throw new HttpError(404, 'Unknown discovery type.')
  const unis = uniCache()
  if (req.params.kind === 'people') {
    const row = users.byId(req.params.id)
    if (!row || !canSeePerson(req.user, row)) throw new HttpError(404, 'Not found.')
    return res.json(personView(row, unis))
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

discoverRoutes.get('/matches', wrap(async (req, res) => {
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

  res.json({ projects, startups, research, people: shownPeople, profileComplete: mine.length > 0 })
}))
