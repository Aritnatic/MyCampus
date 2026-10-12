import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

const idOf = async (token, query) => (await call(`/discover/people?${query}`, { token })).body

describe('connections', () => {
  it('peer request → accept, visible to both sides; duplicates are refused', async () => {
    const aritra = await as('aritra')
    const priya = await as('priya')
    const target = (await idOf(aritra, 'scope=campus')).find((p) => p.item.name.startsWith('Priya')).item.id

    const sent = await call('/connections', { token: aritra, method: 'POST', body: { to: target, kind: 'peer', message: 'Hi!' } })
    assert.equal(sent.status, 201)
    assert.equal((await call('/connections', { token: aritra, method: 'POST', body: { to: target, kind: 'peer' } })).status, 409)

    const inbox = await call('/connections', { token: priya })
    assert.equal(inbox.body.incoming.length, 1)
    assert.equal(inbox.body.incoming[0].person.name, 'Aritra Das')
    assert.ok(!('email' in inbox.body.incoming[0].person))

    assert.equal((await call(`/connections/${sent.body.id}/accept`, { token: priya, method: 'POST' })).status, 200)
    assert.equal((await call('/connections', { token: aritra })).body.accepted.length, 1)
    // Only the recipient can answer, and only once.
    assert.equal((await call(`/connections/${sent.body.id}/accept`, { token: priya, method: 'POST' })).status, 409)
    assert.equal((await call(`/connections/${sent.body.id}/accept`, { token: aritra, method: 'POST' })).status, 404)
  })

  it('asking someone who already asked you connects you immediately', async () => {
    const aritra = await as('aritra')
    const vikram = await as('vikram')
    const aId = (await call('/me', { token: aritra })).body.id
    const vId = (await call('/me', { token: vikram })).body.id
    assert.equal((await call('/connections', { token: aritra, method: 'POST', body: { to: vId, kind: 'peer' } })).status, 201)
    const back = await call('/connections', { token: vikram, method: 'POST', body: { to: aId, kind: 'peer' } })
    assert.equal(back.body.status, 'accepted')
  })

  it('peers must share a campus, but mentors can be on any campus', async () => {
    const aritra = await as('aritra')
    const mentors = await idOf(aritra, 'scope=all&mentors=1')
    const abroad = mentors.find((m) => m.item.university !== 'cvrp')
    assert.ok(abroad, 'expected a mentor on another campus')
    assert.equal((await call('/connections', { token: aritra, method: 'POST', body: { to: abroad.item.id, kind: 'peer' } })).status, 403)
    assert.equal((await call('/connections', { token: aritra, method: 'POST', body: { to: abroad.item.id, kind: 'mentor', message: 'Could you guide me?' } })).status, 201)
  })

  it("you can't connect with someone you can't see", async () => {
    const aritra = await as('aritra')
    const rahul = (await call('/me', { token: await as('rahul') })).body
    assert.ok(rahul.year < 4)
    assert.equal((await call('/connections', { token: aritra, method: 'POST', body: { to: rahul.id, kind: 'peer' } })).status, 404)
    assert.equal((await call(`/discover/people/${rahul.id}`, { token: aritra })).status, 404)
  })
})

