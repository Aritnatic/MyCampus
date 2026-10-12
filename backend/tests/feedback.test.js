import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNTS, as, call, stop } from './helpers.js'

after(stop)

describe('feedback', () => {
  it('a student sends feedback and an admin of their campus can triage it', async () => {
    const aritra = await as('aritra')
    const sent = await call('/feedback', { token: aritra, method: 'POST', body: { category: 'bug', message: 'Map route crashes on iPhone SE', screen: 'campus/map', appVersion: '0.1.0' } })
    assert.equal(sent.status, 201)

    const admin = await as('moderator')
    const list = await call('/admin/feedback', { token: admin })
    assert.equal(list.status, 200)
    const item = list.body.find((f) => f.id === sent.body.id)
    assert.equal(item.message, 'Map route crashes on iPhone SE')
    assert.equal(item.from.email, ACCOUNTS.aritra)
    assert.equal(item.status, 'new')

    const done = await call(`/admin/feedback/${item.id}`, { token: admin, method: 'PATCH', body: { status: 'done' } })
    assert.equal(done.status, 200)
    assert.equal((await call('/admin/feedback?status=new', { token: admin })).body.some((f) => f.id === item.id), false)
    assert.equal((await call('/admin/feedback?status=done', { token: admin })).body.some((f) => f.id === item.id), true)
  })

  it('validates input and rate-limits per person', async () => {
    const priya = await as('priya')
    assert.equal((await call('/feedback', { token: priya, method: 'POST', body: { category: 'bug', message: 'hi' } })).status, 400)
    assert.equal((await call('/feedback', { token: priya, method: 'POST', body: { category: 'rant', message: 'long enough message' } })).status, 400)
    for (let i = 0; i < 10; i++) assert.equal((await call('/feedback', { token: priya, method: 'POST', body: { category: 'idea', message: `idea number ${i}` } })).status, 201)
    assert.equal((await call('/feedback', { token: priya, method: 'POST', body: { category: 'idea', message: 'one too many' } })).status, 429)
  })

  it('students cannot read feedback and anonymous callers cannot send it', async () => {
    assert.equal((await call('/admin/feedback', { token: await as('aritra') })).status, 403)
    assert.equal((await call('/feedback', { method: 'POST', body: { category: 'bug', message: 'no token here' } })).status, 401)
  })

  it('is included in the data export', async () => {
    const vikram = await as('vikram')
    await call('/feedback', { token: vikram, method: 'POST', body: { category: 'other', message: 'Love the new notes tab' } })
    const exp = await call('/me/export', { token: vikram })
    assert.ok(exp.body.feedback.some((f) => f.message === 'Love the new notes tab'))
  })
})
