import { createServer } from 'node:net'
import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'

// A tiny SMTP server that accepts one login and records what it was sent, so the suite never touches Gmail.
const sessions = []
const server = createServer((sock) => {
  const s = { auth: null, from: null, to: [], data: '' }
  sessions.push(s)
  let inData = false
  let buf = ''
  const say = (line) => sock.write(`${line}\r\n`)
  say('220 fake.smtp ready')
  sock.on('data', (chunk) => {
    buf += chunk
    let i
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2)
      if (inData) {
        if (line === '.') { inData = false; say('250 queued') } else s.data += `${line}\n`
        continue
      }
      const cmd = line.toUpperCase()
      if (cmd.startsWith('EHLO') || cmd.startsWith('HELO')) { sock.write('250-fake.smtp\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n') }
      else if (cmd.startsWith('AUTH PLAIN')) {
        const [, user, pass] = Buffer.from(line.split(' ')[2], 'base64').toString().split('\0')
        s.auth = { user, pass }
        say(pass === 'abcdefghijklmnop' ? '235 ok' : '535 bad credentials')
      }
      else if (cmd.startsWith('MAIL FROM')) { s.from = line; say('250 ok') }
      else if (cmd.startsWith('RCPT TO')) { s.to.push(line); say('250 ok') }
      else if (cmd === 'DATA') { inData = true; say('354 go ahead') }
      else if (cmd === 'QUIT') { say('221 bye'); sock.end() }
      else say('250 ok')
    }
  })
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))

process.env.NODE_ENV = 'test'
process.env.DATA_DIR = (await import('node:fs')).mkdtempSync((await import('node:os')).tmpdir() + '/mc-smtp-')
process.env.MAIL_PROVIDER = 'smtp'
process.env.SMTP_HOST = '127.0.0.1'
process.env.SMTP_PORT = String(server.address().port)
process.env.SMTP_SECURE = '0'
process.env.SMTP_USER = 'mycampus.pilot@gmail.com'
process.env.SMTP_PASS = 'abcd efgh ijkl mnop' // Google shows app passwords with spaces
delete process.env.MAIL_FROM
const { sendMail, exposeCodes } = await import('../src/mailer.js')
const { config } = await import('../src/config.js')

describe('SMTP mail provider (Gmail)', () => {
  after(() => server.close())

  it('logs in with the app password (spaces removed) and sends as the Gmail account', async () => {
    const r = await sendMail({ to: 'student@gmail.com', subject: 'Your MyCampus verification code', text: 'Your code is 123456.' })
    assert.equal(r.delivered, true)
    const s = sessions.find((x) => x.data.includes('Your code is 123456.'))
    assert.deepEqual(s.auth, { user: 'mycampus.pilot@gmail.com', pass: 'abcdefghijklmnop' })
    assert.match(s.from, /mycampus\.pilot@gmail\.com/)
    assert.match(s.to[0], /student@gmail\.com/)
    assert.match(s.data, /Subject: Your MyCampus verification code/)
    assert.equal(config.mailFrom, 'MyCampus <mycampus.pilot@gmail.com>')
  })

  it('reports failure instead of throwing when the mail server refuses', async () => {
    config.smtp.pass = 'wrong-password'
    const { sendMail: fresh } = await import(`../src/mailer.js?wrong=${Date.now()}`)
    const r = await fresh({ to: 'x@gmail.com', subject: 's', text: 't' })
    assert.equal(r.delivered, false)
  })

  it('never exposes verification codes to API callers', () => {
    assert.equal(exposeCodes(), false)
  })
})
