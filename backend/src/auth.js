import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { db, users } from './db.js'
import { HttpError } from './http.js'

// scrypt runs on libuv's thread pool, so hashing doesn't freeze the server for every other request
// (the synchronous version stalled everything for ~50ms per sign-in).
const scryptAsync = promisify(scrypt)

export async function hashPassword(password) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${(await scryptAsync(password, salt, 64)).toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt') return false
  const expected = Buffer.from(hash, 'hex')
  const actual = await scryptAsync(password, Buffer.from(salt, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}

// Compared against when an email doesn't exist, so "no such account" costs the same time as "wrong password"
// and sign-in can't be used to discover who has an account.
const DUMMY_HASH = await hashPassword(randomBytes(12).toString('hex'))
export const burnPasswordCheck = (password) => verifyPassword(password, DUMMY_HASH)

const COMMON = new Set(['password', '12345678', '123456789', 'qwertyuiop', 'iloveyou', 'password1', 'admin123', 'welcome1'])
// Returns a problem description, or null when the password is acceptable.
export function passwordProblem(password, email = '') {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 128) return 'Password is too long.'
  if (COMMON.has(password.toLowerCase())) return 'That password is too common.'
  const local = email.split('@')[0]?.toLowerCase()
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) return "Password can't contain your email name."
  return null
}

// `tv` is the user's token_version: bumping it (password change/reset) revokes every older token.
export const signToken = (user) => jwt.sign({ sub: user.id, tv: user.token_version }, config.jwtSecret, { expiresIn: config.tokenTtl })

function authenticate(req) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'Sign in required.')
  let claims
  try {
    claims = jwt.verify(token, config.jwtSecret)
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.')
  }
  // Re-read the user each request so suspending an account or changing the password takes effect immediately.
  const row = users.byId(claims.sub)
  if (!row || row.status !== 'active' || !row.email_verified || row.token_version !== claims.tv) {
    throw new HttpError(401, 'Session expired. Please sign in again.')
  }
  return row
}

export function requireAuth(req, res, next) {
  try {
    req.user = authenticate(req)
    next()
  } catch (err) {
    next(err)
  }
}

// Admin check: superadmins hold every permission; others need it listed on their account.
export function adminPermissions(row) {
  if (row.role !== 'admin') return []
  const p = users.profile(row)
  return p.adminRole === 'superadmin' ? ['*'] : p.permissions ?? []
}
export const hasPermission = (row, perm) => {
  const perms = adminPermissions(row)
  return perms.includes('*') || perms.includes(perm)
}
export const requirePermission = (perm) => (req, res, next) =>
  hasPermission(req.user, perm) ? next() : next(new HttpError(403, "You don't have permission to do that."))

// Throttle for sensitive attempts: `max` failures per key per window.
export function makeLimiter(max, windowMs) {
  const attempts = new Map()
  return {
    blocked(key) {
      const hits = (attempts.get(key) ?? []).filter((t) => Date.now() - t < windowMs)
      attempts.set(key, hits)
      return hits.length >= max
    },
    fail: (key) => attempts.set(key, [...(attempts.get(key) ?? []), Date.now()]),
    clear: (key) => attempts.delete(key),
  }
}
export const loginLimiter = makeLimiter(8, 15 * 60 * 1000)

// ---- one-time email codes (verification + password reset) ----
const hashCode = (email, purpose, code) => createHash('sha256').update(`${email.toLowerCase()}|${purpose}|${code}`).digest('hex')

export function issueCode(email, purpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  db.prepare('DELETE FROM email_codes WHERE email = ? AND purpose = ?').run(email, purpose)
  db.prepare('INSERT INTO email_codes (email, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?)')
    .run(email, purpose, hashCode(email, purpose, code), Date.now() + 15 * 60 * 1000)
  return code
}

// True and consumes the code if it's valid; wrong guesses count against a 5-attempt cap.
export function consumeCode(email, purpose, code) {
  const row = db.prepare('SELECT * FROM email_codes WHERE email = ? AND purpose = ?').get(email, purpose)
  if (!row || row.expires_at < Date.now() || row.attempts >= 5) return false
  const ok = timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(hashCode(email, purpose, code)))
  if (!ok) {
    db.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id)
    return false
  }
  db.prepare('DELETE FROM email_codes WHERE id = ?').run(row.id)
  return true
}
