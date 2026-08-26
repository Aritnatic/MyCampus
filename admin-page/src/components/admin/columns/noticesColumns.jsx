import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../../utils/format'
import { FileText, Calendar, Plus, Edit, Trash2, Eye, Pin, PinOff, AlertTriangle } from 'lucide-react'

export const NOTICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export const NOTICE_CATEGORY_OPTIONS = [
  { value: 'academic', label: 'Academic' },
  { value: 'general', label: 'General' },
  { value: 'safety', label: 'Safety' },
  { value: 'placement', label: 'Placement' },
]

export const NOTICE_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export const NOTICE_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'students', label: 'Students' },
  { value: 'faculty', label: 'Faculty' },
]

export const branches = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT', 'EEE']

export function createNoticeColumns({ onRowAction, actionsWidth = '120px' } = {}) {
  const columns = [
    createColumn({
      key: 'title',
      header: 'Title',
      width: '350px',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-start gap-2">
          {row.pinned && <Pin className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" title="Pinned" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-admin-900 truncate max-w-xs">{truncate(val, 55)}</p>
            <p className="text-sm text-admin-500 mt-0.5 truncate max-w-xs">{truncate(row.body, 90)}</p>
          </div>
        </div>
      ),
    }),
    createColumn({
      key: 'category',
      header: 'Category',
      width: '110px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" variant="outline" />
      ),
    }),
    createColumn({
      key: 'status',
      header: 'Status',
      width: '120px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" />
      ),
    }),
    createColumn({
      key: 'priority',
      header: 'Priority',
      width: '90px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" variant="dot" />
      ),
    }),
    createColumn({
      key: 'publishedAt',
      header: 'Published',
      width: '130px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
      ),
    }),
    createColumn({
      key: 'expiresAt',
      header: 'Expires',
      width: '130px',
      sortable: true,
      render: (val, row) => {
        if (!val) return <span className="text-sm text-admin-400">No expiry</span>
        const isExpired = new Date(val) < new Date()
        return (
          <span className={`text-sm ${isExpired ? 'text-danger-600 font-medium' : 'text-admin-600'}`}>
            {formatDate(val)}
            {isExpired && <AlertTriangle className="w-3 h-3 inline ml-1" title="Expired" />}
          </span>
        )
      },
    }),
  ]

  // Add actions column if handler provided
  if (onRowAction) {
    return [
      ...columns,
      createColumn({
        key: '__actions__',
        header: 'Actions',
        width: actionsWidth,
        sortable: false,
        align: 'right',
        render: (_, row) => onRowAction(row),
      }),
    ]
  }

  return columns
}

// Quick filter configurations for notices
export const noticeQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'published', label: 'Published', count: null },
  { value: 'draft', label: 'Draft', count: null },
  { value: 'archived', label: 'Archived', count: null },
  { value: 'pinned', label: 'Pinned', count: null },
]

// Filter bar configurations for notices
export const noticeFilters = [
  {
    key: 'status',
    type: 'select',
    placeholder: 'Status',
    options: NOTICE_STATUS_OPTIONS,
    allLabel: 'All Status',
    width: 40,
  },
  {
    key: 'category',
    type: 'select',
    placeholder: 'Category',
    options: NOTICE_CATEGORY_OPTIONS,
    allLabel: 'All Categories',
    width: 48,
  },
  {
    key: 'priority',
    type: 'select',
    placeholder: 'Priority',
    options: NOTICE_PRIORITY_OPTIONS,
    allLabel: 'All Priorities',
    width: 44,
  },
]

// Stats bar configurations for notices
export function createNoticeStats(data) {
  const total = data.length
  const published = data.filter(n => n.status === 'published').length
  const draft = data.filter(n => n.status === 'draft').length
  const archived = data.filter(n => n.status === 'archived').length
  const pinned = data.filter(n => n.pinned).length
  const urgent = data.filter(n => n.priority === 'urgent').length

  return [
    { key: 'total', label: 'Total Notices', value: total, trend: 0, icon: () => <FileText className="w-5 h-5 text-primary-600" /> },
    { key: 'published', label: 'Published', value: published, trend: 0, icon: () => <span className="w-5 h-5 text-success-600">🟢</span>, iconBg: 'bg-success-100' },
    { key: 'draft', label: 'Drafts', value: draft, trend: 0, icon: () => <span className="w-5 h-5 text-admin-400">📝</span>, iconBg: 'bg-admin-100' },
    { key: 'pinned', label: 'Pinned', value: pinned, trend: 0, icon: () => <Pin className="w-5 h-5 text-warning-600" />, iconBg: 'bg-warning-100' },
    { key: 'urgent', label: 'Urgent', value: urgent, trend: 0, icon: () => <AlertTriangle className="w-5 h-5 text-danger-600" />, iconBg: 'bg-danger-100' },
  ]
}

// Initial form data for creating/editing notices
export const initialNoticeForm = {
  title: '',
  body: '',
  category: 'academic',
  status: 'draft',
  priority: 'normal',
  targetAudience: 'students',
  branches: [],
  pinned: false,
  expiresAt: '',
}

// Form sections configuration for notice modal
export const noticeFormSections = [
  {
    title: 'Content',
    fields: [
      { type: 'text', name: 'title', label: 'Title', required: true, placeholder: 'e.g., Semester Registration Opens for Even Sem 2024' },
      { type: 'textarea', name: 'body', label: 'Content', rows: 6, required: true, placeholder: 'Write the notice content here...' },
    ],
  },
  {
    title: 'Classification',
    fields: [
      { type: 'select', name: 'category', label: 'Category', options: NOTICE_CATEGORY_OPTIONS, required: true },
      { type: 'select', name: 'status', label: 'Status', options: NOTICE_STATUS_OPTIONS, required: true },
      { type: 'select', name: 'priority', label: 'Priority', options: NOTICE_PRIORITY_OPTIONS, required: true },
      { type: 'select', name: 'targetAudience', label: 'Target Audience', options: NOTICE_AUDIENCE_OPTIONS, required: true },
    ],
  },
  {
    title: 'Targeting & Expiry',
    fields: [
      { type: 'chips', name: 'branches', label: 'Target Branches', options: branches.map(b => ({ value: b, label: b })), description: 'Leave empty for all branches' },
      { type: 'checkbox', name: 'pinned', label: 'Pin to top' },
      { type: 'date', name: 'expiresAt', label: 'Expires At (Optional)' },
    ],
  },
]

export function mapNoticeToForm(notice) {
  return {
    title: notice.title,
    body: notice.body,
    category: notice.category,
    status: notice.status,
    priority: notice.priority,
    targetAudience: notice.targetAudience,
    branches: notice.branches || [],
    pinned: notice.pinned || false,
    expiresAt: notice.expiresAt ? notice.expiresAt.split('T')[0] : '',
  }
}

export function mapFormToNotice(formData, existingNotice = {}) {
  return {
    ...existingNotice,
    title: formData.title,
    body: formData.body,
    category: formData.category,
    status: formData.status,
    priority: formData.priority,
    targetAudience: formData.targetAudience,
    branches: formData.branches || [],
    pinned: formData.pinned || false,
    expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    updatedAt: new Date().toISOString(),
  }
}