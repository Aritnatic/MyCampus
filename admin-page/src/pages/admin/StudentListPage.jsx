import React, { useEffect, useState } from 'react'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Download, Inbox, Search, ShieldCheck, Upload, UserCheck, UserPlus, UserX, Users, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ImportStudentsModal from '../../components/admin/ImportStudentsModal'
import { request } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import { PageHeader, SectionCard, StatusPill, TagChip } from '../../components/admin/PageChrome'
import { Button, ConfirmDialog, Empty, ErrorState, Field, Loading, Modal, NoAccess, Select, TextArea, TextInput, td, th, timeAgo } from '../../components/admin/kit'
import { useAdminApi } from '../../hooks/useAdminApi'
import { tokens, radius } from '../../theme'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE']
const PAGE_SIZE = 25

export default function StudentListPage() {
  const { admin, hasPermission } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('')
  const [page, setPage] = useState(1)
  const [toggling, setToggling] = useState(null)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editingReg, setEditingReg] = useState(null)
  const [regValue, setRegValue] = useState('')
  const [regError, setRegError] = useState('')
  const allowed = hasPermission('users')
  const [params_, setParams] = useSearchParams()
  const tab = params_.get('tab') === 'requests' ? 'requests' : 'students'
  // Polled so a new request shows up without a reload.
  const pending = useAdminApi(allowed ? '/admin/join-requests?status=pending' : null, { pollMs: 30000 })
  const pendingCount = pending.data?.length ?? 0

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const id = setTimeout(() => { setSearch(query.trim()); setPage(1) }, 300)
    return () => clearTimeout(id)
  }, [query])

  const params = new URLSearchParams({ page, limit: PAGE_SIZE, ...(search && { q: search }), ...(branch && { branch }), ...(semester && { semester }) })
  const roster = useAdminApi(allowed ? `/admin/students?${params}` : null)

  if (!admin) return null
  if (!allowed) return <div className="p-8"><PageHeader title="Students" /><NoAccess what="students" /></div>

  const d = roster.data
  const summary = d?.summary
  const pages = d ? Math.max(1, Math.ceil(d.total / PAGE_SIZE)) : 1
  const filtered = !!(search || branch || semester)

  const changeStatus = async () => {
    const next = toggling.status === 'active' ? 'suspended' : 'active'
    setBusy(true)
    try {
      await request(`/admin/users/${toggling.id}`, { method: 'PATCH', body: { status: next } })
      toast.success(next === 'suspended' ? `${toggling.name} was signed out everywhere and can't sign in.` : `${toggling.name} can sign in again.`, { title: next === 'suspended' ? 'Suspended' : 'Reactivated' })
      setToggling(null)
      roster.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not update' })
    }
    setBusy(false)
  }

  // Exports everyone matching the current filters, not just the visible page.
  const exportCsv = async () => {
    setExporting(true)
    try {
      const rows = []
      for (let p = 1; ; p += 1) {
        const q = new URLSearchParams({ page: p, limit: 100, ...(search && { q: search }), ...(branch && { branch }), ...(semester && { semester }) })
        const chunk = await request(`/admin/students?${q}`)
        rows.push(...chunk.items)
        if (rows.length >= chunk.total || chunk.items.length === 0) break
      }
      const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const csv = ['Name,Email,Branch,Year,Semester,Status,Email verified', ...rows.map((s) => [s.name, s.email, s.branch, s.year, s.semester, s.status, s.verified ? 'yes' : 'no'].map(cell).join(','))].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      Object.assign(document.createElement('a'), { href: url, download: 'students.csv' }).click()
      URL.revokeObjectURL(url)
      toast.success(`${rows.length} students exported.`, { title: 'Exported' })
    } catch (err) {
      toast.error(err.message, { title: 'Export failed' })
    }
    setExporting(false)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <PageHeader
        title="Students"
        subtitle={summary ? `${summary.total} registered · ${summary.active} active${pendingCount ? ` · ${pendingCount} waiting to join` : ''}` : 'Verified students of your college'}
        actions={<><Button variant="secondary" onClick={() => setImporting(true)}><Upload className="w-4 h-4" aria-hidden /> Import CSV</Button><Button variant="secondary" onClick={exportCsv} loading={exporting}><Download className="w-4 h-4" aria-hidden /> Export CSV</Button></>}
      />

      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar-dark px-6 lg:px-8 py-6 max-w-6xl space-y-5">
        <div className="admin-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'students'} onClick={() => setParams({})} className={`admin-tab ${tab === 'students' ? 'admin-tab-active' : ''}`}>
            <Users className="w-4 h-4" aria-hidden /> Students
          </button>
          <button type="button" role="tab" aria-selected={tab === 'requests'} onClick={() => setParams({ tab: 'requests' })} className={`admin-tab ${tab === 'requests' ? 'admin-tab-active' : ''}`}>
            <UserPlus className="w-4 h-4" aria-hidden /> Join requests
            {pendingCount > 0 && <span className="px-1.5 py-px text-[10px] font-semibold" style={{ background: tokens.accent, color: tokens.accentInk, borderRadius: radius.chip }}>{pendingCount}</span>}
          </button>
        </div>

        {tab === 'requests' ? <JoinRequests pending={pending} onDecided={() => { pending.reload(); roster.reload() }} /> : (<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile label="Registered" value={summary?.total} icon={Users} color={tokens.accent} bg={tokens.violetSoft} />
          <Tile label="Active" value={summary?.active} icon={UserCheck} color={tokens.green} bg={tokens.greenSoft} />
          <Tile label="Suspended" value={summary?.suspended} icon={UserX} color={tokens.red} bg={tokens.redSoft} />
          <Tile label="Email not confirmed" value={summary?.unverified} icon={ShieldCheck} color={tokens.yellow} bg={tokens.yellowSoft} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inkFaint }} aria-hidden />
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, reg. no. or MyCampus ID" aria-label="Search students" style={{ paddingLeft: 36 }} />
          </div>
          <div className="w-36"><Select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1) }} aria-label="Branch"><option value="">All branches</option>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</Select></div>
          <div className="w-36"><Select value={semester} onChange={(e) => { setSemester(e.target.value); setPage(1) }} aria-label="Semester"><option value="">All semesters</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}</Select></div>
          {filtered ? <Button variant="secondary" onClick={() => { setQuery(''); setSearch(''); setBranch(''); setSemester(''); setPage(1) }}>Clear filters</Button> : null}
        </div>

        {roster.loading && !d ? <Loading /> : roster.error ? <ErrorState message={roster.error} onRetry={roster.reload} /> : (
          <SectionCard padded={false}>
            {d.items.length === 0 ? (
              <Empty icon={Users} title={filtered ? 'No students match' : 'No students yet'} body={filtered ? 'Try a different search or clear the filters.' : 'Students appear here as soon as they sign up with a college email and confirm it.'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}>
                    <th className={th}>Student</th><th className={th}>IDs</th><th className={th}>Branch</th><th className={th}>Semester</th><th className={th}>Last seen</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody>
                    {d.items.map((s) => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }} className="hover:bg-white/[0.02]">
                        <td className={td}>
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 flex items-center justify-center text-[11px] font-semibold flex-shrink-0" style={{ background: tokens.blueSoft, color: tokens.blue, borderRadius: 999 }} aria-hidden>{s.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                            <div className="min-w-0"><div className="font-medium" style={{ color: tokens.ink }}>{s.name}</div><div className="text-[11px]" style={{ color: tokens.inkFaint }}>{s.email}</div></div>
                          </div>
                        </td>
                        <td className={td}>
                          <div className="text-[13px] font-medium whitespace-nowrap" style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>{s.rollNumber || <span style={{ color: tokens.inkFaint }}>No reg. no.</span>}</div>
                          <div className="text-[11px] whitespace-nowrap" style={{ color: tokens.inkFaint, fontVariantNumeric: 'tabular-nums' }}>{s.publicId}</div>
                        </td>
                        <td className={td}><TagChip>{s.branch || '—'}</TagChip></td>
                        <td className={td} style={{ color: tokens.inkSoft }}>{s.semester ? `Sem ${s.semester} · Year ${s.year}` : '—'}</td>
                        <td className={td} style={{ color: tokens.inkSoft }}>{s.lastLoginAt ? timeAgo(s.lastLoginAt) : 'Never'}</td>
                        <td className={td}>
                          {!s.verified ? <StatusPill kind="pending">Unconfirmed</StatusPill> : <StatusPill kind={s.status === 'active' ? 'approved' : 'closed'}>{s.status}</StatusPill>}
                        </td>
                        <td className={`${td} text-right whitespace-nowrap`}>
                          <button type="button" onClick={() => { setEditingReg(s); setRegValue(s.rollNumber || '') }} className="text-xs font-medium hover:underline mr-3" style={{ color: tokens.violetText }}>
                            Edit reg. no.<span className="sr-only"> for {s.name}</span>
                          </button>
                          <button type="button" onClick={() => setToggling(s)} className="text-xs font-medium hover:underline" style={{ color: s.status === 'active' ? tokens.red : tokens.violetText }}>
                            {s.status === 'active' ? 'Suspend' : 'Reactivate'}<span className="sr-only"> {s.name}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {d.total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderTop: `1px solid ${tokens.hairline}`, color: tokens.inkSoft }}>
                <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, d.total)} of {d.total}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" className="p-1.5 disabled:opacity-30 hover:bg-white/[0.05]" style={{ borderRadius: radius.chip }}><ChevronLeft className="w-4 h-4" /></button>
                  <span>Page {page} of {pages}</span>
                  <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} aria-label="Next page" className="p-1.5 disabled:opacity-30 hover:bg-white/[0.05]" style={{ borderRadius: radius.chip }}><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </SectionCard>
        )}
        </>)}
      </div>

      {editingReg && (
        <Modal title={`Registration no. for ${editingReg.name}`} onClose={() => { setEditingReg(null); setRegError('') }} footer={<>
          <Button variant="secondary" onClick={() => { setEditingReg(null); setRegError('') }}>Cancel</Button>
          <Button loading={busy} onClick={async () => {
            setBusy(true); setRegError('')
            try {
              await request(`/admin/students/${editingReg.id}/registration`, { method: 'PATCH', body: { rollNumber: regValue.trim() } })
              toast.success(`${editingReg.name}’s registration no. is saved.`, { title: 'Saved' })
              setEditingReg(null); roster.reload()
            } catch (err) { setRegError(err.message) }
            setBusy(false)
          }}>Save</Button>
        </>}>
          <Field label="Your college’s registration / roll no." htmlFor="reg-no" error={regError} hint={`Only ${editingReg.name} and your college’s admins see this. Their MyCampus ID (${editingReg.publicId}) never changes.`}>
            <TextInput id="reg-no" value={regValue} onChange={(e) => setRegValue(e.target.value)} maxLength={40} placeholder="e.g. F24-CSE-031" autoFocus />
          </Field>
        </Modal>
      )}

      {importing && <ImportStudentsModal onClose={() => setImporting(false)} onImported={roster.reload} />}

      {toggling && (
        <ConfirmDialog
          title={toggling.status === 'active' ? `Suspend ${toggling.name}?` : `Reactivate ${toggling.name}?`}
          danger={toggling.status === 'active'}
          confirmText={toggling.status === 'active' ? 'Suspend' : 'Reactivate'}
          loading={busy}
          message={toggling.status === 'active' ? 'They will be signed out on every device straight away and won’t be able to sign in until you reactivate them.' : 'They will be able to sign in again.'}
          onConfirm={changeStatus}
          onClose={() => setToggling(null)}
        />
      )}
    </div>
  )
}

