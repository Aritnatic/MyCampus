// npm run smoke -- https://your-domain.example [--admin]
//
// Run this right after every deploy. It only reads: it never creates accounts or sends email.
// Optional: SMOKE_EMAIL + SMOKE_PASSWORD (an existing account) also checks sign-in and a signed-in read.
const url = process.argv.slice(2).find((a) => !a.startsWith('--'))?.replace(/\/$/, '')
const expectAdmin = process.argv.includes('--admin')
if (!url) { console.error('Usage: npm run smoke -- <https://your-domain> [--admin]'); process.exit(2) }

let failed = 0
async function check(name, fn) {
  try { const detail = await fn(); console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`) } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`) }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg) }
const get = (path, init) => fetch(url + path, { signal: AbortSignal.timeout(10_000), ...init })

console.log(`Smoke-checking ${url}`)
await check('the server is up', async () => {
  const r = await get('/health'); must(r.ok && (await r.json()).ok, `GET /health -> ${r.status}`)
})
await check('HTTPS with security headers', async () => {
  const r = await get('/health')
  must(url.startsWith('https://') || /localhost|127\.0\.0\.1/.test(url), 'not served over https')
  must(r.headers.get('x-content-type-options') === 'nosniff', 'security headers missing')
})
await check('privacy policy and terms are public', async () => {
  for (const page of ['privacy', 'terms']) {
    const r = await get(`/legal/${page}`); must(r.ok, `/legal/${page} -> ${r.status}`)
    const text = await r.text()
    must(!/\[[A-Z][A-Z _/-]+\]/.test(text), `/legal/${page} still has [BRACKETED] placeholders — get it reviewed and filled in`)
  }
})
await check('the API rejects anonymous callers', async () => {
  const r = await get('/api/me'); must(r.status === 401, `GET /api/me -> ${r.status} (expected 401)`)
})
await check('a wrong password is a clean 401, not a crash', async () => {
  const r = await get('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'smoke-check@invalid.example', password: 'not-a-real-password' }) })
  must(r.status === 401, `login -> ${r.status} (expected 401)`)
})
if (expectAdmin) {
  await check('the admin panel is served', async () => {
    for (const path of ['/', '/admin/students']) {
      const r = await get(path); must(r.ok && /<div id="root"/.test(await r.text()), `${path} -> ${r.status} without the app shell`)
    }
  })
}
if (process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD) {
  await check('a real account can sign in and read', async () => {
    const login = await get('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD }) })
    must(login.ok, `login -> ${login.status}`)
    const { token } = await login.json()
    const me = await get('/api/me', { headers: { Authorization: `Bearer ${token}` } }); must(me.ok, `GET /api/me -> ${me.status}`)
    const notices = await get('/api/content/notices', { headers: { Authorization: `Bearer ${token}` } }); must(notices.ok, `GET /api/content/notices -> ${notices.status}`)
    return `${(await notices.json()).length} notices visible`
  })
}
console.log(failed ? `\n✗ ${failed} check(s) failed — do not announce this deploy.` : '\n✓ All checks passed.')
process.exit(failed ? 1 : 0)
