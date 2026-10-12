import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

const ids = (r) => r.body.map((x) => x.id)

describe('campus layer is private to verified members', () => {
  it('a student sees their own campus notices; another campus sees none', async () => {
    const cvrp = await call('/content/notices', { token: await as('aritra') })
    const kiit = await call('/content/notices', { token: await as('rahul') })
    assert.ok(cvrp.body.length >= 5)
    assert.deepEqual(kiit.body, [])
  })

  it("hidden records return 404, not 403, so their existence isn't revealed", async () => {
    const id = ids(await call('/content/notices', { token: await as('aritra') }))[0]
    assert.equal((await call(`/content/notices/${id}`, { token: await as('aritra') })).status, 200)
    assert.equal((await call(`/content/notices/${id}`, { token: await as('rahul') })).status, 404)
    assert.equal((await call(`/content/notices/${id}`, { token: await as('individual') })).status, 404)
  })

  it('individuals never see campus content (notices, exams, faculty, map, alerts)', async () => {
    const token = await as('individual')
    for (const path of ['/content/notices', '/content/exams', '/content/faculty', '/content/grades']) {
      assert.deepEqual((await call(path, { token })).body, [], path)
    }
    assert.equal((await call('/campus/map', { token })).status, 403)
    assert.equal((await call('/alerts', { token })).status, 403)
  })

  it('drafts are hidden from students but visible to the admin who owns them', async () => {
    const student = await call('/content/notices', { token: await as('aritra') })
    const admin = await call('/admin/notices', { token: await as('moderator') })
    assert.ok(student.body.every((n) => n.status === 'published'))
    assert.ok(admin.body.some((n) => n.status === 'draft'))
  })

  it('students get only the exam timetable for their own branch and semester', async () => {
    const r = await call('/content/exams', { token: await as('aritra') })
    assert.ok(r.body.length > 0)
    assert.ok(r.body.every((e) => e.branch === 'CSE' && e.semester === 5))
  })

  it('cross-university content is visible to other campuses; campus-only is not', async () => {
    const kiit = await call('/content/projects', { token: await as('rahul') })
    assert.ok(kiit.body.length > 0)
    assert.ok(kiit.body.every((p) => p.university === 'kiit' || p.visibility === 'cross-university'))
  })
})

describe('no ranking of students', () => {
  const bad = ['rank', 'rating', 'toppers']
  const leaks = (value, path = '') => {
    if (Array.isArray(value)) return value.flatMap((v, i) => leaks(v, `${path}[${i}]`))
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => (bad.includes(k) ? [`${path}.${k}`] : leaks(v, `${path}.${k}`)))
    return []
  }

  it('grades, result batches and people expose no rank, rating or topper lists', async () => {
    // Sanity check that the data really contains these fields, so the assertions below can fail.
    const raw = await call('/admin/results', { token: await as('examAdmin') })
    assert.ok(leaks(raw.body).length > 0, 'seed data should contain toppers for this test to mean anything')

    const token = await as('aritra')
    for (const path of ['/content/grades', '/content/results', '/discover/people?scope=all', '/me']) {
      const r = await call(path, { token })
      assert.equal(r.status, 200, path)
      assert.deepEqual(leaks(r.body), [], `${path} leaks ranking fields`)
    }
  })
})

describe('admin scope', () => {
  it('permissions are enforced per module', async () => {
    const mod = await as('moderator')
    assert.equal((await call('/admin/notices', { token: mod })).status, 200)
    assert.equal((await call('/admin/exams', { token: mod })).status, 403)
    assert.equal((await call('/admin/users', { token: mod })).status, 403)
    assert.equal((await call('/admin/notices', { token: await as('aritra') })).status, 403)
  })

  it('clients cannot choose the id or university of a record', async () => {
    const token = await as('moderator')
    const r = await call('/admin/notices', { token, method: 'POST', body: { id: 'hijack', university: 'kiit', title: 'Hello', body: 'World', category: 'general' } })
    assert.equal(r.status, 201)
    assert.notEqual(r.body.id, 'hijack')
    assert.equal(r.body.university, 'cvrp')
  })

  it('rejects incomplete records', async () => {
    const r = await call('/admin/notices', { token: await as('moderator'), method: 'POST', body: { title: 'No body' } })
    assert.equal(r.status, 400)
    assert.match(r.body.error, /body/)
  })

  it('publishing a notice notifies the right students, and only them', async () => {
    const mod = await as('moderator')
    const before = (await call('/notifications', { token: await as('aritra') })).body.unread
    const created = await call('/admin/notices', { token: mod, method: 'POST', body: { title: 'Fee deadline moved', body: 'New date is Friday.', category: 'general', status: 'published', branches: ['CSE'] } })
    assert.equal(created.status, 201)
    const aritra = await call('/notifications', { token: await as('aritra') })
    assert.equal(aritra.body.unread, before + 1)
    assert.equal(aritra.body.items[0].title, 'Fee deadline moved')
    // Priya is ECE: not in the CSE-only audience. KIIT students are on another campus.
    const priya = await call('/notifications', { token: await as('priya') })
    assert.equal(priya.body.items.some((n) => n.title === 'Fee deadline moved'), false)
    assert.equal((await call('/notifications', { token: await as('rahul') })).body.items.some((n) => n.title === 'Fee deadline moved'), false)
  })

  it('every change is recorded in the audit log', async () => {
    const log = await call('/admin/audit', { token: await as('superadmin') })
    assert.equal(log.status, 200)
    assert.ok(log.body.some((e) => e.action === 'notice.create'))
  })
})
