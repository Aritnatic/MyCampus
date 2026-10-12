import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNTS, as, call, login, stop } from './helpers.js'

after(stop)

describe('admin users', () => {
  it('only a superadmin creates admins, and only on the campus email domain', async () => {
    const body = { name: 'New Moderator', email: 'new.mod@cvrp.edu.in', adminRole: 'moderator', permissions: ['notices'] }
    assert.equal((await call('/admin/users', { token: await as('moderator'), method: 'POST', body })).status, 403)

    const sup = await as('superadmin')
    assert.equal((await call('/admin/users', { token: sup, method: 'POST', body: { ...body, email: 'new.mod@gmail.com' } })).status, 400)
    const made = await call('/admin/users', { token: sup, method: 'POST', body })
    assert.equal(made.status, 201)
    assert.deepEqual(made.body.permissions, ['notices'])

    // The new admin sets their own password with the emailed code, then can work within their permissions.
    const reset = await call('/auth/reset', { method: 'POST', body: { email: body.email, code: made.body.devCode, password: 'Fresh-admin-pass1' } })
    assert.equal(reset.status, 204)
    const token = await login(body.email, 'Fresh-admin-pass1')
    assert.equal((await call('/admin/notices', { token })).status, 200)
    assert.equal((await call('/admin/events', { token })).status, 403)
  })

  it('suspending an account signs it out immediately and blocks login', async () => {
    const sup = await as('superadmin')
    const token = await as('rahul')
    // Rahul is at KIIT: a CVRP admin can't touch him.
    const rahul = (await call('/me', { token })).body
    assert.equal((await call(`/admin/users/${rahul.id}`, { token: sup, method: 'PATCH', body: { status: 'suspended' } })).status, 404)

    const vikram = (await call('/me', { token: await as('vikram') })).body
    const done = await call(`/admin/users/${vikram.id}`, { token: sup, method: 'PATCH', body: { status: 'suspended' } })
    assert.equal(done.status, 200)
    assert.equal((await call('/me', { token: await as('vikram') })).status, 401)
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: ACCOUNTS.vikram, password: 'campus123' } })).status, 401)
  })

  it("admins can't change their own account or escalate permissions", async () => {
    const mod = await as('moderator')
    const modId = (await call('/me', { token: mod })).body.id
    assert.equal((await call(`/admin/users/${modId}`, { token: mod, method: 'PATCH', body: { status: 'suspended' } })).status, 403) // lacks 'users'
    const sup = await as('superadmin')
    const supId = (await call('/me', { token: sup })).body.id
    assert.equal((await call(`/admin/users/${supId}`, { token: sup, method: 'PATCH', body: { status: 'suspended' } })).status, 400)
  })
})

describe('verification domains', () => {
  it('lets a campus choose which email domains count, but not public mail providers or another campus', async () => {
    const sup = await as('superadmin')
    const current = await call('/admin/domains', { token: sup })
    assert.ok(current.body.domains.includes('students.cvrp.edu.in'))
    assert.equal((await call('/admin/domains', { token: sup, method: 'PUT', body: { domains: ['cvrp.edu.in', 'gmail.com'] } })).status, 400)
    assert.equal((await call('/admin/domains', { token: sup, method: 'PUT', body: { domains: ['students.kiit.edu.in'] } })).status, 409)
    assert.equal((await call('/admin/domains', { token: sup, method: 'PUT', body: { domains: ['not a domain'] } })).status, 400)
    assert.equal((await call('/admin/domains', { token: await as('moderator'), method: 'PUT', body: { domains: ['x.edu.in'] } })).status, 403)

    const ok = await call('/admin/domains', { token: sup, method: 'PUT', body: { domains: ['cvrp.edu.in', 'students.cvrp.edu.in', 'alumni.cvrp.edu.in'] } })
    assert.equal(ok.status, 200)
    // A new alumni address now verifies as a CVRP member.
    const reg = await call('/auth/register', { method: 'POST', body: { email: 'old.hand@alumni.cvrp.edu.in', password: 'Str0ng-pass!', name: 'Old Hand' } })
    const verified = await call('/auth/verify', { method: 'POST', body: { email: 'old.hand@alumni.cvrp.edu.in', code: reg.body.devCode } })
    assert.equal(verified.body.user.university, 'cvrp')
  })
})

describe('roster, stats and broadcast', () => {
  it('lists the campus roster with filters and pagination, scoped to the admin', async () => {
    const sup = await as('superadmin')
    const all = await call('/admin/students?limit=2', { token: sup })
    assert.equal(all.status, 200)
    assert.equal(all.body.items.length, 2)
    assert.ok(all.body.total >= 3)
    // The header summary covers the whole campus even when a filter narrows the list.
    assert.equal(all.body.summary.total, all.body.total)
    const narrowed = await call('/admin/students?branch=CSE&limit=1', { token: sup })
    assert.equal(narrowed.body.summary.total, all.body.summary.total)
    assert.ok(narrowed.body.total < narrowed.body.summary.total)
    assert.ok(all.body.items.every((s) => s.email.endsWith('cvrp.edu.in')))
    const cse = await call('/admin/students?branch=CSE', { token: sup })
    assert.ok(cse.body.items.every((s) => s.branch === 'CSE'))
    assert.equal((await call('/admin/students', { token: await as('examAdmin') })).status, 403)
  })

  it('reports dashboard numbers for the admin’s own campus', async () => {
    const stats = await call('/admin/stats', { token: await as('moderator') })
    assert.equal(stats.status, 200)
    assert.ok(stats.body.students >= 3)
    assert.ok(stats.body.notices.published >= 1)
    assert.equal((await call('/admin/stats', { token: await as('aritra') })).status, 403)
  })

  it('broadcasts to a chosen audience only', async () => {
    const mod = await as('moderator')
    const sent = await call('/admin/notify', { token: mod, method: 'POST', body: { title: 'Sem 5 meeting', body: 'Room 201 at 3pm', branches: ['CSE'], semesters: [5] } })
    assert.equal(sent.status, 200)
    assert.ok(sent.body.recipients >= 1)
    assert.equal((await call('/notifications', { token: await as('aritra') })).body.items[0].title, 'Sem 5 meeting')
    assert.equal((await call('/notifications', { token: await as('rahul') })).body.items.some((n) => n.title === 'Sem 5 meeting'), false)
  })
})

