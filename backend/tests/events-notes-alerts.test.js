import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, base, call, stop } from './helpers.js'

after(stop)

const future = (days) => new Date(Date.now() + days * 86400_000).toISOString()

describe('event registration', () => {
  it('fills up, waitlists, and promotes the next person when a seat frees', async () => {
    const mod = await as('moderator')
    const event = (await call('/admin/events', { token: mod, method: 'POST', body: { title: 'Robotics Workshop', startDate: future(10), venue: 'Lab 2', status: 'approved', approvalStatus: 'approved', maxParticipants: 1, registrationDeadline: future(5) } })).body

    const aritra = await as('aritra')
    const priya = await as('priya')
    assert.equal((await call(`/events/${event.id}/register`, { token: aritra, method: 'POST' })).body.status, 'registered')
    const second = await call(`/events/${event.id}/register`, { token: priya, method: 'POST' })
    assert.equal(second.body.status, 'waitlist')
    assert.equal(second.body.full, true)

    // Registering twice changes nothing.
    assert.equal((await call(`/events/${event.id}/register`, { token: aritra, method: 'POST' })).status, 200)

    await call(`/events/${event.id}/register`, { token: aritra, method: 'DELETE' })
    assert.equal((await call(`/events/${event.id}/registration`, { token: priya })).body.status, 'registered')
    const note = (await call('/notifications', { token: priya })).body.items[0]
    assert.match(note.title, /seat opened/i)

    const roster = await call(`/admin/events/${event.id}/registrations`, { token: mod })
    assert.deepEqual(roster.body.map((r) => r.name), ['Priya Sharma'])
  })

  it('closed registration and other campuses are refused', async () => {
    const mod = await as('moderator')
    const closed = (await call('/admin/events', { token: mod, method: 'POST', body: { title: 'Old Quiz', startDate: future(1), status: 'approved', registrationDeadline: new Date(Date.now() - 86400_000).toISOString() } })).body
    assert.equal((await call(`/events/${closed.id}/register`, { token: await as('aritra'), method: 'POST' })).status, 400)
    // Campus-only event: a KIIT student can't even see it.
    assert.equal((await call(`/events/${closed.id}/register`, { token: await as('rahul'), method: 'POST' })).status, 404)
  })
})

describe('shared notes', () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')

  it('create → upload → download → rate → delete, with permissions at every step', async () => {
    const aritra = await as('aritra')
    const priya = await as('priya')
    const note = await call('/notes', { token: aritra, method: 'POST', body: { title: 'OS Unit 3 summary', subject: 'CSE-302', description: 'Scheduling and deadlocks.', tags: ['OS'] } })
    assert.equal(note.status, 201)
    assert.equal(note.body.hasFile, false)

    // Upload validation: type allowlist and magic bytes.
    assert.equal((await call(`/notes/${note.body.id}/file`, { token: aritra, method: 'PUT', raw: Buffer.from('hello'), headers: { 'Content-Type': 'text/plain' } })).status, 415)
    assert.equal((await call(`/notes/${note.body.id}/file`, { token: aritra, method: 'PUT', raw: Buffer.from('MZ not a pdf'), headers: { 'Content-Type': 'application/pdf' } })).status, 400)
    assert.equal((await call(`/notes/${note.body.id}/file`, { token: priya, method: 'PUT', raw: pdf, headers: { 'Content-Type': 'application/pdf' } })).status, 404) // not the author
    const up = await call(`/notes/${note.body.id}/file`, { token: aritra, method: 'PUT', raw: pdf, headers: { 'Content-Type': 'application/pdf' } })
    assert.equal(up.status, 200)
    assert.equal(up.body.fileType, 'pdf')

    const dl = await fetch(`${base}/notes/${note.body.id}/file`, { headers: { Authorization: `Bearer ${priya}` } })
    assert.equal(dl.status, 200)
    assert.equal(dl.headers.get('content-type'), 'application/pdf')
    assert.equal(dl.headers.get('x-content-type-options'), 'nosniff')
    assert.deepEqual(Buffer.from(await dl.arrayBuffer()), pdf)
    assert.equal((await call(`/content/notes/${note.body.id}`, { token: priya })).body.downloads, 1)
    assert.equal((await fetch(`${base}/notes/${note.body.id}/file`, { headers: { Authorization: `Bearer ${await as('rahul')}` } })).status, 404) // other campus

    assert.equal((await call(`/notes/${note.body.id}/rate`, { token: aritra, method: 'POST', body: { rating: 5 } })).status, 400) // own note
    assert.equal((await call(`/notes/${note.body.id}/rate`, { token: priya, method: 'POST', body: { rating: 9 } })).status, 400)
    const rated = await call(`/notes/${note.body.id}/rate`, { token: priya, method: 'POST', body: { rating: 4, review: 'Clear and short.' } })
    assert.equal(rated.body.rating, 4)
    assert.equal(rated.body.reviews, 1)

    assert.equal((await call(`/notes/${note.body.id}`, { token: priya, method: 'DELETE' })).status, 404)
    assert.equal((await call(`/notes/${note.body.id}`, { token: aritra, method: 'DELETE' })).status, 204)
  })
})

