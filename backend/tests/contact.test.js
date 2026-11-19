import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

const meOf = async (who) => (await call('/me', { token: await as(who) })).body

describe('contact details', () => {
  it('saves social handles without wiping the others, and rejects bad input', async () => {
    const t = await as('vikram')
    assert.equal((await call('/me', { token: t, method: 'PATCH', body: { socials: { instagram: '@vikram.builds' } } })).status, 200)
    const me = await meOf('vikram')
    assert.equal(me.socials.instagram, 'vikram.builds') // leading @ dropped
    assert.equal(me.socials.linkedin, 'vikramsingh') // seeded value kept
    assert.equal((await call('/me', { token: t, method: 'PATCH', body: { socials: { instagram: 'has space' } } })).status, 400)
    assert.equal((await call('/me', { token: t, method: 'PATCH', body: { socials: { website: 'javascript:alert(1)' } } })).status, 400)
    assert.equal((await call('/me', { token: t, method: 'PATCH', body: { contact: { phone: 'call me' } } })).status, 400)
  })

  it('shows a phone number only to accepted connections, and only when the owner shares it', async () => {
    const aritra = await as('aritra'), priya = await as('priya'), vikram = await as('vikram')
    await call('/me', { token: priya, method: 'PATCH', body: { contact: { phone: '+91 98765 43210', whatsapp: true, showPhone: true } } })
    const priyaId = (await meOf('priya')).id

    // Not connected yet: no number, just a hint that connecting would show one; never on cards or in discovery.
    const before = (await call(`/discover/people/${priyaId}`, { token: vikram })).body
    assert.equal(before.contact.phone, undefined)
    assert.equal(before.contact.hiddenUntilConnected, true)
    const list = (await call('/discover/people?scope=campus', { token: vikram })).body
    assert.ok(!JSON.stringify(list).includes('98765'))

    // Connect Vikram → Priya, Priya accepts: now Vikram sees it (and WhatsApp), Aritra still doesn't.
    const req = await call('/connections', { token: vikram, method: 'POST', body: { to: priyaId, kind: 'peer' } })
    assert.ok([200, 201].includes(req.status), JSON.stringify(req.body))
    assert.equal((await call(`/connections/${req.body.id}/accept`, { token: priya, method: 'POST' })).status, 200)
    const after = (await call(`/discover/people/${priyaId}`, { token: vikram })).body
    assert.equal(after.contact.phone, '+91 98765 43210')
    assert.equal(after.contact.whatsapp, true)
    assert.equal((await call(`/discover/people/${priyaId}`, { token: aritra })).body.contact.phone, undefined)
    const conns = (await call('/connections', { token: vikram })).body
    assert.ok(JSON.stringify(conns).includes('+91 98765 43210'))

    // Turning sharing off hides it again, even from connections.
    await call('/me', { token: priya, method: 'PATCH', body: { contact: { showPhone: false } } })
    assert.equal((await call(`/discover/people/${priyaId}`, { token: vikram })).body.contact.phone, undefined)
  })
})

describe('deleting a student (admin)', () => {
  it('only for admins who manage students, only in their college, and it is permanent', async () => {
    const reg = await call('/auth/register', { method: 'POST', body: { email: 'to.delete@students.cvrp.edu.in', password: 'Delete-me-pass9', name: 'To Delete' } })
    const v = await call('/auth/verify', { method: 'POST', body: { email: 'to.delete@students.cvrp.edu.in', code: reg.body.devCode } })
    const id = v.body.user.id
    assert.equal((await call(`/admin/students/${id}`, { token: await as('examAdmin'), method: 'DELETE' })).status, 403)
    const rahulId = (await meOf('rahul')).id // KIIT
    assert.equal((await call(`/admin/students/${rahulId}`, { token: await as('superadmin'), method: 'DELETE' })).status, 404)

    assert.equal((await call(`/admin/students/${id}`, { token: await as('superadmin'), method: 'DELETE' })).status, 204)
    assert.equal((await call('/me', { token: v.body.token })).status, 401)
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'to.delete@students.cvrp.edu.in', password: 'Delete-me-pass9' } })).status, 401)
  })
})

describe('profile numbers', () => {
  it('counts the projects someone is really on', async () => {
    const t = await as('aritra')
    const vikram = await meOf('vikram')
    const before = (await call(`/discover/people/${vikram.id}`, { token: t })).body.projects
    await call('/projects', { token: await as('vikram'), method: 'POST', body: { title: 'Counted Project', description: 'Exists only to be counted.', category: 'Other' } })
    assert.equal((await call(`/discover/people/${vikram.id}`, { token: t })).body.projects, before + 1)
  })
})
