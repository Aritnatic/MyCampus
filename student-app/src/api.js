import Constants from 'expo-constants'
import { Platform } from 'react-native'

const PORT = 4000

// EXPO_PUBLIC_API_URL wins (staging/production). In development the API runs on the same
// machine as Metro, so reuse the host the phone already uses to reach the dev server.
function baseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0]
  if (Platform.OS === 'web') return `http://${globalThis.location?.hostname ?? 'localhost'}:${PORT}/api`
  return `http://${devHost ?? 'localhost'}:${PORT}/api`
}

export const API_URL = baseUrl()
// The server's address without /api — where the public legal pages live.
export const SITE_URL = API_URL.replace(/\/api$/, '')

let token = null
let onUnauthorized = () => {}
export const setToken = (t) => { token = t }
export const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {})
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
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Can't reach the MyCampus server. Check your connection.", 0)
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    // A 401 on a request that carried a token means the session ended; the login call itself also 401s on bad credentials.
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(json?.error ?? 'Something went wrong.', res.status)
  }
  return json
}
