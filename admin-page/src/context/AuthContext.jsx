import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { adminUsers } from '../data/admin'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mycampus_admin_auth')
    if (stored) {
      try {
        const { adminId, timestamp } = JSON.parse(stored)
        // Check if session is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          const foundAdmin = adminUsers.find(a => a.id === adminId)
          if (foundAdmin && foundAdmin.status === 'active') {
            setAdmin(foundAdmin)
          } else {
            localStorage.removeItem('mycampus_admin_auth')
          }
        } else {
          localStorage.removeItem('mycampus_admin_auth')
        }
      } catch (e) {
        localStorage.removeItem('mycampus_admin_auth')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    setLoading(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Find admin by email (university email)
    const foundAdmin = adminUsers.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.status === 'active'
    )

    if (!foundAdmin) {
      setError('No admin account found with this email address')
      setLoading(false)
      return { success: false, error: 'No admin account found with this email address' }
    }

    // In real app, verify password with backend
    // For demo: accept any non-empty password for valid admins
    if (!password || password.trim().length === 0) {
      setError('Please enter your password')
      setLoading(false)
      return { success: false, error: 'Please enter your password' }
    }

    // Store auth in localStorage
    localStorage.setItem('mycampus_admin_auth', JSON.stringify({
      adminId: foundAdmin.id,
      timestamp: Date.now(),
    }))

    setAdmin(foundAdmin)
    setLoading(false)
    return { success: true, admin: foundAdmin }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mycampus_admin_auth')
    setAdmin(null)
  }, [])

  const hasPermission = useCallback((permission) => {
    return admin?.permissions?.includes(permission) ?? false
  }, [admin])

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!admin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}