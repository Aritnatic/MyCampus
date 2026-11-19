import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'
import { hasEnded } from '../src/views.js'

after(stop)

const day = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)

describe('deadlines and expiry', () => {
  it('a date-only deadline lasts through that whole day', () => {
    assert.equal(hasEnded(day(-1)), true)
    assert.equal(hasEnded(day(1)), false)
    assert.equal(hasEnded(null), false)
    assert.equal(hasEnded(new Date(Date.now() - 60_000).toISOString()), true) // a timestamp ends at that moment
  })

  it('jobs past their deadline are marked closed and are not suggested on career paths', async () => {
    const admin = await as('moderator')
    const late = await call('/admin/jobs', { token: admin, method: 'POST', body: { title: 'Expired Test Role', company: 'Late Corp', deadline: day(-3), status: 'open', skills: ['Python'] } })
    const fresh = await call('/admin/jobs', { token: admin, method: 'POST', body: { title: 'Fresh Test Role', company: 'Early Corp', deadline: day(5), status: 'open', skills: ['Python'] } })
    const jobs = (await call('/content/jobs', { token: await as('aritra') })).body
    const l = jobs.find((j) => j.id === late.body.id), f = jobs.find((j) => j.id === fresh.body.id)
    assert.equal(l.expired, true); assert.equal(l.acceptingApplications, false)
    assert.equal(f.expired, false); assert.equal(f.acceptingApplications, true)

    const paths = (await call('/career/paths', { token: await as('aritra') })).body
    for (const p of paths) {
      const detail = (await call(`/career/paths/${p.id}`, { token: await as('aritra') })).body
      assert.ok(!detail.jobs.some((x) => (x.job ?? x).id === late.body.id), 'expired job suggested on a career path')
    }
    await call(`/admin/jobs/${late.body.id}`, { token: admin, method: 'DELETE' })
    await call(`/admin/jobs/${fresh.body.id}`, { token: admin, method: 'DELETE' })
  })

  it('notices past their expiry are marked expired (still readable under Older)', async () => {
    const admin = await as('moderator')
    const n = await call('/admin/notices', { token: admin, method: 'POST', body: { title: 'Old notice', body: 'x', category: 'general', expiresAt: day(-2) } })
    const seen = (await call('/content/notices', { token: await as('aritra') })).body.find((x) => x.id === n.body.id)
    assert.equal(seen.expired, true)
    await call(`/admin/notices/${n.body.id}`, { token: admin, method: 'DELETE' })
  })
})
