import React, { useMemo, useState } from 'react'
import { FlaskConical, GraduationCap, Inbox, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { request } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import { PageHeader, SectionCard, StatusPill, TagChip } from '../../components/admin/PageChrome'
import { Button, ConfirmDialog, Empty, ErrorState, Field, ListInput, Loading, Modal, NoAccess, Select, TextArea, TextInput, td, th, timeAgo } from '../../components/admin/kit'
import { useAdminApi } from '../../hooks/useAdminApi'
import { tokens } from '../../theme'

// ---- what each record type looks like ----
const FACULTY = {
  path: '/admin/faculty', noun: 'faculty member', permission: 'faculty', icon: GraduationCap,
  blank: { name: '', department: '', designation: '', email: '', phone: '', office: '', availability: '', bio: '', researchInterests: [], qualifications: [] },
  columns: [
    ['Name', (r) => <><div style={{ color: tokens.ink }}>{r.name}</div><div className="text-xs" style={{ color: tokens.inkFaint }}>{r.designation}</div></>],
    ['Department', (r) => r.department],
    ['Contact', (r) => r.email ?? '—'],
    ['Interests', (r) => <div className="flex flex-wrap gap-1">{(r.researchInterests ?? []).slice(0, 3).map((i) => <TagChip key={i}>{i}</TagChip>)}</div>],
  ],
  fields: [
    { key: 'name', label: 'Full name', required: true, placeholder: 'Dr. Anjali Mishra' },
    { key: 'designation', label: 'Designation', required: true, placeholder: 'Professor & HOD', half: true },
    { key: 'department', label: 'Department', required: true, placeholder: 'Computer Science & Engineering', half: true },
    { key: 'email', label: 'Email', type: 'email', half: true },
    { key: 'phone', label: 'Phone', half: true },
    { key: 'office', label: 'Office', placeholder: 'Block A, Room 301', half: true },
    { key: 'availability', label: 'Availability', placeholder: 'Mon–Wed 2–4 PM', half: true },
    { key: 'researchInterests', label: 'Research interests', type: 'list', hint: 'Separate with commas.' },
    { key: 'qualifications', label: 'Qualifications', type: 'list', hint: 'Separate with commas.' },
    { key: 'bio', label: 'About', type: 'textarea' },
  ],
}

const RESEARCH = {
  path: '/admin/research', noun: 'research opportunity', permission: 'research', icon: FlaskConical,
  blank: { title: '', supervisor: '', department: '', description: '', status: 'recruiting', type: 'funded', duration: '', stipend: '', positions: 1, deadline: '', requiredSkills: [], preferredSkills: [], visibility: 'campus' },
  columns: [
    ['Title', (r) => <><div style={{ color: tokens.ink }}>{r.title}</div><div className="text-xs" style={{ color: tokens.inkFaint }}>{r.supervisor}</div></>],
    ['Status', (r) => <StatusPill kind={r.status === 'recruiting' ? 'open' : 'closed'}>{r.status}</StatusPill>],
    ['Positions', (r) => r.positions ?? '—'],
    ['Visible to', (r) => (r.visibility === 'cross-university' ? 'All universities' : 'My campus')],
  ],
  fields: [
    { key: 'title', label: 'Title', required: true },
    { key: 'supervisor', label: 'Supervisor', required: true, half: true },
    { key: 'department', label: 'Department', half: true },
    { key: 'description', label: 'Description', required: true, type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', options: [['recruiting', 'Recruiting'], ['ongoing', 'In progress'], ['closed', 'Closed']], half: true },
    { key: 'type', label: 'Funding', type: 'select', options: [['funded', 'Funded'], ['unfunded', 'Unfunded'], ['volunteer', 'Volunteer']], half: true },
    { key: 'duration', label: 'Duration', placeholder: '6 months', half: true },
    { key: 'stipend', label: 'Stipend', placeholder: '₹10,000 / month', half: true },
    { key: 'positions', label: 'Open positions', type: 'number', half: true },
    { key: 'deadline', label: 'Apply by', type: 'date', half: true },
    { key: 'requiredSkills', label: 'Required skills', type: 'list', hint: 'Separate with commas.' },
    { key: 'preferredSkills', label: 'Preferred skills', type: 'list', hint: 'Separate with commas.' },
    { key: 'visibility', label: 'Who can see it', type: 'select', options: [['campus', 'My campus only'], ['cross-university', 'Students at all universities']] },
  ],
}

export default function FacultyResearchPage() {
  const { admin, hasPermission } = useAuth()
  const tabs = useMemo(() => [
    ...(hasPermission('faculty') ? [{ id: 'faculty', label: 'Faculty', icon: GraduationCap }, { id: 'guidance', label: 'Guidance requests', icon: HelpCircle }] : []),
    ...(hasPermission('research') ? [{ id: 'research', label: 'Research', icon: FlaskConical }, { id: 'interest', label: 'Student interest', icon: Inbox }] : []),
  ], [hasPermission])
  const [tab, setTab] = useState(null)
  if (!admin) return null
  if (tabs.length === 0) return <div className="p-8"><PageHeader title="Faculty & research" /><NoAccess what="faculty and research" /></div>
  const active = tab ?? tabs[0].id

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader title="Faculty & research" subtitle="Keep the faculty directory and research opportunities up to date, and answer students who want to take part." />
      <div className="admin-tabs mb-6" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id} onClick={() => setTab(t.id)} className={`admin-tab ${active === t.id ? 'admin-tab-active' : ''}`}>
            <t.icon className="w-4 h-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>
      {active === 'faculty' && <Crud key="faculty" cfg={FACULTY} />}
      {active === 'research' && <Crud key="research" cfg={RESEARCH} />}
      {active === 'interest' && <InterestInbox />}
      {active === 'guidance' && <GuidanceInbox />}
    </div>
  )
}

