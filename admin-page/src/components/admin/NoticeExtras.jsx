import React, { useState } from 'react'
import { Users } from 'lucide-react'
import { request } from '../../api'
import { useToast } from '../feedback/Toast'
import { StatusPill } from './PageChrome'
import { Button, Empty, ErrorState, Field, Loading, Modal, TextArea, TextInput, td, th, timeAgo } from './kit'
import { useAdminApi } from '../../hooks/useAdminApi'
import { tokens } from '../../theme'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE']

// Push a short message to students: everyone, or only certain branches and semesters.
export function AnnounceModal({ onClose }) {
  const toast = useToast()
  const [v, setV] = useState({ title: '', body: '', branches: [], semesters: [] })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const toggle = (key, item) => setV((x) => ({ ...x, [key]: x[key].includes(item) ? x[key].filter((i) => i !== item) : [...x[key], item] }))
  const audience = v.branches.length || v.semesters.length
    ? `${v.branches.length ? v.branches.join(', ') : 'All branches'} · ${v.semesters.length ? `Semester ${[...v.semesters].sort().join(', ')}` : 'all semesters'}`
    : 'Every student on your campus'

  const submit = async (e) => {
    e.preventDefault()
    if (v.title.trim().length < 3) return setErrors({ title: 'Add a short headline (at least 3 characters).' })
    setBusy(true)
    try {
      const res = await request('/admin/notify', { method: 'POST', body: { title: v.title.trim(), ...(v.body.trim() && { body: v.body.trim() }), branches: v.branches, semesters: v.semesters } })
      toast.success(res.recipients === 1 ? 'Sent to 1 student.' : `Sent to ${res.recipients} students.`, { title: 'Announcement sent' })
      onClose()
    } catch (err) {
      setErrors({ form: err.message })
      setBusy(false)
    }
  }

  return (
    <Modal title="Send an announcement" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Headline" required error={errors.title} htmlFor="an-title" hint="Shows as the notification title on students' phones."><TextInput id="an-title" value={v.title} onChange={(e) => { setV({ ...v, title: e.target.value }); setErrors({}) }} maxLength={100} invalid={!!errors.title} placeholder="e.g. Semester 5 meeting at 3pm" /></Field>
        <Field label="Message (optional)" htmlFor="an-body"><TextArea id="an-body" rows={3} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} maxLength={300} /></Field>
        <fieldset>
          <legend className="text-xs font-medium mb-2" style={{ color: tokens.ink }}>Branches <span style={{ color: tokens.inkFaint }}>(none selected = all)</span></legend>
          <div className="flex flex-wrap gap-3">{BRANCHES.map((b) => <label key={b} className="flex items-center gap-1.5 text-sm" style={{ color: tokens.ink }}><input type="checkbox" checked={v.branches.includes(b)} onChange={() => toggle('branches', b)} /> {b}</label>)}</div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-medium mb-2" style={{ color: tokens.ink }}>Semesters <span style={{ color: tokens.inkFaint }}>(none selected = all)</span></legend>
          <div className="flex flex-wrap gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <label key={n} className="flex items-center gap-1.5 text-sm" style={{ color: tokens.ink }}><input type="checkbox" checked={v.semesters.includes(n)} onChange={() => toggle('semesters', n)} /> {n}</label>)}</div>
        </fieldset>
        <p className="text-sm px-3 py-2" style={{ background: tokens.sunken, borderRadius: 8, color: tokens.inkSoft }}>Will be sent to: <strong style={{ color: tokens.ink }}>{audience}</strong></p>
        {errors.form ? <p role="alert" className="text-sm" style={{ color: tokens.red }}>{errors.form}</p> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Send now</Button></div>
      </form>
    </Modal>
  )
}

// Who signed up for an event, in order, with anyone on the waitlist.
export function RegistrationsModal({ event, onClose }) {
  const list = useAdminApi(`/admin/events/${event.id}/registrations`)
  return (
    <Modal title={`Registrations — ${event.title}`} onClose={onClose} size="lg">
      {list.loading ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.data.length === 0 ? (
        <Empty icon={Users} title="No one has registered yet" body="Students can register from the event page in the app." />
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: tokens.inkSoft }}>{list.data.filter((r) => r.status === 'registered').length} registered{list.data.some((r) => r.status === 'waitlist') ? ` · ${list.data.filter((r) => r.status === 'waitlist').length} on the waitlist` : ''}</p>
          <table className="w-full">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}><th className={th}>Student</th><th className={th}>Status</th><th className={th}>Signed up</th></tr></thead>
            <tbody>{list.data.map((r) => (
              <tr key={r.userId} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                <td className={td}><div style={{ color: tokens.ink }}>{r.name}</div><div className="text-xs" style={{ color: tokens.inkFaint }}>{r.email}</div></td>
                <td className={td}><StatusPill kind={r.status === 'registered' ? 'approved' : 'pending'}>{r.status}</StatusPill></td>
                <td className={td} style={{ color: tokens.inkSoft }}>{timeAgo(r.registeredAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </>
      )}
    </Modal>
  )
}
