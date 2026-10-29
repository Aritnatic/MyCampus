import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

const ask = (token, id, body = { topic: 'Final-year ML project' }) => call(`/faculty/${id}/guidance`, { token, method: 'POST', body })

describe('faculty guidance requests', () => {
  it('a student asks a teacher; duplicates are refused; the student can list and withdraw', async () => {
    const aritra = await as('aritra')
    const sent = await ask(aritra, 'fac-001', { topic: 'Final-year ML project', message: 'I want to build a notice classifier.' })
    assert.equal(sent.status, 201)
    assert.equal((await ask(aritra, 'fac-001')).status, 409)

    const mine = await call('/me/guidance', { token: aritra })
    assert.equal(mine.body.length, 1)
    assert.equal(mine.body[0].faculty.name, 'Dr. Anjali Mishra')
    assert.equal(mine.body[0].status, 'pending')

    assert.equal((await call(`/guidance/${sent.body.id}/withdraw`, { token: aritra, method: 'POST' })).status, 200)
    assert.equal((await call(`/guidance/${sent.body.id}/withdraw`, { token: aritra, method: 'POST' })).status, 404)
    // Withdrawn requests free the slot: they can ask again.
    assert.equal((await ask(aritra, 'fac-001')).status, 201)
  })

  it('validates the topic, hides other campuses and caps open requests', async () => {
    const priya = await as('priya')
    assert.equal((await ask(priya, 'fac-001', { topic: 'x' })).status, 400)
    assert.equal((await ask(priya, 'fac-005')).status, 404) // KIIT teacher, CVRP student
    assert.equal((await ask(priya, 'nope')).status, 404)
    for (const id of ['fac-001', 'fac-002', 'fac-003']) assert.equal((await ask(priya, id)).status, 201)
    assert.equal((await ask(priya, 'fac-004')).status, 429)
  })

  it('only students can ask', async () => {
    const individual = await as('individual')
    assert.equal((await ask(individual, 'fac-001')).status, 403)
  })

  it('an admin with the faculty permission records the answer and the student is told', async () => {
    const vikram = await as('vikram')
    const sent = await ask(vikram, 'fac-002', { topic: 'IoT capstone' })
    const admin = await as('superadmin')

    const list = await call('/admin/guidance?status=pending', { token: admin })
    assert.equal(list.status, 200)
    const row = list.body.find((r) => r.id === sent.body.id)
    assert.equal(row.from.name, 'Vikram Singh')
    assert.equal(row.faculty.id, 'fac-002')

    // Students and admins without the faculty permission are refused.
    assert.equal((await call('/admin/guidance', { token: vikram })).status, 403)
    assert.equal((await call('/admin/guidance', { token: await as('moderator') })).status, 403)
    assert.equal((await call(`/admin/guidance/${sent.body.id}/decide`, { token: vikram, method: 'POST', body: { status: 'accepted' } })).status, 403)

    const decided = await call(`/admin/guidance/${sent.body.id}/decide`, { token: admin, method: 'POST', body: { status: 'accepted', note: 'Come by Tuesday 3 PM.' } })
    assert.equal(decided.status, 200)
    assert.equal((await call(`/admin/guidance/${sent.body.id}/decide`, { token: admin, method: 'POST', body: { status: 'declined' } })).status, 409)

    const mine = await call('/me/guidance', { token: vikram })
    assert.equal(mine.body.find((r) => r.id === sent.body.id).status, 'accepted')
    const inbox = await call('/notifications', { token: vikram })
    assert.ok(inbox.body.items.some((n) => n.type === 'guidance_accepted' && n.body === 'Come by Tuesday 3 PM.'))
  })

  it('/matches suggests campus teachers whose research overlaps your skills', async () => {
    const aritra = await as('aritra')
    const { body } = await call('/matches', { token: aritra })
    assert.ok(Array.isArray(body.faculty))
    for (const m of body.faculty) {
      assert.equal(m.item.university, 'cvrp')
      assert.ok(m.score > 0 && m.reasons.length > 0)
      assert.match(m.reasons[0], /^Researches .+ — you list /)
    }
  })
})
