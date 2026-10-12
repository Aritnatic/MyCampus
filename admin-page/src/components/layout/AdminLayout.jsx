import React, { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AdminAppRail } from './AdminAppRail'
import { AdminHeader } from './AdminHeader'
import { useToast } from '../feedback/Toast'
import { onStoreError, syncRemoteLists } from '../../data/store'
import { tokens } from '../../theme'

// Layout: dark canvas with a sunken rail on the left and the page content
// directly to the right. No floating card chrome — pages carry their own
// 14px-radius surfaces one step lighter than the canvas.
//
// Pages read server data synchronously from a cache, so the layout loads that cache
// before rendering them, and refreshes it when the tab regains focus.
export function AdminLayout() {
  const toast = useToast()
  const [sync, setSync] = useState({ status: 'loading', error: null })

  const load = useCallback(() => {
    setSync((s) => ({ ...s, status: s.status === 'ready' ? 'ready' : 'loading' }))
    return syncRemoteLists()
      .then(() => setSync({ status: 'ready', error: null }))
      .catch((err) => setSync((s) => (s.status === 'ready' ? s : { status: 'error', error: err.message })))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => onStoreError((message) => toast.error(message, { title: 'Not saved' })), [toast])
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [load])

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: tokens.canvas, color: tokens.ink }}>
      <AdminAppRail />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {sync.status === 'ready' ? (
            <Outlet />
          ) : sync.status === 'loading' ? (
            <div className="h-full flex items-center justify-center gap-3" role="status" aria-live="polite" style={{ color: tokens.inkSoft }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading your campus data…</span>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
              <p className="text-sm" style={{ color: tokens.ink }}>{sync.error}</p>
              <button
                type="button"
                onClick={load}
                className="px-3 h-9 text-[13px] font-medium"
                style={{ color: tokens.violetText, border: `1px solid ${tokens.violet}`, borderRadius: 10 }}
              >
                Try again
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