function Tile({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="p-4" style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.container }}>
      <div className="w-9 h-9 flex items-center justify-center mb-2" style={{ background: bg, borderRadius: radius.chip }}><Icon className="w-4 h-4" style={{ color }} aria-hidden /></div>
      <div className="text-2xl font-semibold tracking-tight" style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</div>
      <div className="text-xs mt-0.5" style={{ color: tokens.inkSoft }}>{label}</div>
    </div>
  )
}

// People who signed up with a personal email and asked to join this college. The admin checks the roll number
// against the college's records, then approves (they become a verified student at once) or rejects with a reason.
function JoinRequests({ pending, onDecided }) {
  const toast = useToast()
  const [view, setView] = useState('pending')
  const history = useAdminApi(view === 'pending' ? null : `/admin/join-requests?status=${view}`)
  const list = view === 'pending' ? pending : history
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [busyId, setBusyId] = useState(null)

  const decide = async (r, action, body) => {
    setBusyId(r.id)
    try {
      await request(`/admin/join-requests/${r.id}/${action}`, { method: 'POST', body })
      toast.success(action === 'approve' ? `${r.name} is now a verified student.` : `${r.name} was told why.`, { title: action === 'approve' ? 'Approved' : 'Rejected' })
      setRejecting(null); setReason('')
      onDecided()
      if (view !== 'pending') history.reload()
    } catch (err) {
      toast.error(err.message, { title: 'Could not update' })
    }
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([v, label]) => (
          <button key={v} type="button" onClick={() => setView(v)} className="px-3 h-8 text-[13px] font-medium smooth"
            style={{ border: `1px solid ${view === v ? tokens.violet : tokens.hairline}`, color: view === v ? tokens.ink : tokens.inkSoft, background: view === v ? tokens.sunken : 'transparent', borderRadius: radius.button }}>
            {label}
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: tokens.inkFaint }}>Check each roll number against your records before approving.</span>
      </div>

      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : (
        <SectionCard padded={false}>
          {(list.data ?? []).length === 0 ? (
            <Empty icon={Inbox} title={view === 'pending' ? 'No one is waiting' : `No ${view} requests`} body={view === 'pending' ? 'Students who sign up with a personal email and ask to join your college appear here.' : 'Decided requests are listed here.'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `1px solid ${tokens.hairline}`, color: tokens.inkFaint }}>
                  <th className={th}>Person</th><th className={th}>Roll no.</th><th className={th}>Branch</th><th className={th}>Semester</th><th className={th}>{view === 'pending' ? 'Asked' : 'Decided'}</th><th className={th}><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {list.data.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
                      <td className={td}>
                        <div className="font-medium" style={{ color: tokens.ink }}>{r.name}</div>
                        <div className="text-[11px]" style={{ color: tokens.inkFaint }}>{r.email}</div>
                        {r.note ? <div className="text-xs mt-1" style={{ color: tokens.inkSoft }}>“{r.note}”</div> : null}
                        {r.reason ? <div className="text-xs mt-1" style={{ color: tokens.inkSoft }}>Reason: {r.reason}</div> : null}
                      </td>
                      <td className={td}>
                        <span className="font-medium" style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>{r.rollNumber}</span>
                        {r.warning ? <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: tokens.yellowText }}><AlertTriangle className="w-3 h-3" aria-hidden />{r.warning}</div> : null}
                      </td>
                      <td className={td}><TagChip>{r.branch}</TagChip></td>
                      <td className={td} style={{ color: tokens.inkSoft }}>Sem {r.semester} · Year {r.year}</td>
                      <td className={td} style={{ color: tokens.inkSoft }}>{timeAgo(view === 'pending' ? r.createdAt : r.decidedAt)}</td>
                      <td className={`${td} text-right whitespace-nowrap`}>
                        {view === 'pending' ? (
                          <div className="inline-flex gap-2">
                            <Button variant="secondary" onClick={() => setRejecting(r)} disabled={busyId === r.id}><X className="w-4 h-4" aria-hidden /> Reject</Button>
                            <Button onClick={() => decide(r, 'approve')} loading={busyId === r.id}><Check className="w-4 h-4" aria-hidden /> Approve</Button>
                          </div>
                        ) : <StatusPill kind={view === 'approved' ? 'approved' : 'closed'}>{view}</StatusPill>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {rejecting && (
        <Modal title={`Reject ${rejecting.name}?`} onClose={() => setRejecting(null)} footer={<>
          <Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => decide(rejecting, 'reject', { reason })} loading={busyId === rejecting.id}>Reject</Button>
        </>}>
          <Field label="Reason (shown to them)" htmlFor="reject-reason" hint="For example: roll number not found. They can fix it and ask again.">
            <TextArea id="reject-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Roll number not on our list." />
          </Field>
        </Modal>
      )}
    </div>
  )
}
