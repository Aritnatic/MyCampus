import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

// Signs up with a personal (non-college) email, confirms it, and returns the session token.
async function signUpIndividual(email, name = 'Riya Patnaik') {
  const reg = await call('/auth/register', { method: 'POST', body: { email, password: 'Join-test-pass9', name } })
  assert.equal(reg.status, 202)
  const verified = await call('/auth/verify', { method: 'POST', body: { email, code: reg.body.devCode } })
  assert.equal(verified.status, 200)
  return verified.body.token
}

const request = { university: 'cvrp', rollNumber: 'CVRP-2201', branch: 'Computer Science & Engineering', year: 2, semester: 3 }

describe('joining a college without a college email', () => {
  it('a personal-email account asks to join, an admin approves, and it becomes a verified student at once', async () => {
    const token = await signUpIndividual('riya.join@gmail.com')
    assert.equal((await call('/me', { token })).body.role, 'individual')
    assert.equal((await call('/content/notices', { token })).body.length, 0) // campus-only content stays hidden

    const colleges = await call('/join/colleges', { token })
    assert.ok(colleges.body.some((c) => c.id === 'cvrp'))

    const made = await call('/me/join-request', { token, method: 'POST', body: request })
    assert.equal(made.status, 201)
    assert.equal(made.body.status, 'pending')
    assert.equal((await call('/me/join-request', { token, method: 'POST', body: request })).status, 409) // one at a time

    // The admins who manage students are told.
    const admin = await as('superadmin')
    const inbox = await call('/notifications', { token: admin })
    assert.ok((inbox.body.items ?? inbox.body).some((n) => n.type === 'join_request'))

    const list = await call('/admin/join-requests', { token: admin })
    const mine = list.body.find((r) => r.id === made.body.id)
    assert.equal(mine.rollNumber, 'CVRP-2201')
    assert.equal(mine.email, 'riya.join@gmail.com')

    assert.equal((await call(`/admin/join-requests/${made.body.id}/approve`, { token: admin, method: 'POST' })).status, 200)
    const me = (await call('/me', { token })).body // same token: no new sign-in needed
    assert.equal(me.role, 'student')
    assert.equal(me.university, 'cvrp')
    assert.equal(me.rollNumber, 'CVRP-2201')
    assert.ok((await call('/content/notices', { token })).body.length > 0)
    assert.equal((await call('/me/join-request', { token })).body.status, 'approved')
    assert.equal((await call(`/admin/join-requests/${made.body.id}/approve`, { token: admin, method: 'POST' })).status, 409)
  })

  it('a rejection reaches the person with the reason, and they can ask again', async () => {
    const token = await signUpIndividual('arjun.join@gmail.com', 'Arjun Sahu')
    const made = await call('/me/join-request', { token, method: 'POST', body: { ...request, rollNumber: 'WRONG-1' } })
    const admin = await as('superadmin')
    assert.equal((await call(`/admin/join-requests/${made.body.id}/reject`, { token: admin, method: 'POST', body: { reason: 'Roll number not on our list.' } })).status, 200)

    const latest = (await call('/me/join-request', { token })).body
    assert.equal(latest.status, 'rejected')
    assert.equal(latest.reason, 'Roll number not on our list.')
    assert.equal((await call('/me', { token })).body.role, 'individual')
    assert.equal((await call('/me/join-request', { token, method: 'POST', body: { ...request, rollNumber: 'CVRP-2299' } })).status, 201)
  })

  it('warns the admin when a roll number is already taken', async () => {
    const token = await signUpIndividual('copycat.join@gmail.com', 'Copy Cat')
    const made = await call('/me/join-request', { token, method: 'POST', body: request }) // CVRP-2201, approved above
    const list = await call('/admin/join-requests', { token: await as('superadmin') })
    assert.match(list.body.find((r) => r.id === made.body.id).warning, /already used by Riya Patnaik/)
  })

  it('only admins who manage students can see or decide requests, and only for their own college', async () => {
    const token = await signUpIndividual('kiit.join@gmail.com', 'Kiit Hopeful')
    const made = await call('/me/join-request', { token, method: 'POST', body: { ...request, university: 'kiit', rollNumber: 'K-1' } })
    assert.equal(made.status, 201)
    assert.equal((await call('/admin/join-requests', { token: await as('examAdmin') })).status, 403)
    assert.equal((await call('/admin/join-requests', { token: await as('aritra') })).status, 403)
    // A CVRP admin can't approve a KIIT request.
    assert.equal((await call(`/admin/join-requests/${made.body.id}/approve`, { token: await as('superadmin'), method: 'POST' })).status, 404)
  })

  it('students and admins cannot file requests, and a waiting request can be withdrawn', async () => {
    assert.equal((await call('/me/join-request', { token: await as('aritra'), method: 'POST', body: request })).status, 400)
    const token = await signUpIndividual('withdraw.join@gmail.com', 'With Draw')
    await call('/me/join-request', { token, method: 'POST', body: { ...request, rollNumber: 'CVRP-3001' } })
    assert.equal((await call('/me/join-request', { token, method: 'DELETE' })).status, 204)
    assert.equal((await call('/me/join-request', { token })).body.status, 'withdrawn')
  })
})