describe('evacuation alerts', () => {
  const alert = { kind: 'evacuation', severity: 'critical', title: 'Fire drill', message: 'Leave Block A by the nearest exit.', location: 'Block A' }

  it('only safety admins can raise alerts; students see them and report in', async () => {
    assert.equal((await call('/admin/alerts', { token: await as('moderator'), method: 'POST', body: alert })).status, 403)
    assert.equal((await call('/admin/alerts', { token: await as('aritra'), method: 'POST', body: alert })).status, 403)

    const admin = await as('superadmin')
    const raised = await call('/admin/alerts', { token: admin, method: 'POST', body: alert })
    assert.equal(raised.status, 201)

    const aritra = await as('aritra')
    const seen = await call('/alerts', { token: aritra })
    assert.equal(seen.body[0].title, 'Fire drill')
    assert.equal((await call('/alerts', { token: await as('rahul') })).body.length, 0) // other campus
    assert.match((await call('/notifications', { token: aritra })).body.items[0].title, /Fire drill/)

    assert.equal((await call(`/alerts/${raised.body.id}/ack`, { token: aritra, method: 'POST', body: { status: 'safe' } })).status, 200)
    assert.equal((await call(`/alerts/${raised.body.id}/ack`, { token: await as('priya'), method: 'POST', body: { status: 'need_help' } })).status, 200)

    const roll = await call(`/admin/alerts/${raised.body.id}/responses`, { token: admin })
    assert.equal(roll.body.safe, 1)
    assert.deepEqual(roll.body.needHelp.map((p) => p.name), ['Priya Sharma'])
    assert.ok(roll.body.notResponded > 0)

    await call(`/admin/alerts/${raised.body.id}/resolve`, { token: admin, method: 'POST' })
    assert.equal((await call(`/alerts/${raised.body.id}/ack`, { token: aritra, method: 'POST', body: { status: 'safe' } })).status, 404) // resolved
  })

  it('pushes new alerts to connected phones over the stream, using one-time tickets', async () => {
    const aritra = await as('aritra')
    const { ticket } = (await call('/stream/ticket', { token: aritra, method: 'POST' })).body
    const ctl = new AbortController()
    const res = await fetch(`${base}/stream?ticket=${ticket}`, { signal: ctl.signal })
    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type'), /text\/event-stream/)

    // Tickets work once.
    assert.equal((await fetch(`${base}/stream?ticket=${ticket}`)).status, 401)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const readUntil = async (needle) => {
      while (!buffer.includes(needle)) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value)
      }
      return buffer
    }
    await readUntil('event: ready')
    await call('/admin/alerts', { token: await as('superadmin'), method: 'POST', body: { ...alert, title: 'Second alert' } })
    const got = await readUntil('event: alert')
    assert.match(got, /Second alert/)
    ctl.abort()
  })
})

describe('event timing', () => {
  it('marks events upcoming until they finish, then past', async () => {
    const mod = await as('moderator')
    const mk = (title, start, end) => call('/admin/events', { token: mod, method: 'POST', body: { title, startDate: start, endDate: end, status: 'approved', approvalStatus: 'approved' } })
    const soon = (await mk('Future quiz', future(3), future(3))).body
    const gone = (await mk('Last month quiz', future(-30), future(-30))).body
    const events = (await call('/content/events', { token: await as('aritra') })).body
    assert.equal(events.find((e) => e.id === soon.id).status, 'upcoming')
    assert.equal(events.find((e) => e.id === gone.id).status, 'past')
  })
})
