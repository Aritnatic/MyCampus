import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bell,
  User,
  LogOut,
  Settings,
  Shield,
  Share2,
  Upload,
  Search,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getNoticesByUniversity } from '../../data/notices'
import { getEventsByUniversity, getPendingEvents } from '../../data/events'
import { getExamsByUniversity, getResultsByUniversity } from '../../data/exams'
import { getJobsByUniversity } from '../../data/placements'
import { formatRelative } from '../../utils/format'
import { tokens, radius } from '../../theme'
import { useToast } from '../feedback/Toast'

const NOTIF_META = {
  notice: { route: '/admin/notices-events?tab=notices' },
  event:  { route: '/admin/notices-events?tab=events&status=pending' },
  exam:   { route: '/admin/exams-results?tab=exams&status=draft' },
  result: { route: '/admin/exams-results?tab=results&status=pending' },
  job:    { route: '/admin/placements?status=draft' },
}

const NOTIF_TINT = {
  notice: { bg: tokens.blueSoft,   text: tokens.blueText },
  event:  { bg: tokens.yellowSoft, text: tokens.yellowText },
  exam:   { bg: tokens.violetSoft, text: tokens.violetText },
  result: { bg: tokens.greenSoft,  text: tokens.greenText },
  job:    { bg: tokens.greenSoft,  text: tokens.greenText },
}

// Map current path to a friendly page title + breadcrumb segments.
const PAGE_TITLES = {
  '/admin/dashboard':     { title: 'Dashboard', breadcrumb: ['Admin', 'Dashboard'] },
  '/admin/students':      { title: 'Students',  breadcrumb: ['Admin', 'Students'] },
  '/admin/notices-events':{ title: 'Notices & Events', breadcrumb: ['Admin', 'Notices & Events'] },
  '/admin/exams-results': { title: 'Exams & Results', breadcrumb: ['Admin', 'Exams & Results'] },
  '/admin/placements':    { title: 'Placements', breadcrumb: ['Admin', 'Placements'] },
  '/admin/settings':      { title: 'Settings', breadcrumb: ['Admin', 'Settings'] },
}

function buildNotifications(admin) {
  if (!admin) return []
  const uni = admin.university
  const items = []
  getNoticesByUniversity(uni).filter(n => n.status === 'draft').forEach(n => items.push({
    id: `n-${n.id}`, type: 'notice', title: `Draft: ${n.title}`, meta: 'Awaiting publish', timestamp: n.publishedAt || n.expiresAt,
  }))
  getPendingEvents(uni).forEach(e => items.push({
    id: `e-${e.id}`, type: 'event', title: `Review: ${e.title}`, meta: `Event ${e.approvalStatus}`, timestamp: e.submittedAt,
  }))
  getExamsByUniversity(uni).filter(x => x.status === 'draft').forEach(x => items.push({
    id: `x-${x.id}`, type: 'exam', title: `Schedule: ${x.title}`, meta: 'Exam in draft', timestamp: x.createdAt,
  }))
  getResultsByUniversity(uni).filter(r => r.status === 'pending' || r.status === 'uploaded').forEach(r => items.push({
    id: `r-${r.id}`, type: 'result', title: `Publish: ${r.branch} ${r.semester} Sem`, meta: `Result ${r.status}`, timestamp: r.uploadedAt || null,
  }))
  getJobsByUniversity(uni).filter(j => j.status === 'draft').forEach(j => items.push({
    id: `j-${j.id}`, type: 'job', title: `Post: ${j.title} — ${j.company}`, meta: 'Job in draft', timestamp: j.postedAt,
  }))
  return items.filter(i => i.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8)
}

const READ_KEY = 'mycampus_admin_notifications_read'
const readSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')) } catch { return new Set() } }
const writeSeen = (s) => { try { localStorage.setItem(READ_KEY, JSON.stringify([...s])) } catch {} }

