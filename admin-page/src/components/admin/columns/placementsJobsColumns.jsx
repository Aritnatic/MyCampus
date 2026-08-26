import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate } from '../../../utils/format'
import { Building2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'

// Job type options for badge rendering
export const JOB_TYPE_OPTIONS = [
  { value: 'internship', label: 'Internship' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

export const JOB_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'on-hold', label: 'On Hold' },
]

export const branches = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT', 'EEE']

export const locationsOptions = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Bhubaneswar',
  'Mysuru', 'Gurgaon', 'Noida', 'Ahmedabad', 'Chandigarh', 'Coimbatore', 'Kochi', 'Indore'
]

export function createJobColumns({ onRowAction, actionsWidth = '120px' } = {}) {
  const columns = [
    createColumn({
      key: 'title',
      header: 'Role',
      width: '280px',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-admin-900 truncate max-w-xs">{truncate(val, 45)}</p>
          <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{row.company}</span>
          </p>
        </div>
      ),
    }),
    createColumn({
      key: 'type',
      header: 'Type',
      width: '110px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" variant="outline" />
      ),
    }),
    createColumn({
      key: 'status',
      header: 'Status',
      width: '100px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" />
      ),
    }),
    createColumn({
      key: 'branch',
      header: 'Branches',
      width: '140px',
      sortable: false,
      render: (val) => (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 3).map((b, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 bg-admin-100 text-admin-600 rounded">{b}</span>
          ))}
          {val.length > 3 && <span className="text-xs text-admin-400">+{val.length - 3}</span>}
        </div>
      ),
    }),
    createColumn({
      key: 'stipend',
      header: 'Package',
      width: '130px',
      sortable: true,
      render: (_, row) => {
        const { min, max, period } = row.stipend || {}
        return (
          <span className="text-sm font-medium text-admin-600">
            ₹{formatNumber(min)}-{formatNumber(max)}
            {period === 'year' ? '/yr' : '/mo'}
          </span>
        )
      },
    }),
    createColumn({
      key: 'openings',
      header: 'Openings',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'applications',
      header: 'Applications',
      width: '110px',
      sortable: true,
      render: (val, row) => (
        <div className="text-sm">
          <span className="text-admin-600">{formatNumber(val)}</span>
          {row.selected > 0 && (
            <span className="text-success-600 ml-1">({row.selected} selected)</span>
          )}
        </div>
      ),
    }),
    createColumn({
      key: 'deadline',
      header: 'Deadline',
      width: '120px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
      ),
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

// Quick filter configurations for jobs
export const jobQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'open', label: 'Open', count: null },
  { value: 'closed', label: 'Closed', count: null },
  { value: 'draft', label: 'Draft', count: null },
  { value: 'on-hold', label: 'On Hold', count: null },
]

// Filter bar configurations for jobs
export const jobFilters = [
  {
    key: 'status',
    type: 'select',
    placeholder: 'Status',
    options: JOB_STATUS_OPTIONS,
    allLabel: 'All Status',
    width: 40,
  },
  {
    key: 'type',
    type: 'select',
    placeholder: 'Type',
    options: JOB_TYPE_OPTIONS,
    allLabel: 'All Types',
    width: 40,
  },
  {
    key: 'branch',
    type: 'multiselect',
    placeholder: 'Branch',
    options: branches.map(b => ({ value: b, label: b })),
    width: 48,
  },
]

// Stats bar configurations for jobs
export function createJobStats(data) {
  const total = data.length
  const open = data.filter(j => j.status === 'open').length
  const closed = data.filter(j => j.status === 'closed').length
  const draft = data.filter(j => j.status === 'draft').length
  const totalOpenings = data.reduce((sum, j) => sum + (j.openings || 0), 0)
  const totalApplications = data.reduce((sum, j) => sum + (j.applications || 0), 0)

  return [
    { key: 'total', label: 'Total Jobs', value: total, trend: 0, icon: () => <span className="w-5 h-5 text-primary-600">📋</span> },
    { key: 'open', label: 'Open', value: open, trend: 0, icon: () => <span className="w-5 h-5 text-success-600">🟢</span>, iconBg: 'bg-success-100' },
    { key: 'closed', label: 'Closed', value: closed, trend: 0, icon: () => <span className="w-5 h-5 text-danger-600">🔴</span>, iconBg: 'bg-danger-100' },
    { key: 'draft', label: 'Draft', value: draft, trend: 0, icon: () => <span className="w-5 h-5 text-warning-600">🟡</span>, iconBg: 'bg-warning-100' },
    { key: 'openings', label: 'Total Openings', value: totalOpenings, trend: 0, icon: () => <TrendingUp className="w-5 h-5 text-info-600" />, iconBg: 'bg-info-100' },
  ]
}

