import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

const meOf = async (who) => (await call('/me', { token: await as(who) })).body
const proposal = { title: 'Crop disease detection from leaf photos', description: 'Use phone photos and a small model to spot common paddy leaf diseases early for local farmers.', department: 'Agriculture', requiredSkills: ['Python', 'Computer Vision'], positions: 3 }

describe('research proposals', () => {
  it('a student proposes; it stays hidden until an admin approves; then the student runs it', async () => {
    const aritra = await as('aritra')
    const made = await call('/research/proposals', { token: aritra, method: 'POST', body: proposal })
    assert.equal(made.status, 201, JSON.stringify(made.body))
    assert.equal(made.body.status, 'proposed')
    const id = made.body.id

    // Only the proposer sees it while it waits; admins who run research are told.
    assert.equal((await call(`/discover/research/${id}`, { token: aritra })).status, 200)
    assert.equal((await call(`/discover/research/${id}`, { token: await as('priya') })).status, 404)
    const admin = await as('superadmin')
    assert.ok((await call('/notifications', { token: admin })).body.items.some((n) => n.type === 'research_proposal'))
    assert.ok((await call('/admin/research', { token: admin })).body.some((r) => r.id === id && r.status === 'proposed'))

    // Proposer can't invite yet; an admin without research permission can't approve.
    const priya = await meOf('priya')
    assert.equal((await call('/invites', { token: aritra, method: 'POST', body: { targetKind: 'research', targetId: id, to: priya.id } })).status, 404)
    assert.equal((await call(`/admin/research/${id}/approve`, { token: await as('examAdmin'), method: 'POST', body: {} })).status, 403)

    const ok = await call(`/admin/research/${id}/approve`, { token: admin, method: 'POST', body: { supervisor: 'Dr. Rao' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.status, 'recruiting')
    assert.ok((await call('/notifications', { token: aritra })).body.items.some((n) => n.type === 'research_approved'))
    assert.equal((await call(`/discover/research/${id}`, { token: await as('priya') })).status, 200)

    // Now the student runs it: invites work, and a join request reaches them and they can accept it.
    assert.equal((await call('/invites', { token: aritra, method: 'POST', body: { targetKind: 'research', targetId: id, to: priya.id } })).status, 201)
    const vikram = await as('vikram')
    const ask = await call('/collab', { token: vikram, method: 'POST', body: { targetKind: 'research', targetId: id, message: 'I can help with the model.' } })
    assert.equal(ask.status, 201)
    const received = (await call('/collab', { token: aritra })).body.received
    assert.ok(received.some((r) => r.id === ask.body.id))
    assert.equal((await call(`/collab/${ask.body.id}/accept`, { token: aritra, method: 'POST' })).status, 200)
  })

  it('a rejection reaches the student with the reason, and the proposal stays private', async () => {
    const t = await as('vikram')
    const made = (await call('/research/proposals', { token: t, method: 'POST', body: { ...proposal, title: 'Something too vague to approve yet' } })).body
    const admin = await as('superadmin')
    assert.equal((await call(`/admin/research/${made.id}/reject`, { token: admin, method: 'POST', body: { reason: 'Find a faculty supervisor first.' } })).status, 200)
    const seen = (await call(`/discover/research/${made.id}`, { token: t })).body
    assert.equal(seen.status, 'rejected')
    assert.equal(seen.rejectReason, 'Find a faculty supervisor first.')
    assert.equal((await call(`/discover/research/${made.id}`, { token: await as('aritra') })).status, 404)
    assert.equal((await call(`/admin/research/${made.id}/approve`, { token: admin, method: 'POST', body: {} })).status, 409)
  })

  it('individuals cannot propose; short proposals are refused', async () => {
    assert.equal((await call('/research/proposals', { token: await as('individual'), method: 'POST', body: proposal })).status, 403)
    assert.equal((await call('/research/proposals', { token: await as('priya'), method: 'POST', body: { title: 'Hi', description: 'short' } })).status, 400)
  })
})

describe('startups', () => {
  it('a student posts a startup directly and owns it', async () => {
    const t = await as('priya')
    const s = await call('/startups', { token: t, method: 'POST', body: { name: 'KrishiBot', tagline: 'Advice for farmers on WhatsApp', description: 'A WhatsApp bot that answers crop questions in Odia.', sector: 'Agritech', stage: 'idea', skills: ['Python'] } })
    assert.equal(s.status, 201, JSON.stringify(s.body))
    assert.equal(s.body.ownerId, (await meOf('priya')).id)
    assert.equal((await call(`/discover/startups/${s.body.id}`, { token: await as('aritra') })).status, 200)
  })
})
