import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// A stand-in for the built admin panel. Must exist before the app (and its config) loads.
const dir = mkdtempSync(join(tmpdir(), 'mycampus-admin-'))
mkdirSync(join(dir, 'assets'))
writeFileSync(join(dir, 'index.html'), '<!doctype html><title>MyCampus Admin</title>')
writeFileSync(join(dir, 'assets', 'app.js'), 'console.log("admin")')
process.env.ADMIN_DIR = dir
const { as, base, call, stop } = await import('./helpers.js')

after(stop)
const site = base.replace('/api', '')

describe('serving the admin panel from the API', () => {
  it('serves the panel at / and on deep links, so a refresh on /admin/students works', async () => {
    for (const path of ['/', '/admin/students', '/admin/feedback']) {
      const r = await fetch(site + path)
      assert.equal(r.status, 200, path)
      assert.match(await r.text(), /MyCampus Admin/)
    }
  })

  it('serves built assets as files', async () => {
    const r = await fetch(`${site}/assets/app.js`)
    assert.equal(r.status, 200)
    assert.match(await r.text(), /console\.log/)
  })

  it('never lets the panel shadow the API, health check or legal pages', async () => {
    const missing = await call('/nope', { token: await as('aritra') })
    assert.equal(missing.status, 404)
    assert.equal(missing.body.error, 'Not found.') // JSON from the API, not the panel's HTML
    assert.equal((await call('/me')).status, 401)
    assert.deepEqual(await (await fetch(`${site}/health`)).json(), { ok: true })
    assert.match(await (await fetch(`${site}/legal/privacy`)).text(), /Privacy/i)
  })
})
