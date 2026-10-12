import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ActiveAlertStrip from '../../components/admin/ActiveAlertStrip'
import {
  getRecentActivity,
  getPendingItems,
  getDashboardStats,
} from '../../data/admin'
import { useStoreRevision } from '../../data/store'
import { formatRelative } from '../../utils/format'
import { tokens, radius } from '../../theme'
import { SectionCard, StatusPill } from '../../components/admin/PageChrome'
import {
  FileText,
  Calendar,
  BookOpen,
  Briefcase,
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  Inbox,
  GraduationCap,
  Search,
  Sparkles,
  MousePointerClick,
} from 'lucide-react'
import { motion } from 'framer-motion'

const TYPE_META = {
  notice:   { icon: FileText,   tint: tokens.blueText,   bg: tokens.blueSoft,   label: 'Notice' },
  event:    { icon: Calendar,   tint: tokens.yellowText, bg: tokens.yellowSoft, label: 'Event' },
  exam:     { icon: BookOpen,   tint: tokens.violetText, bg: tokens.violetSoft, label: 'Exam' },
  result:   { icon: GraduationCap, tint: tokens.greenText,  bg: tokens.greenSoft,  label: 'Result' },
  job:      { icon: Briefcase,  tint: tokens.greenText,  bg: tokens.greenSoft,  label: 'Job' },
}

function pathFor(type) {
  if (!type) return null
  if (type.startsWith('notice')) return '/admin/notices-events?tab=notices'
  if (type.startsWith('event'))  return '/admin/notices-events?tab=events'
  if (type.startsWith('exam'))   return '/admin/exams-results?tab=exams'
  if (type.startsWith('result')) return '/admin/exams-results?tab=results'
  if (type.startsWith('job'))    return '/admin/placements'
  return null
}

const PENDING_META = {
  notices:    { label: 'notice drafts',      singular: 'notice draft',      path: '/admin/notices-events?tab=notices&status=draft' },
  events:     { label: 'events to review',   singular: 'event to review',   path: '/admin/notices-events?tab=events&status=pending' },
  exams:      { label: 'exams to schedule',  singular: 'exam to schedule',  path: '/admin/exams-results?tab=exams&status=draft' },
  results:    { label: 'results to publish', singular: 'result to publish', path: '/admin/exams-results?tab=results&status=pending' },
  placements: { label: 'job drafts',         singular: 'job draft',         path: '/admin/placements?status=draft' },
}

