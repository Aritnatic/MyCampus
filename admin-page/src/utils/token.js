// Mock token utility — produces and parses tokens in the JWT shape
// (header.payload.signature) so the rest of the app can treat them like real JWTs.
// The signature is a deterministic mock (NOT a real HMAC) — the demo runs without
// a backend, but the shape and claims match what a real token would have.
//
// When you wire a real backend, replace signMockToken / parseToken with calls to it.

const b64UrlEncode = (obj) => {
  const json = JSON.stringify(obj)
  return btoa(json).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

const b64UrlDecode = (str) => {
  const pad = '='.repeat((4 - (str.length % 4)) % 4)
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(b64))
}

// Tiny deterministic 32-bit hash, used only to give the signature a stable shape.
function mockSign(input) {
  let h1 = 0xdeadbeef ^ input.length
  let h2 = 0x41c6ce57 ^ input.length
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')
}

export function signMockToken({ id, mode, university, role, ownerId, scope = 'session', product = 'MyCampus' }) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    id,
    mode,                 // 'individual' | 'university' | 'admin'
    university: university || null,
    role: role || null,
    scope,
    product,
    ownerId: ownerId || id,
    iat: now,
    exp: now + 24 * 60 * 60, // 24h
  }
  const headerEnc = b64UrlEncode(header)
  const payloadEnc = b64UrlEncode(payload)
  const signature = mockSign(`${headerEnc}.${payloadEnc}`)
  return `${headerEnc}.${payloadEnc}.${signature}`
}

export function parseToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const header = b64UrlDecode(parts[0])
    const payload = b64UrlDecode(parts[1])
    if (header.typ !== 'JWT') return null
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function isTokenValid(token) {
  return parseToken(token) !== null
}
