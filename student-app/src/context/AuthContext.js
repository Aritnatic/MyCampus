import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { request, setToken, setUnauthorizedHandler } from '../api'
import { unregisterPush } from '../push'
import { secureStorage } from '../storage'

const KEY = 'mycampus.token'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const clear = useCallback(async () => {
    setToken(null)
    setUser(null)
    await secureStorage.remove(KEY)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clear)
    ;(async () => {
      try {
        const saved = await secureStorage.get(KEY)
        if (saved) {
          setToken(saved)
          setUser(await request('/me'))
        }
      } catch (e) {
        // Offline at launch: keep the token and retry later. Anything else means the session is gone.
        if (e.status !== 0) await clear()
      } finally {
        setReady(true)
      }
    })()
  }, [clear])

  const startSession = useCallback(async ({ token, user: me }) => {
    await secureStorage.set(KEY, token)
    setToken(token)
    setUser(me)
  }, [])

  // Each action returns { error } so screens can show the message inline.
  const run = (fn) => async (...args) => {
    try {
      return { ...(await fn(...args)), error: null }
    } catch (e) {
      return { error: e.message }
    }
  }

  const actions = useMemo(() => ({
    signIn: run(async (email, password) => {
      await startSession(await request('/auth/login', { method: 'POST', body: { email: email.trim(), password } }))
      return {}
    }),
    // → { devCode? } (the code is only ever returned by development servers)
    register: run(async (fields) => (await request('/auth/register', { method: 'POST', body: { ...fields, email: fields.email.trim() } })) ?? {}),
    verify: run(async (email, code) => {
      await startSession(await request('/auth/verify', { method: 'POST', body: { email: email.trim(), code: code.trim() } }))
      return {}
    }),
    resend: run(async (email) => (await request('/auth/resend', { method: 'POST', body: { email: email.trim() } })) ?? {}),
    forgot: run(async (email) => (await request('/auth/forgot', { method: 'POST', body: { email: email.trim() } })) ?? {}),
    reset: run(async (email, code, password) => {
      await request('/auth/reset', { method: 'POST', body: { email: email.trim(), code: code.trim(), password } })
      return {}
    }),
    // Saves profile edits and updates the signed-in user with the server's version.
    updateProfile: run(async (patch) => {
      const me = await request('/me', { method: 'PATCH', body: patch })
      setUser(me)
      return { user: me }
    }),
    refresh: run(async () => { setUser(await request('/me')); return {} }),
    // The server revokes every older session when the password changes and returns a fresh token for this one.
    changePassword: run(async (current, next) => {
      const { token } = await request('/me/password', { method: 'POST', body: { current, next } })
      await secureStorage.set(KEY, token)
      setToken(token)
      return {}
    }),
    deleteAccount: run(async (password) => {
      await request('/me', { method: 'DELETE', body: { password } })
      await clear() // the account no longer exists, so end this session: the app returns to the sign-in screen
      return {}
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [startSession, clear])

  // Detach this phone from the account while the token is still valid, then clear the session.
  const signOut = useCallback(async () => {
    await unregisterPush()
    await clear()
  }, [clear])

  const value = useMemo(() => ({ user, ready, ...actions, signOut }), [user, ready, actions, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
