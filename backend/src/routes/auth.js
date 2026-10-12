import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { exposeCodes, sendMail } from '../mailer.js'
import {
  burnPasswordCheck, consumeCode, hashPassword, issueCode, loginLimiter, passwordProblem, requireAuth, signToken, verifyPassword,
} from '../auth.js'
import { config } from '../config.js'
import { audit, db, now, publicUser, universities, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'

export const authRoutes = Router()

// Blunt per-IP cap on every auth endpoint; targeted per-account limits live in the handlers.
authRoutes.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: config.authIpLimit, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Try again later.' } }))

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254)
const code = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.')

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

// The university whose registered email domains include this address's domain, if any.
export function universityForEmail(address) {
  const domain = address.split('@')[1]
  return universities.all().find((u) => (u.domains ?? []).includes(domain)) ?? null
}

authRoutes.post('/auth/login', wrap(async (req, res) => {
  const { email: address, password } = parse(z.object({ email, password: z.string().min(1).max(128) }), req.body)
  const key = `${address}|${req.ip}`
  if (loginLimiter.blocked(key)) throw new HttpError(429, 'Too many attempts. Try again in a few minutes.')

  const row = users.byEmail(address)
  // Same message *and same timing* for unknown email and wrong password so accounts can't be enumerated.
  const passwordOk = row ? await verifyPassword(password, row.password_hash) : (await burnPasswordCheck(password), false)
  if (!row || row.status !== 'active' || !passwordOk) {
    loginLimiter.fail(key)
    throw new HttpError(401, 'Incorrect email or password.')
  }
  loginLimiter.clear(key)
  if (!row.email_verified) throw new HttpError(403, 'Verify your email first. Check your inbox for the 6-digit code.')

  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), row.id)
  res.json({ token: signToken(row), user: publicUser(row) })
}))

const registerBody = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  name: z.string().trim().min(2).max(80),
  branch: z.string().trim().max(80).optional(),
  year: z.number().int().min(1).max(6).optional(),
  semester: z.number().int().min(1).max(12).optional(),
})

// College email → verified campus student (after confirming the address). Any other email →
// an "individual" account that only ever sees cross-university content.
authRoutes.post('/auth/register', wrap(async (req, res) => {
  const body = parse(registerBody, req.body)
  const problem = passwordProblem(body.password, body.email)
  if (problem) throw new HttpError(400, problem)

  const accepted = { status: 'verification_sent', message: 'If that email can be registered, we sent a 6-digit code to it.' }
  if (users.byEmail(body.email)) {
    // Don't reveal that the address is taken; tell the owner instead.
    await sendMail({ to: body.email, subject: 'MyCampus sign-up', text: 'Someone tried to sign up with this email, but you already have an account. If it was you, sign in or reset your password.' })
    return res.status(202).json(accepted)
  }

  const uni = universityForEmail(body.email)
  const id = `${uni ? 'stu' : 'ind'}-${randomUUID().slice(0, 8)}`
  const profile = {
    name: body.name, avatar: initials(body.name), bio: '', skills: [], interests: [], lookingFor: [], achievements: [],
    socials: {}, mentor: { open: false, topics: [] }, verified: true,
    ...(uni && { university: uni.id, branch: body.branch ?? '', year: body.year ?? 1, semester: body.semester ?? 1 }),
  }
  try {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, university, status, data, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, 0, ?)`,
    ).run(id, body.email, await hashPassword(body.password), uni ? 'student' : 'individual', uni?.id ?? null, JSON.stringify(profile), now())
  } catch (err) {
    // Someone registered this address between our check and the insert (e.g. a double tap): same outcome as "already registered".
    if (/UNIQUE/i.test(err.message)) return res.status(202).json(accepted)
    throw err
  }

  const otp = issueCode(body.email, 'verify')
  await sendMail({ to: body.email, subject: 'Your MyCampus verification code', text: `Your code is ${otp}. It expires in 15 minutes.` })
  audit({ id, university: uni?.id }, 'auth.register', id)
  res.status(202).json({ ...accepted, ...(exposeCodes() && { devCode: otp }) })
}))

authRoutes.post('/auth/verify', wrap(async (req, res) => {
  const { email: address, code: otp } = parse(z.object({ email, code }), req.body)
  const row = users.byEmail(address)
  if (!row || row.email_verified || !consumeCode(address, 'verify', otp)) throw new HttpError(400, 'That code is wrong or has expired.')
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.id)
  const fresh = users.byId(row.id)
  res.json({ token: signToken(fresh), user: publicUser(fresh) })
}))

authRoutes.post('/auth/resend', wrap(async (req, res) => {
  const { email: address } = parse(z.object({ email }), req.body)
  const row = users.byEmail(address)
  let devCode
  if (row && !row.email_verified) {
    const otp = issueCode(address, 'verify')
    await sendMail({ to: address, subject: 'Your MyCampus verification code', text: `Your code is ${otp}. It expires in 15 minutes.` })
    if (exposeCodes()) devCode = otp
  }
  res.status(202).json({ status: 'verification_sent', ...(devCode && { devCode }) })
}))

authRoutes.post('/auth/forgot', wrap(async (req, res) => {
  const { email: address } = parse(z.object({ email }), req.body)
  const row = users.byEmail(address)
  let devCode
  if (row && row.status === 'active') {
    const otp = issueCode(address, 'reset')
    await sendMail({ to: address, subject: 'Reset your MyCampus password', text: `Your password reset code is ${otp}. It expires in 15 minutes. If you didn't ask for this, ignore this email.` })
    if (exposeCodes()) devCode = otp
  }
  res.status(202).json({ status: 'reset_sent', message: 'If that email has an account, we sent a reset code.', ...(devCode && { devCode }) })
}))

authRoutes.post('/auth/reset', wrap(async (req, res) => {
  const { email: address, code: otp, password } = parse(z.object({ email, code, password: z.string().max(128) }), req.body)
  const problem = passwordProblem(password, address)
  if (problem) throw new HttpError(400, problem)
  const row = users.byEmail(address)
  if (!row || !consumeCode(address, 'reset', otp)) throw new HttpError(400, 'That code is wrong or has expired.')
  // Bumping token_version signs the account out everywhere. Receiving the code also proves the address is theirs.
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1, email_verified = 1 WHERE id = ?').run(await hashPassword(password), row.id)
  loginLimiter.clear(`${address}|${req.ip}`)
  audit(row, 'auth.password_reset', row.id)
  res.status(204).end()
}))

authRoutes.post('/me/password', requireAuth, wrap(async (req, res) => {
  const { current, next } = parse(z.object({ current: z.string().max(128), next: z.string().max(128) }), req.body)
  if (!(await verifyPassword(current, req.user.password_hash))) throw new HttpError(400, 'Your current password is incorrect.')
  const problem = passwordProblem(next, req.user.email)
  if (problem) throw new HttpError(400, problem)
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(await hashPassword(next), req.user.id)
  audit(req.user, 'auth.password_change', req.user.id)
  // Everything signed in before now is revoked, including this session, so hand back a fresh token.
  res.json({ token: signToken(users.byId(req.user.id)) })
}))

// Sign out everywhere.
authRoutes.post('/me/logout-all', requireAuth, wrap(async (req, res) => {
  db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.user.id)
  res.status(204).end()
}))
