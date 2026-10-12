import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const dir = mkdtempSync(join(tmpdir(), 'mycampus-boot-'))
const env = { PATH: process.env.PATH, NODE_ENV: 'development', SEED_DEMO: '0', MAIL_PROVIDER: 'console', DATA_DIR: dir, DB_FILE: join(dir, 'db.sqlite') }
const boot = (...args) => spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', 'scripts/bootstrap.js', ...args], { env, encoding: 'utf8' })

const good = ['--id', 'demo', '--name', 'Demo Polytechnic', '--short', 'DEMO', '--domain', 'demo.edu.in', '--domain', 'students.demo.edu.in', '--admin-name', 'First Admin', '--admin-email', 'first@demo.edu.in']

describe('first-college bootstrap', () => {
  it('rejects a public mail domain, a mismatched admin email, and missing flags', () => {
    assert.notEqual(boot(...good.map((a) => (a === 'demo.edu.in' ? 'gmail.com' : a))).status, 0)
    assert.match(boot(...good.map((a) => (a === 'first@demo.edu.in' ? 'first@elsewhere.com' : a))).stderr, /must be on one of the college domains/)
    assert.match(boot('--id', 'demo').stderr, /Missing --name/)
  })

  it('creates the college and a superadmin who can set a password with the emailed code, then run the college', async () => {
    const r = boot(...good)
    assert.equal(r.status, 0, r.stderr)
    const code = r.stdout.match(/the code is (\d{6})/)?.[1]
    assert.ok(code, 'dev mode prints the code')
    assert.equal(boot(...good).status, 1, 'running it twice must not create a second admin')

    const port = 4600 + Math.floor(Math.random() * 90)
    const server = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/server.js'], { env: { ...env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] })
    try {
      await new Promise((resolve, reject) => { server.stdout.on('data', (d) => d.toString().includes('listening') && resolve()); setTimeout(() => reject(new Error('no start')), 15000) })
      const api = `http://127.0.0.1:${port}/api`
      const post = (path, body, token) => fetch(api + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: JSON.stringify(body) })

      assert.equal((await post('/auth/login', { email: 'first@demo.edu.in', password: 'anything-at-all' })).status, 401, 'no usable password until they set one')
      assert.equal((await post('/auth/reset', { email: 'first@demo.edu.in', code, password: 'My-new-pass-42' })).status, 204)
      const { token, user } = await (await post('/auth/login', { email: 'first@demo.edu.in', password: 'My-new-pass-42' })).json()
      assert.equal(user.adminRole, 'superadmin')
      assert.equal(user.university, 'demo')

      // …and they can immediately run the college: verification domains were set from the flags.
      const domains = await (await fetch(`${api}/admin/domains`, { headers: { Authorization: `Bearer ${token}` } })).json()
      assert.deepEqual(domains.domains, ['demo.edu.in', 'students.demo.edu.in'])
    } finally { server.kill('SIGTERM') }
  })
})