// Initial form data for creating/editing jobs
export const initialJobForm = {
  title: '',
  company: '',
  type: 'internship',
  status: 'draft',
  branch: [],
  cgpaCutoff: 6.0,
  stipendMin: '',
  stipendMax: '',
  stipendPeriod: 'month',
  locations: [],
  openings: '',
  deadline: '',
  description: '',
  skills: [],
  mode: 'onsite',
  batch: '2025',
  verified: false,
}

// Form sections configuration for job modal
export const jobFormSections = [
  {
    title: 'Basic Details',
    fields: [
      { type: 'text', name: 'title', label: 'Job Title', required: true, placeholder: 'e.g., Software Engineer Intern' },
      { type: 'text', name: 'company', label: 'Company Name', required: true, placeholder: 'e.g., Tata Consultancy Services' },
      { type: 'select', name: 'type', label: 'Type', options: JOB_TYPE_OPTIONS, required: true },
      { type: 'select', name: 'status', label: 'Status', options: JOB_STATUS_OPTIONS, required: true },
      { type: 'select', name: 'mode', label: 'Work Mode', options: [
        { value: 'onsite', label: 'On-site' },
        { value: 'remote', label: 'Remote' },
        { value: 'hybrid', label: 'Hybrid' },
      ], required: true },
    ],
  },
  {
    title: 'Compensation & Requirements',
    fields: [
      { type: 'number', name: 'stipendMin', label: 'Min Package (₹)', placeholder: '25000' },
      { type: 'number', name: 'stipendMax', label: 'Max Package (₹)', placeholder: '30000' },
      { type: 'select', name: 'stipendPeriod', label: 'Period', options: [
        { value: 'month', label: 'Per Month' },
        { value: 'year', label: 'Per Year' },
      ] },
      { type: 'number', name: 'openings', label: 'Openings', placeholder: '10' },
      { type: 'number', name: 'cgpaCutoff', label: 'CGPA Cutoff', min: 0, max: 10, step: 0.1, placeholder: '6.0' },
      { type: 'date', name: 'deadline', label: 'Application Deadline' },
      { type: 'text', name: 'batch', label: 'Batch Year', placeholder: '2025' },
      { type: 'checkbox', name: 'verified', label: 'Verified Posting' },
    ],
  },
  {
    title: 'Eligible Branches',
    fields: [
      { type: 'chips', name: 'branch', label: 'Eligible Branches', options: branches.map(b => ({ value: b, label: b })), description: 'Select branches eligible to apply' },
    ],
  },
  {
    title: 'Locations',
    fields: [
      { type: 'chips', name: 'locations', label: 'Job Locations', options: locationsOptions.map(l => ({ value: l, label: l })), description: 'Select locations' },
    ],
  },
  {
    title: 'Required Skills',
    fields: [
      { type: 'text', name: 'skills', label: 'Skills (comma-separated)', placeholder: 'e.g., Java, Python, SQL, Data Structures' },
    ],
  },
  {
    title: 'Description',
    fields: [
      { type: 'textarea', name: 'description', label: 'Job Description', rows: 5, placeholder: 'Describe the role, requirements, selection process, etc.' },
    ],
  },
]

export function mapJobToForm(job) {
  return {
    title: job.title,
    company: job.company,
    type: job.type,
    status: job.status,
    mode: job.mode,
    stipendMin: job.stipend?.min || '',
    stipendMax: job.stipend?.max || '',
    stipendPeriod: job.stipend?.period || 'month',
    openings: job.openings || '',
    cgpaCutoff: job.cgpaCutoff || 6.0,
    deadline: job.deadline ? job.deadline.split('T')[0] : '',
    batch: job.batch || '2025',
    verified: job.verified || false,
    branch: job.branch || [],
    locations: job.locations || [],
    skills: (job.skills || []).join(', '),
    description: job.description || '',
  }
}

export function mapFormToJob(formData, existingJob = {}) {
  return {
    ...existingJob,
    title: formData.title,
    company: formData.company,
    type: formData.type,
    status: formData.status,
    mode: formData.mode,
    stipend: {
      min: parseInt(formData.stipendMin) || 0,
      max: parseInt(formData.stipendMax) || 0,
      currency: 'INR',
      period: formData.stipendPeriod,
    },
    openings: parseInt(formData.openings) || 0,
    cgpaCutoff: parseFloat(formData.cgpaCutoff) || 6.0,
    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
    batch: formData.batch,
    verified: formData.verified || false,
    branch: formData.branch || [],
    locations: formData.locations || [],
    skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
    description: formData.description,
    updatedAt: new Date().toISOString(),
  }
}