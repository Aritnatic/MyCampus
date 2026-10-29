import React, { useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet } from 'lucide-react'
import { request } from '../../api'
import { Button, Modal, td, th } from './kit'
import { tokens } from '../../theme'

// Parses a CSV (quoted fields, escaped quotes, CRLF, BOM) into an array of objects keyed by normalised header.
export function parseCsv(text) {
  const rows = []
  let row = [], cell = '', quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i += 1 } else if (c === '"') quoted = false; else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some((x) => x.trim() !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x.trim() !== '')) rows.push(row)
  if (rows.length < 2) return []

  // Accept the headers people actually type: "Full Name", "College email", "Sem"…
  const alias = (h) => {
    const k = h.trim().toLowerCase().replace(/[^a-z]/g, '')
    if (['name', 'fullname', 'studentname'].includes(k)) return 'name'
    if (['email', 'collegeemail', 'emailaddress', 'mail'].includes(k)) return 'email'
    if (['branch', 'department', 'dept', 'stream'].includes(k)) return 'branch'
    if (['year'].includes(k)) return 'year'
    if (['semester', 'sem'].includes(k)) return 'semester'
    return k
  }
  const headers = rows[0].map(alias)
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()]).filter(([h, v]) => h && v !== '')))
}

const TEMPLATE = 'name,email,branch,year,semester\nAsha Verma,asha.verma@students.college.edu.in,ECE,2,3\nBikram Nayak,bikram.nayak@students.college.edu.in,CSE,1,1\n'

export default function ImportStudentsModal({ onClose, onImported }) {
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [report, setReport] = useState(null)
  const [invite, setInvite] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const choose = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null); setReport(null); setResult(null)
    setFileName(file.name)
    if (file.size > 2 * 1024 * 1024) return setError('That file is over 2 MB. Split it into smaller files.')
    const parsed = parseCsv(await file.text())
    if (parsed.length === 0) return setError('No student rows found. The first row must be a header (name, email, branch, year, semester).')
    if (!parsed[0].email || !parsed[0].name) return setError('The file needs "name" and "email" columns.')
    setRows(parsed)
    setBusy(true)
    try {
      setReport(await request('/admin/students/import', { method: 'POST', body: { rows: parsed, dryRun: true } }))
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  const run = async () => {
    setBusy(true); setError(null)
    try {
      setResult(await request('/admin/students/import', { method: 'POST', body: { rows, sendInvites: invite } }))
      onImported()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: 'students-template.csv' }).click()
    URL.revokeObjectURL(url)
  }

  if (result) {
    return (
      <Modal title="Import finished" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
        <div className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: tokens.greenText }} aria-hidden />
          <div className="text-sm" style={{ color: tokens.inkSoft }}>
            <p style={{ color: tokens.ink }}><strong>{result.created}</strong> {result.created === 1 ? 'student was' : 'students were'} added{result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.</p>
            <p className="mt-2">{result.invitesQueued ? `Invitation emails are being sent. ` : 'No emails were sent. '}Each student opens the app, chooses <strong style={{ color: tokens.ink }}>Forgot password?</strong>, enters their college email and sets their own password.</p>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Import students from a CSV" onClose={onClose} size="xl" footer={report && report.created > 0 ? (
      <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={run} loading={busy}>Import {report.created} {report.created === 1 ? 'student' : 'students'}</Button></>
    ) : <Button variant="secondary" onClick={onClose}>Close</Button>}>
      <p className="text-sm mb-3" style={{ color: tokens.inkSoft }}>Columns: <code>name</code>, <code>email</code>, and optionally <code>branch</code>, <code>year</code>, <code>semester</code>. Emails must be on your college's verified domains. Nothing is created until you confirm.</p>
      <div className="flex items-center gap-3 mb-4">
        <label className="inline-flex items-center gap-2 px-3 h-9 text-[13px] font-medium cursor-pointer" style={{ border: `1px solid ${tokens.hairline}`, borderRadius: 10, color: tokens.ink }}>
          <FileSpreadsheet className="w-4 h-4" aria-hidden /> {fileName || 'Choose CSV file'}
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={choose} aria-label="Choose CSV file" />
        </label>
        <button type="button" onClick={download} className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: tokens.violetText }}><Download className="w-3.5 h-3.5" aria-hidden /> Download a template</button>
      </div>
      {error ? <p role="alert" className="text-sm mb-3" style={{ color: tokens.red }}>{error}</p> : null}
      {busy && !report ? <p className="text-sm" style={{ color: tokens.inkSoft }}>Checking the file…</p> : null}
      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Count label="In the file" value={rows.length} />
            <Count label="Will be added" value={report.created} color={tokens.greenText} />
            <Count label="Will be skipped" value={report.skipped.length} color={report.skipped.length ? tokens.yellowText : tokens.inkSoft} />
          </div>
          {report.skipped.length > 0 && (
            <div style={{ border: `1px solid ${tokens.hairline}`, borderRadius: 10, maxHeight: 220, overflowY: 'auto' }}>
              <table className="w-full"><thead><tr style={{ color: tokens.inkFaint, borderBottom: `1px solid ${tokens.hairline}` }}><th className={th}>Line</th><th className={th}>Email</th><th className={th}>Why it's skipped</th></tr></thead>
                <tbody>{report.skipped.map((s) => <tr key={s.line} style={{ borderBottom: `1px solid ${tokens.hairline2}` }}><td className={td} style={{ color: tokens.inkSoft }}>{s.line}</td><td className={td} style={{ color: tokens.ink }}>{s.email ?? '—'}</td><td className={td} style={{ color: tokens.inkSoft }}>{s.reason}</td></tr>)}</tbody></table>
            </div>
          )}
          {report.created > 0 && (
            <label className="flex items-start gap-2 text-sm" style={{ color: tokens.ink }}>
              <input type="checkbox" className="mt-1" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
              <span>Email each new student an invitation <span style={{ color: tokens.inkFaint }}>(otherwise they can still claim the account from the app)</span></span>
            </label>
          )}
        </div>
      )}
    </Modal>
  )
}

function Count({ label, value, color = tokens.ink }) {
  return <div className="p-3" style={{ background: tokens.sunken, borderRadius: 10 }}><div className="text-2xl font-semibold" style={{ color }}>{value}</div><div className="text-xs" style={{ color: tokens.inkFaint }}>{label}</div></div>
}
