import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2, ShieldAlert } from 'lucide-react'

export function ProtectedRoute({ requireMode = 'admin' }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="flex items-center gap-3 text-admin-600" role="status" aria-live="polite">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (requireMode && user.mode !== requireMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50 p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-12 h-12 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-danger-600" />
          </div>
          <h1 className="text-lg font-semibold text-admin-900 mb-2">Access restricted</h1>
          <p className="text-sm text-admin-600 mb-6">
            This area is for {requireMode} accounts. You're signed in as a {user.mode} account.
          </p>
          <a href="/admin/login" className="admin-btn-primary inline-flex">Switch account</a>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
