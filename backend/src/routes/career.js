import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { canView } from '../access.js'
import { docs, users } from '../db.js'
import { HttpError, wrap } from '../http.js'
import { uniCache, withUni } from '../directory.js'
import { coverage, norm } from '../skills.js'
import { viewDocs } from '../views.js'

export const careerRoutes = Router()
careerRoutes.use(requireAuth)

const mySkillList = (user) => { const p = users.profile(user); return [...(p.skills ?? []), ...(p.interests ?? [])] }

function gap(user, path) {
  const mine = mySkillList(user)
  const split = (skills) => {
    const covered = new Map(coverage(mine, skills).map((c) => [c.required, c.by]))
    return {
      have: skills.filter((s) => covered.has(s)), missing: skills.filter((s) => !covered.has(s)),
      via: Object.fromEntries([...covered].filter(([req, by]) => norm(req) !== norm(by))), // e.g. { SQL: 'PostgreSQL' }
    }
  }
  const core = split(path.core)
  const advanced = split(path.advanced)
  // Private self-assessment against the path — never shown to anyone else or used to order students.
  const readiness = Math.round((core.have.length / Math.max(path.core.length, 1)) * 100)
  return { core, advanced, readiness }
}

careerRoutes.get('/career/paths', wrap(async (req, res) => {
  const profile = users.profile(req.user)
  const branch = profile.branch
  res.json(docs.list('career').map((p) => ({
    id: p.id, title: p.title, icon: p.icon, summary: p.summary, branches: p.branches,
    forYourBranch: !branch || p.branches.some((b) => branch.toUpperCase().includes(b) || branch.includes(b)),
    readiness: gap(req.user, p).readiness,
  })))
}))

careerRoutes.get('/career/paths/:id', wrap(async (req, res) => {
  const path = docs.get('career', req.params.id)
  if (!path) throw new HttpError(404, 'Career path not found.')
  const g = gap(req.user, path)
  const wanted = [...path.core, ...path.advanced]

  // Open jobs asking for skills on this path, with what you already have vs. what you'd need.
  const mine = mySkillList(req.user)
  const unis = uniCache()
  const jobs = viewDocs('job', docs.list('job').filter((j) => canView(req.user, 'job', j)), req.user)
    .map((j) => ({ job: j, hits: j.skills.filter((s) => coverage([s], wanted).length) }))
    .filter((x) => x.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 6)
    .map(({ job, hits }) => ({ ...withUni(unis, job), onPath: hits, youHave: coverage(mine, job.skills).map((c) => c.required), youNeed: job.skills.filter((s) => !coverage(mine, [s]).length) }))

  res.json({ ...path, ...g, jobs })
}))
