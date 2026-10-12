// npm run loadtest [-- --users 500 --seconds 30 --think 3000]
//
// Boots a real server on a throwaway database, adds N students, signs them all in, keeps a live stream
// open for each, has them browse like a student would, and raises a safety alert mid-run to time how
// long it takes to reach every phone. Exits non-zero if the numbers miss the pilot targets below.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({ options: { users: { type: 'string', default: '500' }, seconds: { type: 'string', default: '30' }, think: { type: 'string', default: '3000' }, keep: { type: 'boolean', default: false } } })
const USERS = Number(args.users)
const SECONDS = Number(args.seconds)
const THINK = Number(args.think) // mean ms a student spends on a screen before the next refresh
const TARGETS = { p95Ms: 800, alertP95Ms: 3000, errorRate: 0 } // what "good enough for a 500-student pilot" means

const dir = mkdtempSync(join(tmpdir(), 'mycampus-load-'))
const port = await new Promise((resolve) => { const s = createServer().listen(0, () => { const p = s.address().port; s.close(() => resolve(p)) }) })
const PASSWORD = 'load-test-pass-1'
const ADMIN = 'rajesh.kumar@cvrp.edu.in'

// ---- 1. seed the database before the server opens it ----
process.env.DATA_DIR = dir
process.env.DB_FILE = join(dir, 'load.db')
process.env.SEED_PASSWORD = PASSWORD
process.env.NODE_ENV = 'development'
const { db, newId, now } = await import('../src/db.js')
const { seed } = await import('../src/seed.js')
const { hashPassword } = await import('../src/auth.js')
await seed()
const hash = await hashPassword(PASSWORD)
const BRANCHES = ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE']
const SKILLS = ['React', 'Python', 'Arduino', 'CAD', 'Figma', 'Machine learning', 'Node.js', 'Embedded C']
const emails = []
db.exec('BEGIN')
const insert = db.prepare("INSERT INTO users (id, email, password_hash, role, university, status, data, email_verified, created_at) VALUES (?, ?, ?, 'student', 'cvrp', 'active', ?, 1, ?)")
for (let i = 0; i < USERS; i++) {
  const email = `load${i}@students.cvrp.edu.in`
  emails.push(email)
  insert.run(newId('stu'), email, hash, JSON.stringify({
    name: `Load Student ${i}`, avatar: 'LS', bio: 'Load test account', skills: [SKILLS[i % 8], SKILLS[(i + 3) % 8]], interests: [SKILLS[(i + 5) % 8]], lookingFor: [SKILLS[(i + 1) % 8]],
    achievements: [], socials: {}, mentor: { open: i % 10 === 0, topics: [] }, verified: true, university: 'cvrp', branch: BRANCHES[i % 5], year: 1 + (i % 4), semester: 1 + (i % 8),
  }), now())
}
db.exec('COMMIT')
db.close()

// ---- 2. start the real server ----
const server = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/server.js'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: { ...process.env, PORT: String(port), AUTH_IP_LIMIT: '1000000', LOG_REQUESTS: '0', SEED_DEMO: '0' },
  stdio: ['ignore', 'pipe', 'inherit'],
})
const base = `http://127.0.0.1:${port}/api`
for (let i = 0; ; i++) {
  try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break } catch { /* not up yet */ }
  if (i > 100) throw new Error('server did not start')
  await new Promise((r) => setTimeout(r, 100))
}

// ---- measurement helpers ----
const samples = new Map() // label -> [ms]
const errors = []
async function timed(label, token, path, init = {}) {
  const t0 = performance.now()
  try {
    const res = await fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...init.headers } })
    const body = await res.json().catch(() => null)
    ;(samples.get(label) ?? samples.set(label, []).get(label)).push(performance.now() - t0)
    if (!res.ok) errors.push(`${label}: ${res.status} ${body?.error ?? ''}`)
    return body
  } catch (e) {
    errors.push(`${label}: ${e.message} (${e.cause?.code ?? e.cause?.message ?? 'no cause'})`)
    return null
  }
}
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0 }
const pool = async (items, size, fn) => { let next = 0; await Promise.all(Array.from({ length: size }, async () => { while (next < items.length) await fn(items[next++]) })) }

// ---- 3. everyone signs in (a morning rush), then opens a live stream ----
console.log(`Signing in ${USERS} students…`)
const tokens = []
const loginStart = performance.now()
await pool(emails, 50, async (email) => { const r = await timed('login', null, '/auth/login', { method: 'POST', body: JSON.stringify({ email, password: PASSWORD }) }); if (r?.token) tokens.push(r.token) })
console.log(`  ${tokens.length} signed in over ${((performance.now() - loginStart) / 1000).toFixed(1)}s`)