export default function AdminDashboard() {
  const { admin, loading: authLoading } = useAuth()
  useStoreRevision() // re-render when server data syncs in or a failed write rolls back
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [hoveredCard, setHoveredCard] = useState(null) // 'inbox' | 'recents' | null
  const [popVisible, setPopVisible] = useState(null) // mirrors hoveredCard during the brief pop window

  if (authLoading) {
    return (
      <div className="p-8 space-y-3" aria-busy="true">
        <div className="h-7 w-64 rounded bg-white/5 animate-pulse" />
        <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
      </div>
    )
  }

// Hover-pop scroll hint: fades in when the parent card is hovered,
// then fades out ~3s later so it doesn't stay pinned.
// Uses the Apple soft-spring ease for that "buttery" feel.
function ScrollHint({ visible, label = 'Scroll' }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium pointer-events-none"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        color: tokens.inkSoft,
        borderRadius: radius.chip,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.96)',
        transition: 'opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: visible ? '0 4px 16px rgba(0, 0, 0, 0.25)' : 'none',
      }}
    >
      <MousePointerClick className="w-3 h-3" style={{ color: tokens.accent }} />
      {label}
    </span>
  )
}
  if (!admin) return <div className="p-8" style={{ color: tokens.inkSoft }}>No admin data. Please sign in again.</div>

  const uni = admin.university
  const recent = getRecentActivity(uni, 12)
  const pending = getPendingItems(uni)

  // Discovery-pop auto-dismiss: when hoveredCard changes, show the pop for ~1.4s
  // then hide it, even if the mouse is still over the card. Leaving the card
  // hides it immediately. Re-entering re-triggers the cycle.
  React.useEffect(() => {
    if (!hoveredCard) {
      setPopVisible(null)
      return
    }
    setPopVisible(hoveredCard)
    const t = setTimeout(() => setPopVisible(null), 3000)
    return () => clearTimeout(t)
  }, [hoveredCard])

  // Inbox rows (sorted by count desc, with empty-state when nothing needs attention)
  const inbox = useMemo(() => {
    const rows = Object.entries(pending)
      .filter(([, c]) => c > 0)
      .map(([kind, count]) => ({ kind, count, ...PENDING_META[kind] }))
      .sort((a, b) => b.count - a.count)
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter(r => r.label.toLowerCase().includes(q) || r.kind.includes(q))
  }, [pending, query])
  const totalPending = inbox.reduce((s, r) => s + r.count, 0)

  // Recents: real activity, remapped to table shape with type icon + pill + path
  const rows = useMemo(() => {
    const filtered = query.trim()
      ? recent.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || (r.actor || '').toLowerCase().includes(query.toLowerCase()))
      : recent
    return filtered.map(r => {
      const key = (r.type || '').split('_')[0]
      const meta = TYPE_META[key] || { icon: FileText, tint: tokens.inkSoft, bg: tokens.sunken, label: key }
      return {
        ...r,
        kind: key,
        icon: meta.icon,
        tint: meta.tint,
        bg: meta.bg,
        kindLabel: meta.label,
        path: pathFor(r.type),
      }
    })
  }, [recent, query])

  // Stats — large primary numbers + weekly delta, used in the By area card
  const stats = getDashboardStats(uni)
  const STATS = [
    { key: 'notices',    label: 'Published notices', value: stats.publishedNotices, week: stats.newThisWeek.notices, color: tokens.blue,   path: '/admin/notices-events?tab=notices' },
    { key: 'events',     label: 'Upcoming events',   value: stats.upcomingEvents,   week: stats.newThisWeek.events,  color: tokens.yellow, path: '/admin/notices-events?tab=events' },
    { key: 'exams',      label: 'Scheduled exams',   value: stats.scheduledExams,   week: stats.newThisWeek.exams,   color: tokens.violet, path: '/admin/exams-results?tab=exams' },
    { key: 'placements', label: 'Active jobs',       value: stats.activeJobPostings, week: stats.newThisWeek.jobs,    color: tokens.green,  path: '/admin/placements' },
  ]

  // Quick actions — five high-frequency admin tasks
  const QUICK_ACTIONS = [
    { icon: FileText,      title: 'Post a notice',     desc: 'Publish an announcement to the whole university.', path: '/admin/notices-events?compose=notice' },
    { icon: Calendar,      title: 'Schedule an event', desc: 'Add a workshop, fest, or training session.',       path: '/admin/notices-events?compose=event' },
    { icon: BookOpen,      title: 'Schedule an exam',  desc: 'Set the date, time, and venue for an exam.',       path: '/admin/exams-results?tab=exams&compose=exam' },
    { icon: GraduationCap, title: 'Publish results',   desc: 'Upload branch/semester results for students.',     path: '/admin/exams-results?tab=results&compose=result' },
    { icon: Briefcase,     title: 'Post a placement',  desc: 'List a new job or internship opportunity.',        path: '/admin/placements?compose=job' },
  ]

  return (
    <div className="h-full flex flex-col min-h-0 gap-3 px-6 lg:px-8 py-5">
      <ActiveAlertStrip />
      {/* ───────── INBOX (constrained, internal scroll) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.64, delay: 0, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-0 max-h-[200px]"
      >
        <SectionCard
          padded={false}
          className="flex flex-col min-h-0 max-h-[200px]"
          data-enter-region="inbox"
          onMouseEnter={() => setHoveredCard('inbox')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <header
            className="flex items-center justify-between gap-3 px-4 h-10 flex-shrink-0"
            style={{ borderBottom: `1px solid ${tokens.hairline}` }}
          >
          <div className="flex items-center gap-2 min-w-0">
            <Inbox className="w-3.5 h-3.5" style={{ color: tokens.inkSoft }} />
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: tokens.ink }}>
              Inbox
            </h2>
            {totalPending > 0 && (
              <span
                className="px-1.5 py-px text-[10px] font-semibold"
                style={{ background: tokens.violetSoft, color: tokens.violetText, borderRadius: radius.chip, fontVariantNumeric: 'tabular-nums' }}
              >
                {totalPending} need attention
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ScrollHint visible={popVisible === 'inbox'} label="Scroll" />
            <div
              className="hidden sm:flex items-center gap-2 px-2.5 h-8"
              style={{ background: tokens.canvas, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: tokens.inkFaint }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter inbox"
                className="bg-transparent text-[12px] outline-none w-40"
                style={{ color: tokens.ink }}
              />
            </div>
          </div>
        </header>

        {inbox.length === 0 ? (
          <div className="px-6 py-6 text-center">
            <div
              className="w-10 h-10 mx-auto mb-2 flex items-center justify-center"
              style={{ background: tokens.violetSoft, color: tokens.accent, borderRadius: 999 }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: tokens.ink }}>You&rsquo;re all caught up</p>
            <p className="text-[12px] mt-1 max-w-sm mx-auto" style={{ color: tokens.inkSoft }}>
              New submissions and drafts will show up here. Nothing needs you right now.
            </p>
          </div>
        ) : (
          <ul className="flex-1 min-h-0 overflow-y-auto admin-scrollbar-dark">
            {inbox.map((row, i) => (
              <li
                key={row.kind}
                className="smooth flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02]"
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}
              >
                <span
                  className="text-[15px] font-semibold tabular-nums"
                  style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}
                >
                  {row.count}
                </span>
                <span className="text-[12px] flex-1 truncate" style={{ color: tokens.inkSoft }}>
                  {row.count === 1 ? row.singular : row.label}
                </span>
                <StatusPill kind={row.kind === 'events' || row.kind === 'results' ? 'pending' : 'draft'}>
                  {row.kind}
                </StatusPill>
                  <button
                    type="button"
                    onClick={() => navigate(row.path)}
                    className="smooth smooth-press inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium hover:bg-white/5"
                    style={{ color: tokens.ink, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button }}
                  >
                    Review
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
              </li>
            ))}
          </ul>
        )}
        </SectionCard>
      </motion.div>

      {/* ───────── STATS + QUICK ACTIONS (compact, no internal scroll) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.64, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-shrink-0"
        data-enter-region="stats"
      >
        {/* By area — 2x2 grid: 4 equal sections, two on top, two on bottom */}
        <SectionCard padded={false}>
          <div
            className="grid grid-cols-2 grid-rows-2 h-full"
            style={{ borderRight: `1px solid ${tokens.hairline}` }}
          >
            {STATS.map((row, i) => (
              <button
                key={row.key}
                type="button"
                onClick={() => navigate(row.path)}
                className="smooth smooth-press text-left px-5 py-4 flex flex-col gap-1.5 min-w-0 hover:bg-white/[0.02]"
                style={{
                  borderRight: (i % 2 === 0) ? `1px solid ${tokens.hairline2}` : 'none',
                  borderBottom: (i < 2) ? `1px solid ${tokens.hairline2}` : 'none',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: row.color }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] uppercase tracking-wider font-medium truncate" style={{ color: tokens.inkFaint }}>
                    {row.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-semibold tracking-tight tabular-nums leading-none"
                    style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {row.value}
                  </span>
                  <span className="text-[10px]" style={{ color: tokens.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
                    +{row.week} wk
                  </span>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Quick actions — narrow, no internal scroll, 5 compact items */}
        <SectionCard padded={false}>
          <ul>
            {QUICK_ACTIONS.map((q, i) => {
              const Icon = q.icon
              return (
                <li
                  key={q.title}
                  style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(q.path)}
                    title={q.title}
                    className="smooth smooth-press w-full flex items-center gap-2 px-3 h-9 text-left hover:bg-white/[0.03]"
                  >
                    <span
                      className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                      style={{ background: tokens.sunken, color: tokens.accent, borderRadius: radius.chip }}
                      aria-hidden="true"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-medium truncate" style={{ color: tokens.ink }}>
                      {q.title}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      </motion.div>

      {/* ───────── RECENTS (flex-1, internal scroll) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.64, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-h-0 flex flex-col"
      >
        <SectionCard
          padded={false}
          className="flex-1 min-h-0 flex flex-col"
          data-enter-region="recents"
          onMouseEnter={() => setHoveredCard('recents')}
          onMouseLeave={() => setHoveredCard(null)}
        >
        <header
          className="flex items-center justify-between gap-3 px-4 h-10 flex-shrink-0"
          style={{ borderBottom: `1px solid ${tokens.hairline}` }}
        >
          <h2 className="text-[13px] font-semibold tracking-tight" style={{ color: tokens.ink }}>
            Recents
          </h2>
          <div className="flex items-center gap-2">
            <ScrollHint visible={popVisible === 'recents'} label="Scroll" />
            <span
              className="text-[10px] uppercase tracking-wider hidden sm:inline"
              style={{ color: tokens.inkFaint }}
            >
              {rows.length} item{rows.length === 1 ? '' : 's'}
            </span>
          </div>
        </header>

        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center">
            <div
              className="w-10 h-10 mx-auto mb-2 flex items-center justify-center"
              style={{ background: tokens.violetSoft, color: tokens.accent, borderRadius: 999 }}
            >
              <Inbox className="w-4 h-4" />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: tokens.ink }}>No activity yet</p>
            <p className="text-[12px] mt-1 max-w-xs mx-auto" style={{ color: tokens.inkSoft }}>
              Once your team posts notices, schedules exams, or publishes results, it&rsquo;ll show up here.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto admin-scrollbar-dark">
            <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    className="text-[10px] font-semibold uppercase tracking-wider px-4 py-2 sticky top-0"
                    style={{ color: tokens.inkFaint, background: tokens.surface, borderBottom: `1px solid ${tokens.hairline}` }}
                  >
                    Item
                  </th>
                  <th
                    className="text-[10px] font-semibold uppercase tracking-wider px-4 py-2 hidden md:table-cell sticky top-0"
                    style={{ color: tokens.inkFaint, background: tokens.surface, borderBottom: `1px solid ${tokens.hairline}` }}
                  >
                    Type
                  </th>
                  <th
                    className="text-[10px] font-semibold uppercase tracking-wider px-4 py-2 hidden lg:table-cell sticky top-0"
                    style={{ color: tokens.inkFaint, background: tokens.surface, borderBottom: `1px solid ${tokens.hairline}` }}
                  >
                    By
                  </th>
                  <th
                    className="text-[10px] font-semibold uppercase tracking-wider px-4 py-2 hidden sm:table-cell sticky top-0"
                    style={{ color: tokens.inkFaint, background: tokens.surface, borderBottom: `1px solid ${tokens.hairline}` }}
                  >
                    Last edited
                  </th>
                  <th
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-2 w-10 sticky top-0"
                    style={{ color: tokens.inkFaint, background: tokens.surface, borderBottom: `1px solid ${tokens.hairline}` }}
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const Icon = r.icon
                  return (
                    <tr
                      key={r.id}
                      onClick={() => r.path && navigate(r.path)}
                      className="smooth hover:bg-white/[0.02] cursor-pointer"
                    >
                      <td className="px-4 py-2" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                            style={{ background: r.bg, color: r.tint, borderRadius: radius.chip }}
                            aria-hidden="true"
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium truncate" style={{ color: tokens.ink }}>
                              {r.title}
                            </div>
                            <div className="text-[10px] truncate flex items-center gap-1.5" style={{ color: tokens.inkSoft }}>
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: r.status === 'completed' ? tokens.green : tokens.yellow }}
                                aria-hidden="true"
                              />
                              {r.status === 'completed' ? 'Published' : 'Awaiting review'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}>
                        <StatusPill kind={r.kind === 'result' || r.kind === 'notice' ? (r.status === 'completed' ? 'published' : 'draft') : r.kind === 'event' ? (r.status === 'completed' ? 'approved' : 'pending') : r.kind === 'exam' ? (r.status === 'completed' ? 'approved' : 'draft') : 'open'}>
                          {r.kindLabel}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}>
                        <span className="text-[12px]" style={{ color: tokens.inkSoft }}>{r.actor}</span>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}>
                        <span className="text-[12px]" style={{ color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
                          {formatRelative(r.timestamp)}
                        </span>
                      </td>
                      <td className="px-2 py-2" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); r.path && navigate(r.path) }}
                          className="smooth smooth-press w-7 h-7 inline-flex items-center justify-center hover:bg-white/5"
                          style={{ color: tokens.inkFaint, borderRadius: radius.chip }}
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        </SectionCard>
      </motion.div>
    </div>
  )
}
