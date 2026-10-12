import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, LifeBuoy, Megaphone, ShieldAlert } from 'lucide-react'
import { request } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import { PageHeader, SectionCard, StatusPill } from '../../components/admin/PageChrome'
import { Button, ConfirmDialog, Empty, ErrorState, Field, Loading, Modal, NoAccess, Select, TextArea, TextInput, td, th, timeAgo } from '../../components/admin/kit'
import { useAdminApi } from '../../hooks/useAdminApi'
import { tokens } from '../../theme'

const KINDS = [['evacuation', 'Evacuation'], ['safety', 'Safety warning'], ['info', 'Information']]
const SEVERITIES = [['critical', 'Critical — show on every screen'], ['warning', 'Warning'], ['info', 'Info']]
const SEVERITY_PILL = { critical: 'danger', warning: 'warning', info: 'info' }

const blank = { kind: 'evacuation', severity: 'critical', title: '', message: '', location: '' }

export default function AlertsPage() {
  const { admin, hasPermission } = useAuth()
  const toast = useToast()
  const alerts = useAdminApi(hasPermission('safety') ? '/admin/alerts' : null, { pollMs: 10000 })
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [confirmSend, setConfirmSend] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!admin) return null
  if (!hasPermission('safety')) return <div className="p-8"><PageHeader title="Safety alerts" /><NoAccess what="safety alerts" /></div>

  const active = (alerts.data ?? []).filter((a) => a.status === 'active')
  const past = (alerts.data ?? []).filter((a) => a.status !== 'active')

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((x) => ({ ...x, [key]: undefined, form: undefined })) }

  // Validate first, then ask for confirmation: this reaches every student's phone immediately.
  const review = (e) => {
    e.preventDefault()
    const found = {}
    if (form.title.trim().length < 3) found.title = 'Add a short headline (at least 3 characters).'
    if (form.message.trim().length < 3) found.message = 'Tell people what to do.'
    setErrors(found)
    if (!Object.keys(found).length) setConfirmSend(true)
  }

  const send = async () => {
    setBusy(true)
    try {
      await request('/admin/alerts', { method: 'POST', body: { ...form, title: form.title.trim(), message: form.message.trim(), ...(form.location.trim() ? { location: form.location.trim() } : { location: undefined }) } })
      toast.success('Alert sent to every student on campus.', { title: 'Alert raised' })
      setConfirmSend(false); setComposing(false); setForm(blank); setErrors({})
      alerts.reload()
    } catch (err) {
      setConfirmSend(false)
      setErrors({ form: err.message })
    }
    setBusy(false)
  }

  const resolve = async () => {
    setBusy(true)
    try {
      await request(`/admin/alerts/${resolving.id}/resolve`, { method: 'POST' })
      toast.success('The alert was cleared from every phone.', { title: 'Resolved' })
      setResolving(null)
      alerts.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not resolve' })
    }
    setBusy(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Safety alerts"
        subtitle="Raise an emergency or safety notice to every student on your campus, and see who has checked in."
        actions={<Button onClick={() => { setComposing(true); setErrors({}) }}><ShieldAlert className="w-4 h-4" aria-hidden /> Raise alert</Button>}
      />

      {alerts.loading ? <Loading /> : alerts.error ? <ErrorState message={alerts.error} onRetry={alerts.reload} /> : (
        <>
          {active.length === 0 ? (
            <SectionCard><Empty icon={CheckCircle2} title="No active alerts" body="When you raise an alert it appears on every student's phone straight away, with “I'm safe” and “I need help” buttons." /></SectionCard>
          ) : (
            <div className="space-y-4">
              {active.map((a) => <ActiveAlert key={a.id} alert={a} onResolve={() => setResolving(a)} />)}
            </div>
          )}

          <h2 className="text-sm font-semibold mt-8 mb-3" style={{ color: tokens.ink }}>History</h2>
          <SectionCard padded={false}>
            {past.length === 0 ? <Empty title="Nothing here yet" body="Resolved alerts are kept here for your records." /> : (
              <table className="w-full">
                <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}><th className={th}>Alert</th><th className={th}>Type</th><th className={th}>Raised</th><th className={th}>Resolved</th></tr></thead>
                <tbody>
                  {past.map((a) => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                      <td className={td} style={{ color: tokens.ink }}>{a.title}{a.location ? <span style={{ color: tokens.inkFaint }}> · {a.location}</span> : null}</td>
                      <td className={td} style={{ color: tokens.inkSoft }}>{a.kind}</td>
                      <td className={td} style={{ color: tokens.inkSoft }}>{timeAgo(a.createdAt)}</td>
                      <td className={td} style={{ color: tokens.inkSoft }}>{timeAgo(a.resolvedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </>
      )}

      {composing && (
        <Modal title="Raise a safety alert" onClose={() => setComposing(false)} size="lg">
          <form onSubmit={review} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" htmlFor="alert-kind"><Select id="alert-kind" value={form.kind} onChange={set('kind')}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
              <Field label="Severity" htmlFor="alert-sev"><Select id="alert-sev" value={form.severity} onChange={set('severity')}>{SEVERITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            </div>
            <Field label="Headline" required error={errors.title} htmlFor="alert-title"><TextInput id="alert-title" value={form.title} onChange={set('title')} maxLength={120} placeholder="e.g. Fire alarm in Block A" invalid={!!errors.title} /></Field>
            <Field label="What should people do?" required error={errors.message} htmlFor="alert-msg" hint="Short and specific — this is shown on the lock screen and in the app."><TextArea id="alert-msg" rows={3} value={form.message} onChange={set('message')} maxLength={1000} placeholder="Leave by the nearest exit and gather at the Central Fountain." invalid={!!errors.message} /></Field>
            <Field label="Where (optional)" htmlFor="alert-loc"><TextInput id="alert-loc" value={form.location} onChange={set('location')} maxLength={120} placeholder="e.g. Block A" /></Field>
            {errors.form ? <p role="alert" className="text-sm" style={{ color: '#f87171' }}>{errors.form}</p> : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setComposing(false)}>Cancel</Button>
              <Button type="submit">Review and send</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmSend && (
        <ConfirmDialog
          title="Send this alert now?"
          danger={form.severity === 'critical'}
          confirmText="Send to all students"
          loading={busy}
          message={`“${form.title.trim()}” will be sent immediately to every student at your campus. ${form.severity === 'critical' ? 'It will appear on every screen of their app until you resolve it.' : ''}`}
          onConfirm={send}
          onClose={() => setConfirmSend(false)}
        />
      )}

      {resolving && (
        <ConfirmDialog
          title="Resolve this alert?"
          confirmText="Resolve and clear"
          loading={busy}
          message={`“${resolving.title}” will disappear from every student's phone. Only do this once the situation is over.`}
          onConfirm={resolve}
          onClose={() => setResolving(null)}
        />
      )}
    </div>
  )
}

// One live alert with its roll call. Polls every few seconds so "need help" shows up quickly.
function ActiveAlert({ alert, onResolve }) {
  const roll = useAdminApi(`/admin/alerts/${alert.id}/responses`, { pollMs: 5000 })
  const r = roll.data
  const answered = r ? r.safe + r.needHelp.length : 0
  const pct = r && r.total ? Math.round((answered / r.total) * 100) : 0

  return (
    <SectionCard style={alert.severity === 'critical' ? { borderColor: '#b91c1c' } : undefined}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusPill kind={SEVERITY_PILL[alert.severity]}>{alert.kind}</StatusPill>
            <span className="text-xs" style={{ color: tokens.inkFaint }}>raised {timeAgo(alert.createdAt)}</span>
          </div>
          <h3 className="text-base font-semibold" style={{ color: tokens.ink }}>{alert.title}</h3>
          <p className="text-sm mt-1" style={{ color: tokens.inkSoft }}>{alert.location ? `${alert.location} — ` : ''}{alert.message}</p>
        </div>
        <Button variant="secondary" onClick={onResolve}>Resolve</Button>
      </div>

      <div className="mt-5" style={{ borderTop: `1px solid ${tokens.hairline}`, paddingTop: 16 }}>
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: tokens.inkFaint }}>Roll call</h4>
        {roll.loading ? <p className="text-sm" style={{ color: tokens.inkSoft }}>Loading responses…</p> : roll.error ? <p className="text-sm" style={{ color: '#f87171' }}>{roll.error}</p> : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="Safe" value={r.safe} color={tokens.greenText} icon={CheckCircle2} />
              <Stat label="Need help" value={r.needHelp.length} color="#f87171" icon={LifeBuoy} />
              <Stat label="Not responded" value={r.notResponded} color={tokens.inkSoft} icon={Megaphone} />
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: tokens.sunken }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Students who have responded">
              <div className="h-full" style={{ width: `${pct}%`, background: tokens.violet }} />
            </div>
            <p className="text-xs mt-1.5" style={{ color: tokens.inkFaint }}>{answered} of {r.total} students have responded</p>
            {r.needHelp.length > 0 && (
              <div className="mt-4 p-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 10 }} role="alert">
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Asked for help</p>
                <ul className="text-sm space-y-0.5" style={{ color: tokens.ink }}>
                  {r.needHelp.map((p) => <li key={p.id}>{p.name} <span style={{ color: tokens.inkFaint }}>· {timeAgo(p.at)}</span></li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </SectionCard>
  )
}

function Stat({ label, value, color, icon: Icon }) {
  return (
    <div className="p-3" style={{ background: tokens.sunken, borderRadius: 10 }}>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: tokens.inkFaint }}><Icon className="w-3.5 h-3.5" style={{ color }} aria-hidden />{label}</div>
      <div className="text-2xl font-semibold mt-1" style={{ color }}>{value}</div>
    </div>
  )
}
