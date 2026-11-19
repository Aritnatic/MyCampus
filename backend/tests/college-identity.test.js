import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, base, call, stop } from './helpers.js'

after(stop)

// A real 1×1 PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

describe('MyCampus ID', () => {
  it('every account has a permanent MC-XXXX-XXXX id, unique, shown on its own profile and on profile cards', async () => {
    const me = (await call('/me', { token: await as('aritra') })).body
    assert.match(me.publicId, /^MC-[0-9A-F]{4}-[0-9A-F]{4}$/)
    const other = (await call('/me', { token: await as('priya') })).body
    assert.notEqual(me.publicId, other.publicId)
    const card = (await call(`/discover/people/${other.id}`, { token: await as('aritra') })).body
    assert.equal(card.publicId, other.publicId)
  })

  it('new sign-ups get one straight away', async () => {
    const reg = await call('/auth/register', { method: 'POST', body: { email: 'idcheck@gmail.com', password: 'Id-check-pass9', name: 'Id Check' } })
    const v = await call('/auth/verify', { method: 'POST', body: { email: 'idcheck@gmail.com', code: reg.body.devCode } })
    assert.match(v.body.user.publicId, /^MC-/)
  })
})

describe('college on profiles, and its logo', () => {
  it('a student profile carries the college name; the logo can be uploaded by a settings admin and loads without signing in', async () => {
    const admin = await as('superadmin')
    assert.equal((await call('/admin/college/logo', { token: await as('examAdmin'), method: 'PUT', raw: PNG, headers: { 'Content-Type': 'image/png' } })).status, 403)
    assert.equal((await call('/admin/college/logo', { token: admin, method: 'PUT', raw: Buffer.from('<svg/>'), headers: { 'Content-Type': 'image/svg+xml' } })).status, 415)
    assert.equal((await call('/admin/college/logo', { token: admin, method: 'PUT', raw: Buffer.from('not a png'), headers: { 'Content-Type': 'image/png' } })).status, 400)

    const up = await call('/admin/college/logo', { token: admin, method: 'PUT', raw: PNG, headers: { 'Content-Type': 'image/png' } })
    assert.equal(up.status, 200)
    assert.match(up.body.logoUrl, /^\/api\/colleges\/cvrp\/logo\?v=\d+$/)

    const me = (await call('/me', { token: await as('aritra') })).body
    assert.equal(me.college.short, 'CVRP')
    assert.equal(me.college.logoUrl, up.body.logoUrl)

    const img = await fetch(base.replace(/\/api$/, '') + up.body.logoUrl) // no token
    assert.equal(img.status, 200)
    assert.equal(img.headers.get('content-type'), 'image/png')
    assert.deepEqual(Buffer.from(await img.arrayBuffer()), PNG)
  })
})

describe('finding a college to join', () => {
  it('searches by name, short name or city, and says nothing about colleges not on MyCampus', async () => {
    const token = await as('individual')
    const byShort = (await call('/join/colleges?q=cvrp', { token })).body
    assert.equal(byShort[0].id, 'cvrp')
    assert.ok((await call('/join/colleges?q=raman', { token })).body.some((c) => c.id === 'cvrp'))
    assert.ok((await call('/join/colleges?q=berhampur', { token })).body.every((c) => c.city === 'Berhampur'))
    assert.deepEqual((await call('/join/colleges?q=hogwarts', { token })).body, [])
    assert.ok((await call('/join/colleges', { token })).body.length >= 3)
  })
})

describe("the college's own registration number", () => {
  it('is set by that college, shown to the student and the college, and never on public profile cards', async () => {
    const admin = await as('superadmin')
    const aritra = (await call('/me', { token: await as('aritra') })).body
    const set = await call(`/admin/students/${aritra.id}/registration`, { token: admin, method: 'PATCH', body: { rollNumber: 'F24-CSE-031' } })
    assert.equal(set.status, 200)
    assert.equal((await call('/me', { token: await as('aritra') })).body.rollNumber, 'F24-CSE-031')

    const list = (await call('/admin/students?q=F24-CSE-031', { token: admin })).body
    assert.equal(list.items[0].id, aritra.id)
    assert.equal(list.items[0].rollNumber, 'F24-CSE-031')
    assert.match(list.items[0].publicId, /^MC-/)

    const card = (await call(`/discover/people/${aritra.id}`, { token: await as('priya') })).body
    assert.equal(card.rollNumber, undefined)

    const priya = (await call('/me', { token: await as('priya') })).body
    assert.equal((await call(`/admin/students/${priya.id}/registration`, { token: admin, method: 'PATCH', body: { rollNumber: 'f24-cse-031' } })).status, 409)
    const rahul = (await call('/me', { token: await as('rahul') })).body // KIIT
    assert.equal((await call(`/admin/students/${rahul.id}/registration`, { token: admin, method: 'PATCH', body: { rollNumber: 'X' } })).status, 404)
  })
})
