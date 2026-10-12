// Test harness: boots the real app against an in-memory database on a random port.
// Env must be set before any app module is imported (config reads it at import time).
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'mycampus-test-'))
process.env.DB_FILE = ':memory:'
process.env.DATA_DIR = dir
process.env.UPLOAD_DIR = join(dir, 'uploads')
process.env.NODE_ENV = 'test'
process.env.MAIL_PROVIDER = 'console'
process.env.SEED_PASSWORD = 'campus123'

const { createApp } = await import('../src/app.js')
const { seed } = await import('../src/seed.js')
await seed()

const server = await new Promise((resolve) => { const s = createApp().listen(0, '127.0.0.1', () => resolve(s)) })
export const base = `http://127.0.0.1:${server.address().port}/api`
export const stop = () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve) })

export const PASSWORD = 'campus123'
export const ACCOUNTS = {
  aritra: 'aritra.das@students.cvrp.edu.in',      // CVRP, CSE sem 5, senior-ish demo student
  priya: 'priya.sharma@students.cvrp.edu.in',     // CVRP, year 4 (mentor by default)
  vikram: 'vikram.singh@students.cvrp.edu.in',    // CVRP, year 4, civil
  rahul: 'rahul.mehta@students.kiit.edu.in',      // KIIT
  sneha: 'sneha.reddy@students.iitbbs.edu.in',    // IIT-BBS, mentor-eligible?
  superadmin: 'rajesh.kumar@cvrp.edu.in',
  moderator: 'anita.sharma@cvrp.edu.in',          // notices, events, placements
  examAdmin: 'vikram.singh@cvrp.edu.in',          // exams, results
  individual: 'priya.sharma@gmail.com',
}

export async function call(path, { token, method = 'GET', body, headers = {}, raw } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(raw ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token && { Authorization: `Bearer ${token}` }), ...headers },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* binary or empty */ }
  return { status: res.status, body: json, text, headers: res.headers }
}

const tokens = new Map()
export async function login(email, password = PASSWORD) {
  if (password === PASSWORD && tokens.has(email)) return tokens.get(email)
  const r = await call('/auth/login', { method: 'POST', body: { email, password } })
  if (r.status !== 200) throw new Error(`login(${email}) -> ${r.status} ${r.text}`)
  if (password === PASSWORD) tokens.set(email, r.body.token)
  return r.body.token
}
export const as = async (name) => login(ACCOUNTS[name])
