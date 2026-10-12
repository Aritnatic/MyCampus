import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Activity, KeyRound, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'
import { request } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import { PageHeader, SectionCard, StatusPill, TagChip } from '../../components/admin/PageChrome'
import { Button, ConfirmDialog, Empty, ErrorState, Field, Loading, Modal, NoAccess, Select, TextInput, td, th, timeAgo } from '../../components/admin/kit'
import { useAdminApi } from '../../hooks/useAdminApi'
import { store } from '../../hooks/useStoredState'
import { roles } from '../../data/admin'
import { tokens } from '../../theme'

const PERMISSIONS = [
  ['notices', 'Notices & announcements'], ['events', 'Events'], ['exams', 'Exams & timetables'], ['results', 'Results'],
  ['placements', 'Placements & jobs'], ['faculty', 'Faculty directory'], ['research', 'Research'],
  ['safety', 'Safety alerts'], ['users', 'Students & admin accounts'], ['settings', 'Settings & verification'],
]
const ROLE_OPTIONS = [['moderator', 'Moderator'], ['exams', 'Exam controller'], ['placements', 'Placement officer'], ['content', 'Content manager'], ['superadmin', 'Superadmin (everything)']]

export default function SettingsPage() {
  const { admin, hasPermission } = useAuth()
  const [params, setParams] = useSearchParams()
  if (!admin) return null

  const canUsers = hasPermission('users')
  const canSettings = hasPermission('settings')
  const tabs = [
    ...(canUsers ? [{ id: 'admins', label: 'Admin users', icon: Users }] : []),
    ...(canSettings ? [{ id: 'verification', label: 'Verification', icon: ShieldCheck }, { id: 'audit', label: 'Audit log', icon: Activity }] : []),
    { id: 'roles', label: 'Roles & permissions', icon: ShieldCheck },
    { id: 'account', label: 'My account', icon: KeyRound },
  ]
  const wanted = params.get('tab')
  const active = tabs.some((t) => t.id === wanted) ? wanted : tabs[0].id

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader title="Settings" subtitle="Who can manage your campus, who counts as a verified student, and a record of what changed." />
      <div className="admin-tabs mb-6" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id} onClick={() => setParams({ tab: t.id })} className={`admin-tab ${active === t.id ? 'admin-tab-active' : ''}`}>
            <t.icon className="w-4 h-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>
      {active === 'admins' && <AdminUsers />}
      {active === 'verification' && <Verification />}
      {active === 'audit' && <AuditLog />}
      {active === 'roles' && <RolesInfo />}
      {active === 'account' && <MyAccount />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Admin users
// ---------------------------------------------------------------------------
function AdminUsers() {
  const { admin, hasPermission } = useAuth()
  const toast = useToast()
  const list = useAdminApi('/admin/users')
  const [editing, setEditing] = useState(null) // 'new' | record
  const [toggling, setToggling] = useState(null)
  const [busy, setBusy] = useState(false)
  const isSuper = hasPermission('*') || admin.role === 'superadmin'

  const toggle = async () => {
    const next = toggling.status === 'active' ? 'suspended' : 'active'
    setBusy(true)
    try {
      await request(`/admin/users/${toggling.id}`, { method: 'PATCH', body: { status: next } })
      toast.success(next === 'suspended' ? `${toggling.name} was signed out and can't sign in.` : `${toggling.name} can sign in again.`, { title: next === 'suspended' ? 'Suspended' : 'Reactivated' })
      setToggling(null)
      list.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not update' })
    }
    setBusy(false)
  }

  if (list.loading) return <Loading />
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />

  return (
    <>
      {isSuper && <div className="flex justify-end mb-3"><Button onClick={() => setEditing('new')}><Plus className="w-4 h-4" aria-hidden /> Add admin</Button></div>}
      <SectionCard padded={false}>
        <table className="w-full">
          <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}>
            <th className={th}>Admin</th><th className={th}>Role</th><th className={th}>Can manage</th><th className={th}>Last sign-in</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {list.data.map((a) => {
              const me = a.id === admin.id
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                  <td className={td}><div style={{ color: tokens.ink }}>{a.name}{me ? <span style={{ color: tokens.inkFaint }}> (you)</span> : null}</div><div className="text-xs" style={{ color: tokens.inkFaint }}>{a.email}</div></td>
                  <td className={td} style={{ color: tokens.inkSoft }}>{ROLE_OPTIONS.find(([v]) => v === a.adminRole)?.[1] ?? a.adminRole}</td>
                  <td className={td}><div className="flex flex-wrap gap-1 max-w-xs">{a.adminRole === 'superadmin' ? <TagChip>Everything</TagChip> : a.permissions.map((p) => <TagChip key={p}>{p}</TagChip>)}</div></td>
                  <td className={td} style={{ color: tokens.inkSoft }}>{a.lastLoginAt ? timeAgo(a.lastLoginAt) : 'Never'}</td>
                  <td className={td}><StatusPill kind={a.status === 'active' ? 'approved' : 'closed'}>{a.status}</StatusPill></td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    {!me && isSuper && <button type="button" onClick={() => setEditing(a)} className="text-xs font-medium hover:underline mr-3" style={{ color: tokens.violetText }}>Edit<span className="sr-only"> {a.name}</span></button>}
                    {!me && <button type="button" onClick={() => setToggling(a)} className="text-xs font-medium hover:underline" style={{ color: a.status === 'active' ? '#f87171' : tokens.violetText }}>{a.status === 'active' ? 'Suspend' : 'Reactivate'}<span className="sr-only"> {a.name}</span></button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </SectionCard>

      {editing && <AdminForm record={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); list.reload() }} />}
      {toggling && <ConfirmDialog title={toggling.status === 'active' ? `Suspend ${toggling.name}?` : `Reactivate ${toggling.name}?`} danger={toggling.status === 'active'} confirmText={toggling.status === 'active' ? 'Suspend' : 'Reactivate'} loading={busy} message={toggling.status === 'active' ? 'They will be signed out everywhere and can’t use the admin panel until reactivated.' : 'They will be able to sign in again.'} onConfirm={toggle} onClose={() => setToggling(null)} />}
    </>
  )
}

function AdminForm({ record, onClose, onSaved }) {
  const toast = useToast()
  const [v, setV] = useState({ name: record?.name ?? '', email: record?.email ?? '', adminRole: record?.adminRole ?? 'moderator', permissions: record?.permissions ?? [] })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)
  const set = (key) => (val) => { setV((x) => ({ ...x, [key]: val })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }
  const everything = v.adminRole === 'superadmin'

  const togglePerm = (p) => set('permissions')(v.permissions.includes(p) ? v.permissions.filter((x) => x !== p) : [...v.permissions, p])

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!record && v.name.trim().length < 2) found.name = 'Enter their full name.'
    if (!record && !/^\S+@\S+\.\S+$/.test(v.email.trim())) found.email = 'Enter their college email address.'
    if (!everything && v.permissions.length === 0) found.permissions = 'Choose at least one thing they can manage.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      if (record) {
        await request(`/admin/users/${record.id}`, { method: 'PATCH', body: { adminRole: v.adminRole, permissions: everything ? PERMISSIONS.map(([p]) => p) : v.permissions } })
        toast.success('Their access was updated. They were signed out so it applies straight away.', { title: 'Saved' })
        onSaved()
      } else {
        const res = await request('/admin/users', { method: 'POST', body: { name: v.name.trim(), email: v.email.trim(), adminRole: v.adminRole, permissions: everything ? [] : v.permissions } })
        setCreated(res)
      }
    } catch (err) {
      setErrors({ form: err.message })
    }
    setBusy(false)
  }

  if (created) {
    return (
      <Modal title="Admin added" onClose={onSaved} footer={<Button onClick={onSaved}>Done</Button>}>
        <p className="text-sm" style={{ color: tokens.inkSoft }}>We emailed <strong style={{ color: tokens.ink }}>{created.email}</strong> a code to set their own password. Nobody, including you, ever sees a password for them.</p>
        {created.devCode ? <p className="text-xs mt-3 p-2" style={{ background: tokens.yellowSoft, color: tokens.yellowText, borderRadius: 8 }}>Development server: the code is <strong>{created.devCode}</strong>. This only appears when email sending is switched off.</p> : null}
      </Modal>
    )
  }

  return (
    <Modal title={record ? `Edit ${record.name}` : 'Add an admin'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!record && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" required error={errors.name} htmlFor="adm-name"><TextInput id="adm-name" value={v.name} onChange={(e) => set('name')(e.target.value)} invalid={!!errors.name} /></Field>
            <Field label="College email" required error={errors.email} htmlFor="adm-email"><TextInput id="adm-email" type="email" value={v.email} onChange={(e) => set('email')(e.target.value)} invalid={!!errors.email} placeholder="name@college.edu.in" /></Field>
          </div>
        )}
        <Field label="Role" htmlFor="adm-role" hint="Roles are a starting point; you can fine-tune what they manage below."><Select id="adm-role" value={v.adminRole} onChange={(e) => set('adminRole')(e.target.value)}>{ROLE_OPTIONS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</Select></Field>
        <fieldset disabled={everything}>
          <legend className="text-xs font-medium mb-2" style={{ color: tokens.ink }}>Can manage</legend>
          <div className="grid grid-cols-2 gap-2">
            {PERMISSIONS.map(([p, label]) => (
              <label key={p} className="flex items-center gap-2 text-sm" style={{ color: everything ? tokens.inkFaint : tokens.ink }}>
                <input type="checkbox" checked={everything || v.permissions.includes(p)} onChange={() => togglePerm(p)} /> {label}
              </label>
            ))}
          </div>
          {errors.permissions ? <p role="alert" className="text-xs mt-2" style={{ color: '#f87171' }}>{errors.permissions}</p> : null}
        </fieldset>
        {errors.form ? <p role="alert" className="text-sm" style={{ color: '#f87171' }}>{errors.form}</p> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{record ? 'Save changes' : 'Add admin'}</Button></div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Verification: which email domains count as a verified member of this college
// ---------------------------------------------------------------------------
function Verification() {
  const toast = useToast()
  const data = useAdminApi('/admin/domains')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async (domains, ok) => {
    setBusy(true)
    setError(null)
    try {
      await request('/admin/domains', { method: 'PUT', body: { domains } })
      toast.success(ok, { title: 'Saved' })
      setDraft('')
      data.reload()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  if (data.loading) return <Loading />
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />
  const domains = data.data.domains

  return (
    <div className="max-w-2xl space-y-4">
      <SectionCard>
        <h2 className="text-sm font-semibold mb-1" style={{ color: tokens.ink }}>College email domains</h2>
        <p className="text-sm mb-4" style={{ color: tokens.inkSoft }}>Anyone who signs up with an address on one of these domains, and confirms it with the emailed code, becomes a verified student of your college and can see its notices, results and safety alerts. Everyone else only sees open, cross-university content.</p>
        <ul className="space-y-2 mb-4">
          {domains.map((d) => (
            <li key={d} className="flex items-center justify-between px-3 py-2" style={{ background: tokens.sunken, borderRadius: 8 }}>
              <span className="text-sm font-mono" style={{ color: tokens.ink }}>@{d}</span>
              <button type="button" disabled={busy || domains.length <= 1} onClick={() => save(domains.filter((x) => x !== d), `@${d} was removed.`)} aria-label={`Remove ${d}`} className="p-1.5 disabled:opacity-30 hover:bg-white/[0.05]" style={{ color: '#f87171', borderRadius: 6 }} title={domains.length <= 1 ? 'You need at least one domain' : 'Remove'}><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) save([...new Set([...domains, draft.trim().toLowerCase().replace(/^@/, '')])], `@${draft.trim().replace(/^@/, '')} was added.`) }} className="flex items-start gap-2">
          <div className="flex-1"><Field label="Add a domain" htmlFor="dom-new" error={error}><TextInput id="dom-new" value={draft} onChange={(e) => { setDraft(e.target.value); setError(null) }} placeholder="alumni.college.edu.in" invalid={!!error} /></Field></div>
          <div className="pt-[22px]"><Button type="submit" loading={busy} disabled={!draft.trim()}>Add</Button></div>
        </form>
      </SectionCard>
      <p className="text-xs" style={{ color: tokens.inkFaint }}>Public mail providers like gmail.com can’t be used, since anyone could sign up with them. Removing a domain doesn’t remove people who already verified.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
const ACTIONS = {
  'notice.create': 'Posted a notice', 'notice.update': 'Edited a notice', 'notice.delete': 'Deleted a notice',
  'event.create': 'Created an event', 'event.update': 'Edited an event', 'event.delete': 'Deleted an event',
  'exam.create': 'Scheduled an exam', 'exam.update': 'Edited an exam', 'exam.delete': 'Deleted an exam',
  'result.create': 'Added results', 'result.update': 'Edited results', 'result.delete': 'Deleted results',
  'job.create': 'Posted a job', 'job.update': 'Edited a job', 'job.delete': 'Deleted a job',
  'faculty.create': 'Added faculty', 'faculty.update': 'Edited faculty', 'faculty.delete': 'Removed faculty',
  'research.create': 'Added research', 'research.update': 'Edited research', 'research.delete': 'Removed research',
  'alert.create': 'Raised a safety alert', 'alert.resolve': 'Resolved a safety alert',
  'user.create_admin': 'Added an admin', 'user.update': 'Changed an account', 'settings.domains': 'Changed verification domains',
  'notify.broadcast': 'Sent an announcement', 'collab.accepted': 'Accepted a research request', 'collab.declined': 'Declined a research request',
  'campus.map_update': 'Updated the campus map', 'auth.register': 'Student signed up', 'auth.password_reset': 'Password reset', 'auth.password_change': 'Password changed',
}

// A short human detail for an audit row: the title it concerned, or how many people were messaged.
const detailOf = (e) => e.data?.title ?? e.data?.name ?? (e.data?.recipients != null ? `${e.data.recipients} recipients` : null) ?? e.target ?? ''

function AuditLog() {
  const log = useAdminApi('/admin/audit?limit=100')
  if (log.loading) return <Loading />
  if (log.error) return <ErrorState message={log.error} onRetry={log.reload} />
  return (
    <SectionCard padded={false}>
      {log.data.length === 0 ? <Empty icon={Activity} title="Nothing recorded yet" body="Everything admins change is logged here, with who did it and when." /> : (
        <table className="w-full">
          <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}><th className={th}>What happened</th><th className={th}>Who</th><th className={th}>Details</th><th className={th}>When</th></tr></thead>
          <tbody>
            {log.data.map((e) => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                <td className={td} style={{ color: tokens.ink }}>{ACTIONS[e.action] ?? e.action}</td>
                <td className={td} style={{ color: tokens.inkSoft }}>{e.actor?.name ?? 'System'}</td>
                <td className={td} style={{ color: tokens.inkFaint }}>{detailOf(e)}</td>
                <td className={td} style={{ color: tokens.inkSoft }} title={new Date(e.at).toLocaleString()}>{timeAgo(e.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Roles reference (documentation, not data)
// ---------------------------------------------------------------------------
function RolesInfo() {
  const [confirm, setConfirm] = useState(false)
  const toast = useToast()
  return (
    <div className="space-y-6 max-w-4xl">
      <SectionCard padded={false}>
        <table className="w-full">
          <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}><th className={th}>Role</th><th className={th}>What it's for</th></tr></thead>
          <tbody>{roles.map((r) => <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}><td className={td} style={{ color: tokens.ink }}>{r.name}</td><td className={td} style={{ color: tokens.inkSoft }}>{r.description}</td></tr>)}</tbody>
        </table>
      </SectionCard>
      <SectionCard>
        <h2 className="text-sm font-semibold mb-1" style={{ color: tokens.ink }}>Demo data stored in this browser</h2>
        <p className="text-sm mb-3" style={{ color: tokens.inkSoft }}>The Placements company list is still demo data saved in this browser only (notices, events, exams, results and jobs live on the server). Clearing it restores the demo companies.</p>
        <Button variant="secondary" onClick={() => setConfirm(true)}>Reset browser demo data</Button>
      </SectionCard>
      {confirm && <ConfirmDialog title="Reset browser demo data?" confirmText="Reset" message="This only affects the company list stored in this browser. Nothing on the server changes." onConfirm={() => { store.reset(); toast.success('Demo data restored. Reloading…', { title: 'Reset' }); setTimeout(() => window.location.reload(), 600) }} onClose={() => setConfirm(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// My account: change password, sign out everywhere
// ---------------------------------------------------------------------------
function MyAccount() {
  const { admin, logout, adoptToken } = useAuth()
  const toast = useToast()
  const [v, setV] = useState({ current: '', next: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const set = (key) => (e) => { setV((x) => ({ ...x, [key]: e.target.value })); setErrors({}) }

  const change = async (e) => {
    e.preventDefault()
    const found = {}
    if (!v.current) found.current = 'Enter your current password.'
    if (v.next.length < 8) found.next = 'Use at least 8 characters.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const res = await request('/me/password', { method: 'POST', body: { current: v.current, next: v.next } })
      adoptToken(res.token)
      setV({ current: '', next: '' })
      toast.success('Password changed. You were signed out of every other device.', { title: 'Saved' })
    } catch (err) {
      setErrors(/current password/i.test(err.message) ? { current: err.message } : { next: err.message })
    }
    setBusy(false)
  }

  const signOutEverywhere = async () => {
    setBusy(true)
    try { await request('/me/logout-all', { method: 'POST' }) } catch { /* the token may already be revoked */ }
    logout()
  }

  return (
    <div className="max-w-md space-y-6">
      <SectionCard>
        <p className="text-sm mb-4" style={{ color: tokens.inkSoft }}>Signed in as <strong style={{ color: tokens.ink }}>{admin.email}</strong></p>
        <form onSubmit={change} className="space-y-4" noValidate>
          <Field label="Current password" error={errors.current} htmlFor="pw-cur"><TextInput id="pw-cur" type="password" autoComplete="current-password" value={v.current} onChange={set('current')} invalid={!!errors.current} /></Field>
          <Field label="New password" error={errors.next} hint="At least 8 characters. Avoid common passwords." htmlFor="pw-new"><TextInput id="pw-new" type="password" autoComplete="new-password" value={v.next} onChange={set('next')} invalid={!!errors.next} /></Field>
          <Button type="submit" loading={busy}>Change password</Button>
        </form>
      </SectionCard>
      <SectionCard>
        <h2 className="text-sm font-semibold mb-1" style={{ color: tokens.ink }}>Sign out everywhere</h2>
        <p className="text-sm mb-3" style={{ color: tokens.inkSoft }}>Ends every session on every device, including this one. Use it if you think someone else had access.</p>
        <Button variant="danger" onClick={() => setConfirmAll(true)}>Sign out of all devices</Button>
      </SectionCard>
      {confirmAll && <ConfirmDialog title="Sign out of all devices?" danger confirmText="Sign out everywhere" loading={busy} message="You'll need to sign in again here too." onConfirm={signOutEverywhere} onClose={() => setConfirmAll(false)} />}
    </div>
  )
}