const alertSeenAt = []
let alertSentAt = 0
const streams = new AbortController()
let connected = 0
await pool(tokens, 50, async (token) => {
  const t = await timed('stream ticket', token, '/stream/ticket', { method: 'POST' })
  if (!t?.ticket) return
  const res = await fetch(`${base}/stream?ticket=${t.ticket}`, { signal: streams.signal }).catch(() => null)
  if (!res?.ok) return errors.push(`stream: ${res?.status}`)
  connected++
  ;(async () => {
    const reader = res.body.getReader(); const decoder = new TextDecoder()
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break
        if (alertSentAt && decoder.decode(value).includes('event: alert')) { alertSeenAt.push(performance.now() - alertSentAt); break }
      }
    } catch { /* aborted at the end */ }
  })()
})
console.log(`  ${connected} live streams open`)

// ---- 4. browse like students for SECONDS ----
console.log(`Browsing for ${SECONDS}s…`)
const QUERIES = ['react developer', 'arduino project', 'machine learning mentor', 'hackathon team', 'cad design help', 'internship']
const endAt = performance.now() + SECONDS * 1000
const alertAt = performance.now() + (SECONDS * 1000) / 2
let alertRaised = false
const adminToken = (await timed('admin login', null, '/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN, password: PASSWORD }) }))?.token

async function student(token, n) {
  await new Promise((r) => setTimeout(r, Math.random() * Math.min(THINK, 5000))) // people don't all start on the same millisecond
  while (performance.now() < endAt) {
    await timed('GET /me', token, '/me')
    await Promise.all([ // the Home screen fires these together
      timed('GET /content/notices', token, '/content/notices'),
      timed('GET /content/events', token, '/content/events'),
      timed('GET /content/exams', token, '/content/exams'),
      timed('GET /matches', token, '/matches'),
    ])
    await timed('GET /notifications', token, '/notifications')
    await timed('GET /search', token, `/search?q=${encodeURIComponent(QUERIES[(n + Math.floor(performance.now() / 5000)) % QUERIES.length])}`)
    if (n % 7 === 0) await timed('GET /alerts', token, '/alerts')
    await new Promise((r) => setTimeout(r, THINK * (0.5 + Math.random()))) // reading time between screens
  }
}
const alertTimer = setTimeout(async () => {
  alertRaised = true
  alertSentAt = performance.now()
  await timed('POST /admin/alerts', adminToken, '/admin/alerts', { method: 'POST', body: JSON.stringify({ kind: 'safety', severity: 'critical', title: 'Load test drill', message: 'This is only a test.' }) })
}, alertAt - performance.now())
await Promise.all(tokens.map((t, n) => student(t, n)))
clearTimeout(alertTimer)
await new Promise((r) => setTimeout(r, 2000)) // let the last alert deliveries land

// ---- 5. report ----
const rss = Number((await new Promise((resolve) => { const p = spawn('ps', ['-o', 'rss=', '-p', String(server.pid)]); let o = ''; p.stdout.on('data', (d) => { o += d }); p.on('close', () => resolve(o)) })).trim()) / 1024
streams.abort()
server.kill('SIGTERM')

console.log('\nEndpoint                    count    p50     p95     p99   (ms)')
let worstP95 = 0
for (const [label, xs] of [...samples].sort()) {
  const p95 = pct(xs, 0.95)
  if (!['login', 'admin login'].includes(label)) worstP95 = Math.max(worstP95, p95)
  console.log(`${label.padEnd(26)} ${String(xs.length).padStart(6)} ${pct(xs, 0.5).toFixed(0).padStart(6)} ${p95.toFixed(0).padStart(7)} ${pct(xs, 0.99).toFixed(0).padStart(7)}`)
}
const total = [...samples.values()].reduce((n, xs) => n + xs.length, 0)
const alertP95 = pct(alertSeenAt, 0.95)
console.log(`\nRequests: ${total} (${(total / SECONDS).toFixed(0)}/s) · errors: ${errors.length} · server memory: ${rss.toFixed(0)} MB`)
console.log(`Safety alert reached ${alertSeenAt.length}/${connected} live phones · p50 ${pct(alertSeenAt, 0.5).toFixed(0)}ms · p95 ${alertP95.toFixed(0)}ms · slowest ${Math.max(0, ...alertSeenAt).toFixed(0)}ms`)
if (errors.length) console.log(`First errors:\n  ${[...new Set(errors)].slice(0, 5).join('\n  ')}`)

const failures = []
if (worstP95 > TARGETS.p95Ms) failures.push(`slowest endpoint p95 ${worstP95.toFixed(0)}ms > ${TARGETS.p95Ms}ms`)
if (errors.length / Math.max(total, 1) > TARGETS.errorRate) failures.push(`${errors.length} errors`)
if (!alertRaised || alertSeenAt.length < connected) failures.push(`alert reached only ${alertSeenAt.length}/${connected} phones`)
if (alertP95 > TARGETS.alertP95Ms) failures.push(`alert p95 ${alertP95.toFixed(0)}ms > ${TARGETS.alertP95Ms}ms`)
if (tokens.length < USERS) failures.push(`only ${tokens.length}/${USERS} could sign in`)
console.log(failures.length ? `\n✗ BELOW TARGET\n  ${failures.join('\n  ')}` : '\n✓ Meets the pilot targets')
if (!args.keep) rmSync(dir, { recursive: true, force: true })
process.exit(failures.length ? 1 : 0)