export function AdminHeader() {
  const { admin, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [seenIds, setSeenIds] = useState(() => readSeen())

  const notificationsRef = useRef(null)
  const userMenuRef = useRef(null)

  const notifications = useMemo(() => buildNotifications(admin), [admin])
  const unreadCount = notifications.filter(n => !seenIds.has(n.id)).length

  // Match base path (strip query)
  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 2).join('/')
  const meta = PAGE_TITLES[basePath] || { title: 'Admin', breadcrumb: ['Admin'] }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { setNotificationsOpen(false); setUserMenuOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClick(e) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function markAllRead() {
    const next = new Set(seenIds)
    notifications.forEach(n => next.add(n.id))
    setSeenIds(next)
    writeSeen(next)
  }

  function openNotification(n) {
    const next = new Set(seenIds)
    next.add(n.id)
    setSeenIds(next)
    writeSeen(next)
    setNotificationsOpen(false)
    navigate(NOTIF_META[n.type].route)
  }

  const initial = (admin?.name || 'A').charAt(0).toUpperCase()

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 lg:px-6"
      style={{ background: tokens.surface, borderBottom: `1px solid ${tokens.hairline}` }}
    >
      {/* Breadcrumb only — no title, no icon */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <nav className="flex items-center gap-1.5 text-[12px]" style={{ color: tokens.inkFaint }} aria-label="Breadcrumb">
          {meta.breadcrumb.map((seg, i) => (
            <React.Fragment key={seg}>
              {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: tokens.inkFaint }} aria-hidden="true" />}
              <span
                className="truncate"
                style={{ color: i === meta.breadcrumb.length - 1 ? tokens.inkSoft : tokens.inkFaint }}
              >
                {seg}
              </span>
            </React.Fragment>
          ))}
          <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: tokens.inkFaint }} aria-hidden="true" />
          <span className="truncate text-[12px]" style={{ color: tokens.inkSoft }}>
            admin/dashboard
          </span>
        </nav>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div
          className="flex items-center gap-2 px-2.5 h-9"
          style={{ background: tokens.canvas, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tokens.inkFaint }} />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && globalSearch.trim()) {
                const q = globalSearch.trim().toLowerCase()
                // Route to the most likely page based on the query.
                if (q.includes('student') || q.includes('cgpa')) navigate('/admin/students')
                else if (q.includes('notice') || q.includes('event')) navigate('/admin/notices-events')
                else if (q.includes('exam') || q.includes('result')) navigate('/admin/exams-results')
                else if (q.includes('job') || q.includes('placement') || q.includes('company')) navigate('/admin/placements')
                else if (q.includes('admin') || q.includes('user') || q.includes('role') || q.includes('setting')) navigate('/admin/settings')
                else { toast.info(`No quick match for "${globalSearch}". Try students / notices / exams / placements.`, { title: 'Search' }); return }
                toast.success(`Opening results for "${globalSearch}".`, { title: 'Search' })
              }
            }}
            placeholder="Search across admin…"
            className="flex-1 min-w-0 bg-transparent text-[13px] outline-none"
            style={{ color: tokens.ink }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5"
            style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, color: tokens.inkFaint, borderRadius: 4 }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">
        {/* Share (secondary CTA) — copies current page URL to clipboard */}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              toast.success('Link copied to clipboard.', { title: 'Copied' })
            } catch {
              toast.warning('Could not copy. Long-press the URL bar to share.', { title: 'Copy failed' })
            }
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 text-[13px] font-medium smooth smooth-press hover:bg-white/5"
          style={{ color: tokens.ink, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button }}
        >
          <Share2 className="w-3.5 h-3.5" style={{ color: tokens.inkSoft }} />
          Share
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(o => !o)}
            className="relative w-9 h-9 flex items-center justify-center smooth smooth-press hover:bg-white/5"
            style={{ color: tokens.inkSoft, borderRadius: radius.button }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 text-[9px] font-semibold flex items-center justify-center"
                style={{ background: tokens.accent, color: tokens.accentInk, borderRadius: 999, fontVariantNumeric: 'tabular-nums' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 overflow-hidden z-50"
              style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.container }}
            >
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${tokens.hairline}` }}>
                <h3 className="text-xs font-semibold" style={{ color: tokens.ink }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="text-[11px] font-medium" style={{ color: tokens.accent }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs" style={{ color: tokens.inkSoft }}>You&rsquo;re all caught up.</p>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !seenIds.has(n.id)
                    const tint = NOTIF_TINT[n.type]
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openNotification(n)}
                        className="w-full px-3 py-2.5 text-left smooth smooth-press hover:bg-white/5"
                        style={{ borderBottom: `1px solid ${tokens.hairline2}` }}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className="w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0"
                            style={{ background: isUnread ? tokens.accent : 'transparent' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`text-[13px] ${isUnread ? 'font-medium' : ''} truncate`} style={{ color: tokens.ink }}>{n.title}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: tokens.inkSoft }}>{n.meta} · {formatRelative(n.timestamp)}</div>
                          </div>
                          <span
                            className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
                            style={{ background: tint.bg, color: tint.text, borderRadius: radius.chip }}
                          >
                            {n.type}
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + menu — removed per request */}
      </div>
    </header>
  )
}
