import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('graceful shutdown', () => {
  it('exits promptly even while a phone holds a live-alert stream open', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mycampus-shutdown-'))
    const port = 4100 + Math.floor(Math.random() * 800)
    const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/server.js'], {
      env: { ...process.env, PORT: String(port), DATA_DIR: dir, DB_FILE: join(dir, 'db.sqlite'), NODE_ENV: 'test', MAIL_PROVIDER: 'console' },
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })))
    await new Promise((resolve, reject) => {
      child.stdout.on('data', (d) => d.toString().includes('listening') && resolve())
      setTimeout(() => reject(new Error('server did not start')), 15000)
    })

    const api = `http://127.0.0.1:${port}/api`
    const { token } = await (await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'aritra.das@students.cvrp.edu.in', password: 'campus123' }) })).json()
    const { ticket } = await (await fetch(`${api}/stream/ticket`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })).json()
    const stream = await fetch(`${api}/stream?ticket=${ticket}`)
    assert.equal(stream.status, 200)
    stream.body.getReader().read().catch(() => {}) // keep it open, ignore the abort error at shutdown

    const started = Date.now()
    child.kill('SIGTERM')
    const result = await Promise.race([exited, new Promise((r) => setTimeout(() => r('timeout'), 8000))])
    if (result === 'timeout') child.kill('SIGKILL')
    assert.notEqual(result, 'timeout', 'server hung on shutdown')
    assert.ok(Date.now() - started < 6000, 'shutdown should finish within the grace period')
  })
})
