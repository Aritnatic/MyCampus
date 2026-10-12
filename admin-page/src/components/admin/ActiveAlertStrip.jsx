import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAdminApi } from '../../hooks/useAdminApi'

// Appears on the dashboard while any safety alert is live, so it can't be missed from the landing page.
export default function ActiveAlertStrip() {
  const { hasPermission } = useAuth()
  const alerts = useAdminApi(hasPermission('safety') ? '/admin/alerts' : null, { pollMs: 15000 })
  const live = (alerts.data ?? []).filter((a) => a.status === 'active')
  if (live.length === 0) return null
  return (
    <Link to="/admin/alerts" role="alert" className="flex items-center gap-3 px-4 py-3 text-sm font-medium" style={{ background: '#7f1d1d', color: '#fecaca', borderRadius: 12 }}>
      <ShieldAlert className="w-5 h-5 flex-shrink-0" aria-hidden />
      <span className="flex-1">{live.length === 1 ? `Safety alert live: ${live[0].title}` : `${live.length} safety alerts are live`}</span>
      <span className="underline">Open console</span>
    </Link>
  )
}
