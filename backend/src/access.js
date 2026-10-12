// Who may see what. This is the "verified campus layer" from the project goals:
// campus-only content is visible solely to verified members of that university,
// everything else crosses universities only when explicitly marked so.

export const KINDS = {
  notices: 'notice', events: 'event', exams: 'exam', results: 'result', notes: 'note',
  projects: 'project', startups: 'startup', research: 'research', jobs: 'job', faculty: 'faculty', grades: 'grade', career: 'career',
}

// campus      — same-university members only (individuals never see it)
// shared      — same university, or any signed-in user if marked visibility 'cross-university'
// open        — any signed-in user
const POLICY = {
  notice: 'campus', exam: 'campus', result: 'campus', grade: 'campus', faculty: 'campus',
  event: 'shared', note: 'shared', project: 'shared', research: 'shared',
  startup: 'open', job: 'open', career: 'open',
}

// Content that students only see once it's live; admins see every status for their university.
const LIVE = { notice: ['published'], result: ['published'], job: ['open'], exam: ['scheduled', 'published'], event: ['approved', 'published'] }

const isMember = (user, doc) => user.role !== 'individual' && !!user.university && user.university === doc.university

export function canView(user, kind, doc) {
  if (user.role === 'admin') return doc.university === user.university || POLICY[kind] === 'open' || doc.visibility === 'cross-university'
  const live = LIVE[kind]
  if (live && !live.includes(doc.status)) return false
  switch (POLICY[kind]) {
    case 'campus': return isMember(user, doc)
    case 'shared': return isMember(user, doc) || doc.visibility === 'cross-university'
    default: return true
  }
}

// Which admin permission manages each record type. Superadmins hold all of them.
export const ADMIN_PERMISSION = {
  notice: 'notices', event: 'events', exam: 'exams', result: 'results', job: 'placements',
  faculty: 'faculty', research: 'research',
}

// "Without ranking students": relevance ordering is fine, but nothing student-facing may
// expose class ranks, star ratings or topper lists.
export function stripRanking(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const { rank, rating, toppers, totalStudents, ...rest } = obj // eslint-disable-line no-unused-vars
  return obj.rank !== undefined || obj.rating !== undefined || obj.toppers !== undefined
    ? { ...rest, ...(totalStudents !== undefined && { totalStudents }) }
    : obj
}

const BRANCH_CODES = {
  'Computer Science & Engineering': 'CSE', 'Electronics & Communication': 'ECE', 'Civil Engineering': 'CE',
  'Electrical Engineering': 'EE', 'Mechanical Engineering': 'ME', 'Information Technology': 'IT',
}
export const branchCode = (name) => BRANCH_CODES[name] ?? name

// ---- Discovery: relevance terms and search text per kind ----
import { coverage } from './skills.js'

export const DISCOVER = {
  people:   { terms: (s) => [...s.skills, ...s.interests], text: (s) => [s.name, s.branch, ...s.skills, ...s.interests] },
  projects: { kind: 'project', terms: (p) => [...p.skills, ...p.tags], text: (p) => [p.title, p.category, ...p.skills, ...p.tags, ...p.lookingFor] },
  startups: { kind: 'startup', terms: (s) => s.skills, text: (s) => [s.name, s.sector, s.tagline, ...s.skills, ...s.rolesOpen.map((r) => r.role)] },
  research: { kind: 'research', terms: (r) => [...r.requiredSkills, ...r.preferredSkills, ...r.tags], text: (r) => [r.title, r.supervisor, r.department, ...r.requiredSkills, ...r.tags] },
  jobs:     { kind: 'job', terms: (j) => j.skills, text: (j) => [j.title, j.company, j.location, ...j.skills] },
  faculty:  { kind: 'faculty', terms: (f) => f.researchInterests, text: (f) => [f.name, f.department, f.designation, ...f.researchInterests] },
}

export function matchScore(profile, terms) {
  const mine = [...(profile.skills ?? []), ...(profile.interests ?? [])]
  return coverage(mine, terms).length
}
