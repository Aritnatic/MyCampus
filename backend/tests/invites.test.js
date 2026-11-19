import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

const meOf = async (who) => (await call('/me', { token: await as(who) })).body

describe('invites', () => {
  it('the owner invites a student (by id or MyCampus ID); accepting adds them to the team and tells the owner', async () => {
    const owner = await as('vikram')
    const project = (await call('/projects', { token: owner, method: 'POST', body: { title: 'Solar Bench Monitor', description: 'Monitor campus solar benches with sensors.', category: 'IoT' } })).body
    const priya = await meOf('priya')

    const inv = await call('/invites', { token: owner, method: 'POST', body: { targetKind: 'project', targetId: project.id, to: priya.publicId, role: 'Firmware', message: 'Want to build this with me?' } })
    assert.equal(inv.status, 201, JSON.stringify(inv.body))
    assert.equal(inv.body.to.id, priya.id)
    assert.equal((await call('/invites', { token: owner, method: 'POST', body: { targetKind: 'project', targetId: project.id, to: priya.id } })).status, 409) // once

    const pToken = await as('priya')
    const mine = (await call('/invites', { token: pToken })).body.received
    assert.ok(mine.some((r) => r.id === inv.body.id && r.target.title === 'Solar Bench Monitor'))
    assert.ok((await call('/notifications', { token: pToken })).body.items.some((n) => n.type === 'invite'))

    assert.equal((await call(`/invites/${inv.body.id}/accept`, { token: pToken, method: 'POST' })).status, 200)
    const after = (await call(`/discover/projects/${project.id}`, { token: owner })).body
    assert.ok(after.teamIds.includes(priya.id))
    assert.ok((await call('/notifications', { token: owner })).body.items.some((n) => n.type === 'invite_accepted'))
    assert.equal((await call(`/invites/${inv.body.id}/accept`, { token: pToken, method: 'POST' })).status, 409)

    // Already on the team now.
    assert.equal((await call('/invites', { token: owner, method: 'POST', body: { targetKind: 'project', targetId: project.id, to: priya.id } })).status, 409)
  })

  it('only the owner can invite; invites can be declined or cancelled; unknown people are not found', async () => {
    const owner = await as('aritra')
    const project = (await call('/projects', { token: owner, method: 'POST', body: { title: 'Canteen Queue App', description: 'Order ahead at the canteen.', category: 'Web App' } })).body
    const vikram = await meOf('vikram')
    assert.equal((await call('/invites', { token: await as('priya'), method: 'POST', body: { targetKind: 'project', targetId: project.id, to: vikram.id } })).status, 404)
    assert.equal((await call('/invites', { token: owner, method: 'POST', body: { targetKind: 'project', targetId: project.id, to: 'MC-0000-0000' } })).status, 404)

    const a = (await call('/invites', { token: owner, method: 'POST', body: { targetKind: 'project', targetId: project.id, to: vikram.id } })).body
    assert.equal((await call(`/invites/${a.id}/accept`, { token: await as('priya'), method: 'POST' })).status, 404) // not theirs
    assert.equal((await call(`/invites/${a.id}/decline`, { token: await as('vikram'), method: 'POST' })).status, 200)

    const b = (await call('/invites', { token: owner, method: 'POST', body: { targetKind: 'project', targetId: project.id, to: vikram.id } })).body
    assert.equal((await call(`/invites/${b.id}/cancel`, { token: owner, method: 'POST' })).status, 200)
    assert.equal((await call(`/invites/${b.id}/accept`, { token: await as('vikram'), method: 'POST' })).status, 409)
    assert.equal((await call(`/invites/for/project/${project.id}`, { token: owner })).body.length, 2)
  })

  it('admins who manage research invite students to research listings', async () => {
    const admin = await as('superadmin')
    const research = (await call('/admin/research', { token: admin, method: 'POST', body: { title: 'Soil Moisture Mapping', supervisor: 'Dr. Rao', description: 'Mapping soil moisture across farms.' } })).body
    const aritra = await meOf('aritra')
    const inv = await call('/invites', { token: admin, method: 'POST', body: { targetKind: 'research', targetId: research.id, to: aritra.id } })
    assert.equal(inv.status, 201, JSON.stringify(inv.body))
    assert.equal(inv.body.from.admin, true)
    assert.equal((await call('/invites', { token: await as('moderator'), method: 'POST', body: { targetKind: 'research', targetId: research.id, to: aritra.id } })).status, 404) // no research permission
  })
})

describe('students directory', () => {
  it('lists every verified student at your college A–Z, with search, filters and paging; not for individuals', async () => {
    const t = await as('aritra')
    const all = (await call('/directory/students?limit=100', { token: t })).body
    assert.ok(all.total >= 3)
    const names = all.items.map((s) => s.name)
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)))
    assert.ok(all.items.every((s) => s.university === 'cvrp'))
    assert.ok(all.items.some((s) => s.isMe))
    assert.ok(!JSON.stringify(all).includes('rollNumber'))

    const page = (await call('/directory/students?limit=1&page=2', { token: t })).body
    assert.equal(page.items.length, 1)
    assert.equal(page.items[0].name, names[1])
    const cse = (await call('/directory/students?branch=CSE', { token: t })).body
    assert.ok(cse.items.length >= 1)
    assert.ok((await call('/directory/students?q=aritra', { token: t })).body.items.some((s) => s.isMe))
    assert.equal((await call('/directory/students', { token: await as('individual') })).status, 403)
  })
})