describe('projects & collaboration requests', () => {
  it('students create projects they own; validation and ownership are enforced', async () => {
    const priya = await as('priya')
    const bad = await call('/projects', { token: priya, method: 'POST', body: { title: 'Hi', description: 'too short' } })
    assert.equal(bad.status, 400)
    const badUrl = await call('/projects', { token: priya, method: 'POST', body: { title: 'Solar tracker', description: 'A tracker that follows the sun.', category: 'IoT', github: 'javascript:alert(1)' } })
    assert.equal(badUrl.status, 400)

    const ok = await call('/projects', { token: priya, method: 'POST', body: { title: 'Solar tracker', description: 'A tracker that follows the sun.', category: 'IoT', skills: ['C/C++', 'Arduino'], lookingFor: ['Python developer'], visibility: 'cross-university' } })
    assert.equal(ok.status, 201)
    assert.equal(ok.body.university, 'cvrp')
    assert.equal(ok.body.ownerId, (await call('/me', { token: priya })).body.id)

    assert.equal((await call(`/projects/${ok.body.id}`, { token: await as('aritra'), method: 'PUT', body: { title: 'Stolen!' } })).status, 404)
    assert.equal((await call(`/projects/${ok.body.id}`, { token: priya, method: 'PUT', body: { title: 'Solar tracker v2' } })).body.title, 'Solar tracker v2')
    // Unknown fields (e.g. trying to set ownerId) are rejected outright.
    assert.equal((await call(`/projects/${ok.body.id}`, { token: priya, method: 'PUT', body: { ownerId: 'someone-else' } })).status, 400)
  })

  it('individuals cannot create projects', async () => {
    const r = await call('/projects', { token: await as('individual'), method: 'POST', body: { title: 'My idea', description: 'Something interesting here.', category: 'Web' } })
    assert.equal(r.status, 403)
  })

  it('join request → owner accepts → requester joins the team (once)', async () => {
    const priya = await as('priya')
    const aritra = await as('aritra')
    const project = (await call('/projects', { token: priya, method: 'POST', body: { title: 'Campus bus tracker', description: 'Live bus locations for campus.', category: 'Mobile App', visibility: 'cross-university' } })).body

    const asked = await call('/collab', { token: aritra, method: 'POST', body: { targetKind: 'project', targetId: project.id, role: 'Backend', message: 'I can build the API.' } })
    assert.equal(asked.status, 201)
    assert.equal((await call('/collab', { token: aritra, method: 'POST', body: { targetKind: 'project', targetId: project.id, message: 'again' } })).status, 409)

    const inbox = await call('/collab', { token: priya })
    assert.equal(inbox.body.received.length, 1)
    assert.equal(inbox.body.received[0].from.name, 'Aritra Das')
    // Not the owner → can't decide.
    assert.equal((await call(`/collab/${asked.body.id}/accept`, { token: aritra, method: 'POST' })).status, 404)
    assert.equal((await call(`/collab/${asked.body.id}/accept`, { token: priya, method: 'POST' })).status, 200)

    const after = await call(`/discover/projects/${project.id}`, { token: aritra })
    assert.ok(after.body.team.includes('Aritra Das'))
    assert.equal(after.body.members, 2)
    assert.equal((await call('/collab', { token: aritra, method: 'POST', body: { targetKind: 'project', targetId: project.id, message: 'x' } })).status, 400) // already on the team
  })

  it("can't ask to join something you can't see", async () => {
    const campusOnly = (await call('/projects', { token: await as('priya'), method: 'POST', body: { title: 'Hostel Wi-Fi map', description: 'Map hostel Wi-Fi dead zones.', category: 'Networking', visibility: 'campus' } })).body
    const r = await call('/collab', { token: await as('rahul'), method: 'POST', body: { targetKind: 'project', targetId: campusOnly.id, message: 'let me in' } })
    assert.equal(r.status, 404)
  })

  it('interest in research listings reaches the admins who run research', async () => {
    const admin = await as('superadmin')
    const listing = (await call('/admin/research', { token: admin, method: 'POST', body: { title: 'Low-power sensor networks', supervisor: 'Dr. Anjali Mishra', description: 'Energy-efficient mesh networks.', status: 'recruiting', visibility: 'cross-university', requiredSkills: ['C/C++'], preferredSkills: [], tags: [] } })).body
    const aritra = await as('aritra')
    const asked = await call('/collab', { token: aritra, method: 'POST', body: { targetKind: 'research', targetId: listing.id, message: 'I would like to help.' } })
    assert.equal(asked.status, 201)

    const inbox = await call('/admin/collab', { token: admin })
    assert.ok(inbox.body.some((r) => r.id === asked.body.id && r.from.name === 'Aritra Das'))
    // Admins without research permission can't see or answer it.
    assert.equal((await call('/admin/collab', { token: await as('moderator') })).status, 403)
    assert.equal((await call(`/admin/collab/${asked.body.id}/accept`, { token: admin, method: 'POST' })).status, 200)
    assert.match((await call('/notifications', { token: aritra })).body.items[0].title, /accepted/)
  })
})
