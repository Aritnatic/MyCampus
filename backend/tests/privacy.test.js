import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNTS, as, call, login, stop } from './helpers.js'

after(stop)

describe('data export', () => {
  it('gives people everything held about them — and nothing about anyone else', async () => {
    const aritra = await as('aritra')
    const priya = await as('priya')
    const priyaId = (await call('/me', { token: priya })).body.id
    await call('/connections', { token: aritra, method: 'POST', body: { to: priyaId, kind: 'peer', message: 'hello there' } })
    const note = (await call('/notes', { token: aritra, method: 'POST', body: { title: 'My OS notes', subject: 'CSE-302' } })).body

    const r = await call('/me/export', { token: aritra })
    assert.equal(r.status, 200)
    assert.match(r.headers.get('content-disposition'), /attachment/)
    assert.equal(r.body.account.email, ACCOUNTS.aritra)
    assert.ok(r.body.notes.some((n) => n.id === note.id))
    assert.ok(r.body.connections.some((c) => c.message === 'hello there'))
    const text = JSON.stringify(r.body)
    assert.ok(!text.includes('scrypt$'), 'no password hash')
    assert.ok(!text.includes(ACCOUNTS.priya), "nobody else's email")
  })
})

describe('account deletion', () => {
  it('needs the password, and refuses admins', async () => {
    const rahul = await as('rahul')
    assert.equal((await call('/me', { token: rahul, method: 'DELETE', body: { password: 'wrong-wrong-1' } })).status, 400)
    assert.equal((await call('/me', { token: rahul, method: 'DELETE', body: {} })).status, 400)
    assert.equal((await call('/me', { token: await as('moderator'), method: 'DELETE', body: { password: 'campus123' } })).status, 403)
    assert.equal((await call('/me', { token: rahul })).status, 200, 'a refused deletion leaves the account intact')
  })

  it('removes the person and their notes, hands shared projects to the next member, and signs them out', async () => {
    const vikram = await as('vikram')
    const priya = await as('priya')
    const vikramId = (await call('/me', { token: vikram })).body.id
    const priyaId = (await call('/me', { token: priya })).body.id

    const solo = (await call('/projects', { token: vikram, method: 'POST', body: { title: 'Solo idea', description: 'Only I work on this one.', category: 'Other' } })).body
    const shared = (await call('/projects', { token: vikram, method: 'POST', body: { title: 'Team project', description: 'Vikram starts, Priya joins.', category: 'Web App', visibility: 'cross-university' } })).body
    const ask = await call('/collab', { token: priya, method: 'POST', body: { targetKind: 'project', targetId: shared.id, message: 'Let me in' } })
    await call(`/collab/${ask.body.id}/accept`, { token: vikram, method: 'POST' })
    const note = (await call('/notes', { token: vikram, method: 'POST', body: { title: 'Soon gone', subject: 'CE-301' } })).body
    await call('/connections', { token: vikram, method: 'POST', body: { to: priyaId, kind: 'peer' } })

    const gone = await call('/me', { token: vikram, method: 'DELETE', body: { password: 'campus123' } })
    assert.equal(gone.status, 204)

    assert.equal((await call('/me', { token: vikram })).status, 401, 'their sessions end')
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: ACCOUNTS.vikram, password: 'campus123' } })).status, 401)
    assert.equal((await call(`/content/notes/${note.id}`, { token: priya })).status, 404, 'their notes are removed')
    assert.equal((await call(`/discover/projects/${solo.id}`, { token: priya })).status, 404, 'a project only they worked on is removed')

    const kept = (await call(`/discover/projects/${shared.id}`, { token: priya })).body
    assert.deepEqual(kept.teamIds, [priyaId], 'a shared project survives with the remaining member')
    assert.equal(kept.ownerId, priyaId, 'and passes to them')
    assert.ok(!kept.team.includes('Vikram Singh'))

    // Nothing may still point at the deleted account: not connections, join requests, notifications or sessions.
    const { db } = await import('../src/db.js')
    for (const [table, col] of [['connections', 'from_id'], ['connections', 'to_id'], ['collab_requests', 'from_id'], ['notifications', 'user_id'], ['registrations', 'user_id'], ['push_tokens', 'user_id']]) {
      assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${col} = ?`).get(vikramId).n, 0, `${table}.${col} still references the deleted user`)
    }
    assert.ok(!JSON.stringify((await call('/search?q=Vikram', { token: priya })).body).includes(vikramId))
  })
})

describe('legal pages', () => {
  it('serves the privacy policy and terms without sign-in, flagged as drafts', async () => {
    const { base } = await import('./helpers.js')
    for (const page of ['privacy', 'terms']) {
      const res = await fetch(`${base.replace(/\/api$/, '')}/legal/${page}`)
      assert.equal(res.status, 200)
      assert.match(res.headers.get('content-type'), /text\/html/)
      assert.match(await res.text(), /Draft for review/)
    }
    assert.equal((await fetch(`${base.replace(/\/api$/, '')}/legal/secrets`)).status, 404)
  })
})
