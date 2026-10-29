import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

describe('matches are cached per person but never stale', () => {
  it('serves the same answer until something changes', async () => {
    const token = await as('aritra')
    const a = await call('/matches', { token })
    const b = await call('/matches', { token })
    assert.equal(a.status, 200)
    assert.deepEqual(a.body, b.body)
  })

  it("editing your own profile changes your suggestions straight away", async () => {
    const token = await as('vikram')
    const before = await call('/matches', { token })
    const reasons = (m) => JSON.stringify(m.body)
    assert.ok(!reasons(before).includes('Researches Machine Learning'))

    const edit = await call('/me', { token, method: 'PATCH', body: { skills: ['Machine Learning', 'Python'] } })
    assert.equal(edit.status, 200)
    const after = await call('/matches', { token })
    assert.ok(reasons(after).includes('Researches Machine Learning'), 'a teacher who researches ML should now be suggested')
  })

  it("someone else's profile edit is picked up by the next request", async () => {
    const aritra = await as('aritra')
    const priya = await as('priya')
    await call('/matches', { token: aritra }) // warm the cache
    await call('/me', { token: priya, method: 'PATCH', body: { lookingFor: ['Rust systems programmer'] } })
    await call('/me', { token: aritra, method: 'PATCH', body: { skills: ['Rust'] } })
    const { body } = await call('/matches', { token: aritra })
    assert.ok(body.people.some((m) => m.reasons.some((r) => r.includes('Rust systems programmer'))), 'Priya now wants a Rust developer and Aritra lists Rust')
  })

  it('lists are capped so a big campus is never sent in full', async () => {
    const { body } = await call('/discover/people?scope=all', { token: await as('aritra') })
    assert.ok(body.length <= 100)
  })
})
