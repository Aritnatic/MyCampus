import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const baseEnv = () => {
  const dir = mkdtempSync(join(tmpdir(), 'mycampus-prod-'))
  return { PATH: process.env.PATH, NODE_ENV: 'production', DATA_DIR: dir, DB_FILE: join(dir, 'db.sqlite'), PORT: String(4900 + Math.floor(Math.random() * 90)) }
}
const run = (env) => spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] })
const waitFor = (child, pattern, ms = 15000) => new Promise((resolve, reject) => {
  let out = ''
  const onData = (d) => { out += d; if (pattern.test(out)) resolve(out) }
  child.stdout.on('data', onData); child.stderr.on('data', onData)
  child.on('exit', () => resolve(out))
  setTimeout(() => reject(new Error(`timed out; output so far:\n${out}`)), ms)
})

describe('production safety', () => {
  it('refuses to start with a missing or unsafe configuration, and says why', async () => {
    const child = run(baseEnv()) // no JWT secret, no mail provider, no CORS
    const out = await waitFor(child, /JWT_SECRET/)
    assert.match(out, /JWT_SECRET/)
    assert.equal(await new Promise((r) => child.on('exit', r)), 1)

    const child2 = run({ ...baseEnv(), JWT_SECRET: 'x'.repeat(40), CORS_ORIGIN: '*', MAIL_PROVIDER: 'resend', RESEND_API_KEY: 'k' })
    const out2 = await waitFor(child2, /CORS_ORIGIN/)
    assert.match(out2, /CORS_ORIGIN must list your real origins/)
    await new Promise((r) => child2.on('exit', r))
  })

  it('never seeds demo accounts, and never reveals verification codes', async () => {
    const env = { ...baseEnv(), JWT_SECRET: 'x'.repeat(40), CORS_ORIGIN: 'https://campus.example.edu', MAIL_PROVIDER: 'resend', RESEND_API_KEY: 'k', RESEND_API_URL: 'http://127.0.0.1:9/never' }
    const child = run(env)
    try {
      await waitFor(child, /listening/)
      const api = `http://127.0.0.1:${env.PORT}/api`
      const login = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'aritra.das@students.cvrp.edu.in', password: 'campus123' }) })
      assert.equal(login.status, 401, 'demo accounts must not exist in production')

      const reg = await fetch(`${api}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'someone@gmail.com', password: 'Str0ng-pass!', name: 'Some One' }) })
      assert.equal(reg.status, 202)
      assert.equal('devCode' in (await reg.json()), false, 'a production API must never return the code')

      const origin = await fetch(`${api}/me`, { headers: { Origin: 'https://evil.example' } })
      assert.equal(origin.headers.get('access-control-allow-origin'), null, 'unlisted origins get no CORS access')
    } finally {
      child.kill('SIGTERM')
    }
  })
})