// A list with create / edit / delete, driven by the config above.
function Crud({ cfg }) {
  const toast = useToast()
  const list = useAdminApi(cfg.path)
  const [editing, setEditing] = useState(null) // null | 'new' | record
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      await request(`${cfg.path}/${deleting.id}`, { method: 'DELETE' })
      toast.success(`The ${cfg.noun} was removed.`, { title: 'Deleted' })
      setDeleting(null)
      list.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not delete' })
    }
    setBusy(false)
  }

  if (list.loading) return <Loading />
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />
  const rows = list.data ?? []

  return (
    <>
      <div className="flex justify-end mb-3"><Button onClick={() => setEditing('new')}><Plus className="w-4 h-4" aria-hidden /> Add {cfg.noun}</Button></div>
      <SectionCard padded={false}>
        {rows.length === 0 ? <Empty icon={cfg.icon} title={`No ${cfg.noun}s yet`} body={`Add the first one and students will be able to find it in the app.`} /> : (
          <table className="w-full">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}>
              {cfg.columns.map(([label]) => <th key={label} className={th}>{label}</th>)}
              <th className={th}><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                  {cfg.columns.map(([label, cell]) => <td key={label} className={td} style={{ color: tokens.inkSoft }}>{cell(r)}</td>)}
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button type="button" onClick={() => setEditing(r)} aria-label={`Edit ${r.name ?? r.title}`} className="p-1.5 hover:bg-white/[0.05]" style={{ color: tokens.inkSoft, borderRadius: 6 }}><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setDeleting(r)} aria-label={`Delete ${r.name ?? r.title}`} className="p-1.5 hover:bg-white/[0.05]" style={{ color: '#f87171', borderRadius: 6 }}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {editing && <RecordForm cfg={cfg} record={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); list.reload() }} />}
      {deleting && <ConfirmDialog title={`Delete this ${cfg.noun}?`} danger confirmText="Delete" loading={busy} message={`“${deleting.name ?? deleting.title}” will disappear from the app for every student. This can't be undone.`} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  )
}

