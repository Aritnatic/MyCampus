import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { request, setToken as setApiToken, setUnauthorizedHandler } from '../api'
import { clearRemoteLists } from '../data/store'

const AuthContext = createContext(null)
const STORAGE_KEY = 'mycampus_auth'

// The API returns role 'admin' | 'student' | 'individual'. The panel's UI speaks in
// "modes" (admin / university / individual) and uses `role` for the admin's job title.
function toUser(u) {
  const mode = u.role === 'admin' ? 'admin' : u.role === 'student' ? 'university' : 'individual'
  return { ...u, mode, role: u.adminRole ?? u.role }
}

function savedToken() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))?.token ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const endSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiToken(null)
    clearRemoteLists()
    setUser(null)
    setToken(null)
  }, [])

  // Resume a saved session by asking the server who the token belongs to.
  useEffect(() => {
    setUnauthorizedHandler(endSession)
    const saved = savedToken()
    if (!saved) {
      setLoading(false)
      return
    }
    setApiToken(saved)
    request('/me')
      .then((me) => {
        setUser(toUser(me))
        setToken(saved)
      })
      .catch((err) => {
        // Only a rejected token ends the session; if the server is just unreachable, show login without discarding it.
        if (err.status === 401) endSession()
        else setApiToken(null)
      })
      .finally(() => setLoading(false))
  }, [endSession])

  const login = useCallback(async (email, password, mode) => {
    setError(null)
    if (!email || !password) {
      const msg = 'Please enter both email and password.'
      setError(msg)
      return { success: false, error: msg }
    }
    if (!email.includes('@')) {
      const msg = 'Please enter a valid email address.'
      setError(msg)
      return { success: false, error: msg }
    }

    let session
    try {
      session = await request('/auth/login', { method: 'POST', body: { email: email.trim(), password } })
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }

    const found = toUser(session.user)
    if (mode && found.mode !== mode) {
      const msg = `This email is registered as a ${found.mode} account. Switch the login mode or use the correct account.`
      setError(msg)
      return { success: false, error: msg }
    }

    setApiToken(session.token)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: session.token }))
    } catch { /* ignore quota errors in private mode */ }

    setUser(found)
    setToken(session.token)
    return { success: true, user: found, token: session.token }
  }, [])

  // After a password change the server revokes every older token and hands back a fresh one.
  const adoptToken = useCallback((fresh) => {
    setApiToken(fresh)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: fresh })) } catch { /* private mode */ }
    setToken(fresh)
  }, [])

  const logout = useCallback(() => {
    endSession()
    setError(null)
  }, [endSession])

  const hasPermission = useCallback((permission) => {
    if (!user) return false
    if (user.mode !== 'admin') return false
    if (user.role === 'superadmin') return true // same rule as the server: superadmins hold every permission
    return user.permissions?.includes(permission) ?? false
  }, [user])

  const value = {
    // Back-compat — the rest of the app reads `admin`. We expose a unified `user`
    // and keep `admin` pointing at it when mode is 'admin', so existing pages work.
    user,
    token,
    loading,
    error,
    login,
    logout,
    adoptToken,
    hasPermission,
    isAuthenticated: !!user,
    mode: user?.mode || null,
    // Legacy alias — many files still read `admin`.
    admin: user?.mode === 'admin' ? user : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

