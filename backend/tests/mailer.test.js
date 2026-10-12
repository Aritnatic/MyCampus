import { createServer } from 'node:http'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

// A stand-in for the mail provider so the suite never calls the real one.
let received = []
let respondWith = 200
const stub = createServer((req, res) => {
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => { received.push({ auth: req.headers.authorization, body: JSON.parse(body) }); res.writeHead(respondWith).end('{}') })
})
await new Promise((r) => stub.listen(0, '127.0.0.1', r))

process.env.NODE_ENV = 'test'
process.env.DATA_DIR = (await import('node:fs')).mkdtempSync((await import('node:os')).tmpdir() + '/mc-mail-')
process.env.MAIL_PROVIDER = 'resend'
process.env.RESEND_API_KEY = 're_test_key'
process.env.RESEND_API_URL = `http://127.0.0.1:${stub.address().port}/emails`
process.env.MAIL_FROM = 'MyCampus <hello@example.edu>'
const { sendMail, exposeCodes } = await import('../src/mailer.js')

describe('Resend mail provider', () => {
  before(() => { received = []; respondWith = 200 })
  after(() => stub.close())

  it('sends the message with the API key and the configured sender', async () => {
    const r = await sendMail({ to: 'a@students.cvrp.edu.in', subject: 'Your code', text: 'Code 123456' })
    assert.equal(r.delivered, true)
    assert.equal(received[0].auth, 'Bearer re_test_key')
    assert.deepEqual(received[0].body, { from: 'MyCampus <hello@example.edu>', to: ['a@students.cvrp.edu.in'], subject: 'Your code', text: 'Code 123456' })
  })

  it('reports failure instead of throwing when the provider rejects the message', async () => {
    respondWith = 422
    const r = await sendMail({ to: 'b@x.com', subject: 's', text: 't' })
    assert.equal(r.delivered, false)
  })

  it('never exposes verification codes to API callers', () => {
    assert.equal(exposeCodes(), false)
  })
})
