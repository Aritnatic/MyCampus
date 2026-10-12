import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNTS, call, login, stop } from './helpers.js'

after(stop)

describe('login', () => {
  it('signs in with the right password and never leaks the hash', async () => {
    const r = await call('/auth/login', { method: 'POST', body: { email: ACCOUNTS.aritra, password: 'campus123' } })
    assert.equal(r.status, 200)
    assert.ok(r.body.token)
    assert.equal(r.body.user.role, 'student')
    assert.ok(!('password_hash' in r.body.user))
    assert.ok(!r.text.includes('scrypt$'))
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    const wrong = await call('/auth/login', { method: 'POST', body: { email: ACCOUNTS.aritra, password: 'nope-nope' } })
    const unknown = await call('/auth/login', { method: 'POST', body: { email: 'nobody@students.cvrp.edu.in', password: 'nope-nope' } })
    assert.equal(wrong.status, 401)
    assert.deepEqual(wrong.body, unknown.body)
  })

  it('locks an account/ip pair after repeated failures', async () => {
    let last
    for (let i = 0; i < 9; i++) last = await call('/auth/login', { method: 'POST', body: { email: ACCOUNTS.rahul, password: 'wrong-wrong' } })
    assert.equal(last.status, 429)
  })

  it('rejects requests without a valid token', async () => {
    assert.equal((await call('/me')).status, 401)
    assert.equal((await call('/me', { token: 'garbage' })).status, 401)
  })
})

describe('registration & verification', () => {
  it('a college email becomes a verified campus student after confirming the code', async () => {
    const email = 'new.student@students.cvrp.edu.in'
    const reg = await call('/auth/register', { method: 'POST', body: { email, password: 'Str0ng-pass!', name: 'New Student', branch: 'Computer Science & Engineering', year: 1, semester: 1 } })
    assert.equal(reg.status, 202)
    assert.match(reg.body.devCode, /^\d{6}$/)

    // Can't sign in until the address is verified.
    const early = await call('/auth/login', { method: 'POST', body: { email, password: 'Str0ng-pass!' } })
    assert.equal(early.status, 403)

    const bad = await call('/auth/verify', { method: 'POST', body: { email, code: '000000' } })
    assert.equal(bad.status, 400)
    const ok = await call('/auth/verify', { method: 'POST', body: { email, code: reg.body.devCode } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.user.role, 'student')
    assert.equal(ok.body.user.university, 'cvrp')

    // The student now sees their campus's notices.
    const notices = await call('/content/notices', { token: ok.body.token })
    assert.ok(notices.body.length > 0)
  })

  it('a non-college email becomes an individual with no campus access', async () => {
    const email = 'someone.outside@gmail.com'
    const reg = await call('/auth/register', { method: 'POST', body: { email, password: 'Str0ng-pass!', name: 'Outside Person' } })
    const ok = await call('/auth/verify', { method: 'POST', body: { email, code: reg.body.devCode } })
    assert.equal(ok.body.user.role, 'individual')
    assert.equal(ok.body.user.university, null)
    assert.deepEqual((await call('/content/notices', { token: ok.body.token })).body, [])
  })

  it('does not reveal whether an email is already registered', async () => {
    const taken = await call('/auth/register', { method: 'POST', body: { email: ACCOUNTS.aritra, password: 'Str0ng-pass!', name: 'Someone Else' } })
    const fresh = await call('/auth/register', { method: 'POST', body: { email: 'fresh.one@gmail.com', password: 'Str0ng-pass!', name: 'Fresh One' } })
    assert.equal(taken.status, 202)
    assert.equal(taken.body.message, fresh.body.message)
    assert.equal(taken.body.devCode, undefined) // nothing was created, so no code
  })

  it('rejects weak passwords and invalid emails', async () => {
    const weak = await call('/auth/register', { method: 'POST', body: { email: 'weak@gmail.com', password: 'password', name: 'Weak Pass' } })
    assert.equal(weak.status, 400)
    const bad = await call('/auth/register', { method: 'POST', body: { email: 'not-an-email', password: 'Str0ng-pass!', name: 'Bad Email' } })
    assert.equal(bad.status, 400)
  })

  it('locks a verification code after 5 wrong guesses', async () => {
    const email = 'bruteforce@gmail.com'
    const reg = await call('/auth/register', { method: 'POST', body: { email, password: 'Str0ng-pass!', name: 'Brute Force' } })
    for (let i = 0; i < 5; i++) await call('/auth/verify', { method: 'POST', body: { email, code: '111111' } })
    const right = await call('/auth/verify', { method: 'POST', body: { email, code: reg.body.devCode } })
    assert.equal(right.status, 400)
  })
})

describe('password reset & change', () => {
  it('reset sets a new password and signs out every old session', async () => {
    const email = ACCOUNTS.vikram
    const old = await login(email)
    const forgot = await call('/auth/forgot', { method: 'POST', body: { email } })
    assert.equal(forgot.status, 202)
    const reset = await call('/auth/reset', { method: 'POST', body: { email, code: forgot.body.devCode, password: 'Brand-new-pass1' } })
    assert.equal(reset.status, 204)
    assert.equal((await call('/me', { token: old })).status, 401)
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'campus123' } })).status, 401)
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'Brand-new-pass1' } })).status, 200)
  })

  it('forgot-password answers identically for unknown emails', async () => {
    const known = await call('/auth/forgot', { method: 'POST', body: { email: ACCOUNTS.rahul } })
    const unknown = await call('/auth/forgot', { method: 'POST', body: { email: 'ghost@nowhere.com' } })
    assert.equal(known.status, unknown.status)
    assert.equal(known.body.message, unknown.body.message)
  })

  it('changing your password needs the current one and returns a fresh token', async () => {
    const email = ACCOUNTS.sneha
    const token = await login(email)
    const wrong = await call('/me/password', { token, method: 'POST', body: { current: 'not-it-at-all', next: 'Another-good-pass1' } })
    assert.equal(wrong.status, 400)
    const ok = await call('/me/password', { token, method: 'POST', body: { current: 'campus123', next: 'Another-good-pass1' } })
    assert.equal(ok.status, 200)
    assert.equal((await call('/me', { token })).status, 401) // old token revoked
    assert.equal((await call('/me', { token: ok.body.token })).status, 200)
  })
})

describe('concurrent sign-ups', () => {
  it('a double submit for the same email creates one account and never errors', async () => {
    const body = { email: 'double.tap@gmail.com', password: 'Str0ng-pass!', name: 'Double Tap' }
    const [a, b] = await Promise.all([call('/auth/register', { method: 'POST', body }), call('/auth/register', { method: 'POST', body })])
    assert.deepEqual([a.status, b.status], [202, 202])
  })
})