function RecordForm({ cfg, record, onClose, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState(() => ({ ...cfg.blank, ...(record ?? {}), deadline: (record?.deadline ?? '').slice(0, 10) }))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setValues((v) => ({ ...v, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    for (const f of cfg.fields) if (f.required && !String(values[f.key] ?? '').trim()) found[f.key] = `${f.label} is required.`
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const payload = Object.fromEntries(cfg.fields.map((f) => [f.key, f.type === 'number' ? Number(values[f.key]) || 0 : typeof values[f.key] === 'string' ? values[f.key].trim() : values[f.key]]))
    // Optional text left blank is simply not sent, so we don't store empty strings.
    for (const f of cfg.fields) if (!f.required && payload[f.key] === '') delete payload[f.key]
    try {
      await request(record ? `${cfg.path}/${record.id}` : cfg.path, { method: record ? 'PUT' : 'POST', body: payload })
      toast.success(record ? 'Changes saved.' : `The ${cfg.noun} was added.`, { title: 'Saved' })
      onSaved()
    } catch (err) {
      setErrors({ form: err.message })
      setBusy(false)
    }
  }

  const control = (f) => {
    const id = `f-${f.key}`
    const common = { id, value: values[f.key] ?? '', onChange: (e) => set(f.key)(e.target.value), invalid: !!errors[f.key] }
    if (f.type === 'textarea') return <TextArea rows={4} {...common} />
    if (f.type === 'select') return <Select {...common}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
    if (f.type === 'list') return <ListInput id={id} value={values[f.key]} onChange={set(f.key)} />
    return <TextInput type={f.type ?? 'text'} placeholder={f.placeholder} {...common} />
  }

  return (
    <Modal title={record ? `Edit ${cfg.noun}` : `Add ${cfg.noun}`} onClose={onClose} size="xl">
      <form onSubmit={submit} noValidate>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {cfg.fields.map((f) => (
            <div key={f.key} className={f.half ? '' : 'col-span-2'}>
              <Field label={f.label} required={f.required} error={errors[f.key]} hint={f.hint} htmlFor={`f-${f.key}`}>{control(f)}</Field>
            </div>
          ))}
        </div>
        {errors.form ? <p role="alert" className="text-sm mt-4" style={{ color: '#f87171' }}>{errors.form}</p> : null}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>{record ? 'Save changes' : `Add ${cfg.noun}`}</Button>
        </div>
      </form>
    </Modal>
  )
}

// Students who asked to take part in a research opportunity.
function InterestInbox() {
  const toast = useToast()
  const inbox = useAdminApi('/admin/collab')
  const [working, setWorking] = useState(null)

  const answer = async (id, verb) => {
    setWorking(id)
    try {
      await request(`/admin/collab/${id}/${verb}`, { method: 'POST' })
      toast.success(verb === 'accept' ? 'The student was told they were accepted.' : 'The student was told it didn’t work out this time.', { title: verb === 'accept' ? 'Accepted' : 'Declined' })
      inbox.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not update' })
    }
    setWorking(null)
  }

  if (inbox.loading) return <Loading />
  if (inbox.error) return <ErrorState message={inbox.error} onRetry={inbox.reload} />
  const rows = inbox.data ?? []
  const pending = rows.filter((r) => r.status === 'pending')
  const done = rows.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <SectionCard padded={false}>
        {pending.length === 0 ? <Empty icon={Inbox} title="No requests waiting" body="When a student taps “I'm interested” on one of your research opportunities, it shows up here." /> : (
          <ul>
            {pending.map((r) => (
              <li key={r.id} className="p-4 flex items-start justify-between gap-4" style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: tokens.ink }}>{r.from.name} <span style={{ color: tokens.inkFaint }}>· {r.from.email}</span></div>
                  <div className="text-xs mt-0.5" style={{ color: tokens.violetText }}>{r.research.title}</div>
                  <p className="text-sm mt-2 max-w-xl" style={{ color: tokens.inkSoft }}>“{r.message}”</p>
                  <div className="text-xs mt-1" style={{ color: tokens.inkFaint }}>{timeAgo(r.createdAt)}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button onClick={() => answer(r.id, 'accept')} loading={working === r.id}>Accept</Button>
                  <Button variant="secondary" onClick={() => answer(r.id, 'decline')} disabled={working === r.id}>Decline</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: tokens.ink }}>Answered</h2>
          <SectionCard padded={false}>
            <table className="w-full"><tbody>
              {done.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                  <td className={td} style={{ color: tokens.ink }}>{r.from.name}</td>
                  <td className={td} style={{ color: tokens.inkSoft }}>{r.research.title}</td>
                  <td className={td}><StatusPill kind={r.status === 'accepted' ? 'approved' : 'closed'}>{r.status}</StatusPill></td>
                </tr>
              ))}
            </tbody></table>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// Students who asked a teacher for project guidance. Teachers are emailed the request; an admin records their answer here.
function GuidanceInbox() {
  const toast = useToast()
  const inbox = useAdminApi('/admin/guidance', { pollMs: 30000 })
  const [deciding, setDeciding] = useState(null) // { request, status }
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const open = (request, status) => { setNote(''); setDeciding({ request, status }) }
  const submit = async () => {
    setSaving(true)
    try {
      await request(`/admin/guidance/${deciding.request.id}/decide`, { method: 'POST', body: { status: deciding.status, ...(note.trim() && { note: note.trim() }) } })
      toast.success(deciding.status === 'accepted' ? 'The student was told the teacher can guide them.' : 'The student was told it didn’t work out this time.', { title: deciding.status === 'accepted' ? 'Accepted' : 'Declined' })
      setDeciding(null)
      inbox.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not update' })
    }
    setSaving(false)
  }

  if (inbox.loading) return <Loading />
  if (inbox.error) return <ErrorState message={inbox.error} onRetry={inbox.reload} />
  const rows = inbox.data ?? []
  const pending = rows.filter((r) => r.status === 'pending')
  const done = rows.filter((r) => r.status === 'accepted' || r.status === 'declined')

  return (
    <div className="space-y-6">
      <SectionCard padded={false}>
        {pending.length === 0 ? <Empty icon={Inbox} title="No requests waiting" body="When a student taps “Ask for guidance” on a teacher in the app, the request shows up here and the teacher is emailed." /> : (
          <ul>
            {pending.map((r) => (
              <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4" style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: tokens.ink }}>{r.from.name} <span style={{ color: tokens.inkFaint }}>· {r.from.email}</span></div>
                  <div className="text-xs mt-0.5" style={{ color: tokens.violetText }}>Wants guidance from {r.faculty.name}{r.faculty.department ? ` · ${r.faculty.department}` : ''}</div>
                  <div className="text-sm mt-2" style={{ color: tokens.ink }}>{r.topic}</div>
                  {r.message ? <p className="text-sm mt-1 max-w-xl" style={{ color: tokens.inkSoft }}>“{r.message}”</p> : null}
                  <div className="text-xs mt-1" style={{ color: tokens.inkFaint }}>{[r.from.branch, r.from.semester ? `semester ${r.from.semester}` : null].filter(Boolean).join(' · ')}{r.from.branch ? ' · ' : ''}{timeAgo(r.createdAt)}</div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Button onClick={() => open(r, 'accepted')}>Teacher can guide</Button>
                  <Button variant="secondary" onClick={() => open(r, 'declined')}>Can’t take on</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: tokens.ink }}>Answered</h2>
          <SectionCard padded={false}>
            <table className="w-full"><tbody>
              {done.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                  <td className={td} style={{ color: tokens.ink }}>{r.from.name}</td>
                  <td className={td} style={{ color: tokens.inkSoft }}>{r.faculty.name}</td>
                  <td className={td} style={{ color: tokens.inkSoft }}>{r.topic}</td>
                  <td className={td}><StatusPill kind={r.status === 'accepted' ? 'approved' : 'closed'}>{r.status}</StatusPill></td>
                </tr>
              ))}
            </tbody></table>
          </SectionCard>
        </div>
      )}
      {deciding && (
        <Modal
          title={deciding.status === 'accepted' ? 'Teacher can guide this student' : 'Teacher can’t take this on'}
          onClose={() => setDeciding(null)}
          footer={<><Button variant="secondary" onClick={() => setDeciding(null)}>Cancel</Button><Button onClick={submit} loading={saving}>Tell the student</Button></>}
        >
          <p className="text-sm mb-3" style={{ color: tokens.inkSoft }}>{deciding.request.from.name} will get a notification{deciding.status === 'accepted' ? '. Add when and where to meet, if you know.' : '. A short reason helps them pick another teacher.'}</p>
          <Field label="Note for the student (optional)" htmlFor="guidance-note">
            <TextArea id="guidance-note" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={deciding.status === 'accepted' ? 'e.g. Come by Tuesday 3 PM, Block A room 301.' : 'e.g. Already guiding three projects this semester.'} />
          </Field>
        </Modal>
      )}
    </div>
  )
}
