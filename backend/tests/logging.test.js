import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'

process.env.LOG_REQUESTS = '1' // must be set before the app (and its config) loads
const { ACCOUNTS, as, base, call, login, stop } = await import('./helpers.js')
const { output } = await import('../src/logger.js')

after(stop)

// Runs `fn` and returns the request log lines written meanwhile.
async function captured(fn) {
  const lines = []
  const original = output.write
  output.write = (level, line) => lines.push(JSON.parse(line))
  try { await fn() } finally { output.write = original }
  return lines.filter((l) => l.msg === 'request')
}

describe('request logging', () => {
  it('logs one structured line per request, with the user, and no secrets', async () => {
    await login(ACCOUNTS.aritra)
    const token = await as('aritra')
    const logs = await captured(async () => {
      await call('/me?ticket=SECRET-TICKET', { token })
      await call('/auth/login', { method: 'POST', body: { email: ACCOUNTS.aritra, password: 'wrong-password-123' } })
    })
    const me = logs.find((l) => l.path === '/api/me')
    assert.ok(me, 'request logged')
    assert.equal(me.status, 200)
    assert.equal(me.method, 'GET')
    assert.ok(me.user && me.id && me.ms >= 0)
    const text = JSON.stringify(logs)
    assert.ok(!text.includes('SECRET-TICKET'), 'query string never logged')
    assert.ok(!text.includes('wrong-password-123') && !text.includes(token), 'no passwords or tokens')
    assert.equal(logs.find((l) => l.path === '/api/auth/login').status, 401)
  })

  it('returns an X-Request-Id and skips /health', async () => {
    const logs = await captured(async () => {
      const r = await fetch(new URL('/health', base.replace('/api', '')))
      assert.ok(r.headers.get('x-request-id'))
    })
    assert.equal(logs.length, 0)
  })
})
