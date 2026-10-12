import React, { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { request } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import { PageHeader, SectionCard, StatusPill } from '../../components/admin/PageChrome'
import { Button, Empty, ErrorState, Loading, timeAgo } from '../../components/admin/kit'
import { useAdminApi } from '../../hooks/useAdminApi'
import { tokens } from '../../theme'

const FILTERS = [['new', 'New'], ['seen', 'Seen'], ['done', 'Done'], ['', 'All']]
const CATEGORY = { bug: ['danger', 'Bug'], idea: ['info', 'Idea'], other: ['default', 'Other'] }

export default function FeedbackPage() {
  const { admin } = useAuth()
  const toast = useToast()
  const [filter, setFilter] = useState('new')
  const [busyId, setBusyId] = useState(null)
  const feedback = useAdminApi(admin ? `/admin/feedback${filter ? `?status=${filter}` : ''}` : null, { pollMs: 30000 })

  if (!admin) return null

  const mark = async (item, status) => {
    setBusyId(item.id)
    try {
      await request(`/admin/feedback/${item.id}`, { method: 'PATCH', body: { status } })
      feedback.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not update' })
    }
    setBusyId(null)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <PageHeader title="Feedback" subtitle="What students told you from inside the app. Work through it from New to Done." />

      <div className="flex gap-2 mt-4 mb-4" role="tablist" aria-label="Filter feedback">
        {FILTERS.map(([value, label]) => (
          <button
            key={label}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className="px-3 h-8 text-[13px] font-medium smooth"
            style={{ border: `1px solid ${filter === value ? tokens.violet : tokens.hairline}`, color: filter === value ? tokens.ink : tokens.inkSoft, background: filter === value ? tokens.sunken : 'transparent', borderRadius: 8 }}
          >{label}</button>
        ))}
      </div>

      {feedback.loading ? <Loading /> : feedback.error ? <ErrorState message={feedback.error} onRetry={feedback.reload} /> : (feedback.data ?? []).length === 0 ? (
        <SectionCard><Empty icon={MessageSquare} title={filter === 'new' ? 'Nothing new' : 'No feedback here'} body="Students send feedback from Me → Send feedback in the app." /></SectionCard>
      ) : (
        <div className="space-y-3">
          {feedback.data.map((item) => {
            const [kind, label] = CATEGORY[item.category] ?? CATEGORY.other
            return (
              <SectionCard key={item.id}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusPill kind={kind}>{label}</StatusPill>
                  <span className="text-xs" style={{ color: tokens.inkFaint }}>{item.from.name} · {item.from.email} · {timeAgo(item.createdAt)}{item.appVersion ? ` · v${item.appVersion}` : ''}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: tokens.ink }}>{item.message}</p>
                <div className="flex gap-2 mt-3">
                  {item.status !== 'seen' && item.status !== 'done' && <Button variant="secondary" loading={busyId === item.id} onClick={() => mark(item, 'seen')}>Mark seen</Button>}
                  {item.status !== 'done' ? <Button variant="secondary" loading={busyId === item.id} onClick={() => mark(item, 'done')}>Mark done</Button> : <Button variant="secondary" loading={busyId === item.id} onClick={() => mark(item, 'new')}>Reopen</Button>}
                </div>
              </SectionCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