describe('sessions', () => {
  it('sign-out-everywhere revokes existing tokens', async () => {
    const email = ACCOUNTS.sneha
    const a = await login(email)
    const b = (await call('/auth/login', { method: 'POST', body: { email, password: 'campus123' } })).body.token
    assert.equal((await call('/me/logout-all', { token: a, method: 'POST' })).status, 204)
    assert.equal((await call('/me', { token: a })).status, 401)
    assert.equal((await call('/me', { token: b })).status, 401)
  })

  it('security headers are set and unknown routes 404 as JSON', async () => {
    const r = await call('/definitely-not-here', { token: await as('aritra') })
    assert.equal(r.status, 404)
    assert.ok(r.headers.get('x-content-type-options'))
    assert.equal(r.headers.get('x-powered-by'), null)
  })
})

describe('audit log readability', () => {
  it('names the person an account change was about', async () => {
    const sup = await as('superadmin')
    const priya = (await call('/me', { token: await as('priya') })).body
    await call(`/admin/users/${priya.id}`, { token: sup, method: 'PATCH', body: { status: 'suspended' } })
    await call(`/admin/users/${priya.id}`, { token: sup, method: 'PATCH', body: { status: 'active' } })
    const entry = (await call('/admin/audit', { token: sup })).body.find((e) => e.action === 'user.update')
    assert.equal(entry.data.name, 'Priya Sharma')
    assert.equal(entry.data.status, 'active')
  })
})

describe('roster import', () => {
  const rows = [
    { name: 'Asha Verma', email: 'asha.verma@students.cvrp.edu.in', branch: 'ECE', year: '2', semester: '3' },
    { name: 'Bikram Nayak', email: 'bikram.nayak@students.cvrp.edu.in', branch: 'CSE', year: 1, semester: 1 },
    { name: 'Outsider', email: 'outsider@gmail.com', branch: 'CSE' },
    { name: 'Asha Again', email: 'ASHA.VERMA@students.cvrp.edu.in' },
    { name: 'Existing', email: ACCOUNTS.aritra },
    { name: 'X', email: 'not-an-email' },
  ]

  it('previews without writing, then imports only valid rows and explains the rest', async () => {
    const sup = await as('superadmin')
    const dry = await call('/admin/students/import', { token: sup, method: 'POST', body: { rows, dryRun: true } })
    assert.equal(dry.status, 200)
    assert.equal(dry.body.created, 2)
    assert.equal(dry.body.skipped.length, 4)
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'asha.verma@students.cvrp.edu.in', password: 'x' } })).status, 401)
    const roster = await call('/admin/students?q=asha', { token: sup })
    assert.equal(roster.body.total, 0, 'a dry run must not create anything')

    const real = await call('/admin/students/import', { token: sup, method: 'POST', body: { rows } })
    assert.equal(real.body.created, 2)
    const reasons = Object.fromEntries(real.body.skipped.map((s) => [s.line, s.reason]))
    assert.match(reasons[4], /Not a CVRP email address/)
    assert.match(reasons[5], /Listed twice/)
    assert.match(reasons[6], /Already has an account/)
    assert.equal(real.body.skipped.find((s) => s.line === 7).email, 'not-an-email')

    const after = await call('/admin/students?q=verma', { token: sup })
    assert.equal(after.body.items[0].branch, 'ECE')
    assert.equal(after.body.items[0].verified, false, 'imported students must prove they own the email')
    // Running it again creates nothing new.
    assert.equal((await call('/admin/students/import', { token: sup, method: 'POST', body: { rows } })).body.created, 0)
  })

  it('lets an imported student claim their account by setting a password, and nobody else can use it first', async () => {
    const email = 'bikram.nayak@students.cvrp.edu.in'
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'anything-1234' } })).status, 401)
    const forgot = await call('/auth/forgot', { method: 'POST', body: { email } })
    const set = await call('/auth/reset', { method: 'POST', body: { email, code: forgot.body.devCode, password: 'My-own-pass-99' } })
    assert.equal(set.status, 204)
    const signedIn = await call('/auth/login', { method: 'POST', body: { email, password: 'My-own-pass-99' } })
    assert.equal(signedIn.status, 200)
    assert.equal(signedIn.body.user.university, 'cvrp')
    assert.equal((await call('/content/notices', { token: signedIn.body.token })).status, 200)
  })

  it('needs the users permission and caps the file size', async () => {
    assert.equal((await call('/admin/students/import', { token: await as('moderator'), method: 'POST', body: { rows } })).status, 403)
    const sup = await as('superadmin')
    assert.equal((await call('/admin/students/import', { token: sup, method: 'POST', body: { rows: [] } })).status, 400)
  })
})
