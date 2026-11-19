// Thin client for the MyCampus API (backend/). Base URL via VITE_API_URL.
const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '')

let token = null
let onUnauthorized = () => {}

export const setToken = (t) => { token = t }
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Can't reach the MyCampus server. Is the API running?", 0)
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    // A 401 while holding a token means the session ended (login itself 401s on bad credentials, with no token yet).
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(json?.error ?? 'Something went wrong.', res.status)
  }
  return json
}

// Sends a file as the raw request body (logo uploads). Same error handling as request().
export async function upload(path, file, { method = 'PUT' } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers: { 'Content-Type': file.type, ...(token && { Authorization: `Bearer ${token}` }) }, body: file })
  } catch {
    throw new ApiError("Can't reach the MyCampus server. Is the API running?", 0)
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(json?.error ?? 'Upload failed.', res.status)
  }
  return json
}

// Absolute URL for a server path such as a college logo ("/api/colleges/cvrp/logo?v=…").
export const assetUrl = (path) => (path ? `${BASE.replace(/\/api$/, '')}${path}` : null)
