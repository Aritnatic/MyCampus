import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../../utils/format'
import { BookOpen, Calendar, Plus, Edit, Trash2, Eye, Upload, AlertTriangle, Clock } from 'lucide-react'

export const EXAM_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const EXAM_TYPE_OPTIONS = [
  { value: 'theory', label: 'Theory' },
  { value: 'lab', label: 'Lab' },
  { value: 'viva', label: 'Viva' },
]

export const branches = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT', 'EEE']

export function createExamColumns({ onRowAction, actionsWidth = '140px' } = {}) {
  const columns = [
    createColumn({
      key: 'title',
      header: 'Exam',
      width: '320px',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-admin-900 truncate max-w-xs">{truncate(val, 55)}</p>
          <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{row.branch} - Sem {row.semester} ({row.type})</span>
          </p>
        </div>
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
      key: 'type',
      header: 'Type',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600 capitalize">{val}</span>
      ),
    }),
    createColumn({
      key: 'startDate',
      header: 'Start Date',
      width: '130px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatDate(val)}</span>
      ),
    }),
    createColumn({
      key: 'endDate',
      header: 'End Date',
      width: '130px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatDate(val)}</span>
      ),
    }),
    createColumn({
      key: 'venue',
      header: 'Venue',
      width: '200px',
      sortable: false,
      render: (val) => (
        <span className="text-sm text-admin-600 flex items-center gap-1">
          <span className="w-3 h-3" />{truncate(val, 35)}
        </span>
      ),
    }),
    createColumn({
      key: 'totalStudents',
      header: 'Students',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'resultsPublished',
      header: 'Results',
      width: '100px',
      sortable: true,
      render: (val, row) => (
        <AdminBadge status={val ? 'published' : 'pending'} size="sm" variant="dot" />
      ),
    }),
    createColumn({
      key: 'subjects',
      header: 'Subjects',
      width: '90px',
      sortable: false,
      render: (_, row) => (
        <span className="text-sm text-admin-500 flex items-center gap-1">
          <span className="w-3 h-3" />{row.subjects?.length || 0} papers
        </span>
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

// Quick filter configurations for exams
export const examQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'scheduled', label: 'Scheduled', count: null },
  { value: 'published', label: 'Published', count: null },
  { value: 'ongoing', label: 'Ongoing', count: null },
  { value: 'completed', label: 'Completed', count: null },
  { value: 'draft', label: 'Draft', count: null },
  { value: 'cancelled', label: 'Cancelled', count: null },
]

// Filter bar configurations for exams
export const examFilters = [
  {
    key: 'status',
    type: 'select',
    placeholder: 'Status',
    options: EXAM_STATUS_OPTIONS,
    allLabel: 'All Status',
    width: 44,
  },
  {
    key: 'branch',
    type: 'select',
    placeholder: 'Branch',
    options: branches.map(b => ({ value: b, label: b })),
    allLabel: 'All Branches',
    width: 44,
  },
  {
    key: 'type',
    type: 'select',
    placeholder: 'Type',
    options: EXAM_TYPE_OPTIONS,
    allLabel: 'All Types',
    width: 40,
  },
]

// Stats bar configurations for exams
export function createExamStats(data) {
  const total = data.length
  const scheduled = data.filter(e => e.status === 'scheduled').length
  const ongoing = data.filter(e => e.status === 'ongoing').length
  const completed = data.filter(e => e.status === 'completed').length
  const draft = data.filter(e => e.status === 'draft').length
  const resultsPublished = data.filter(e => e.resultsPublished).length
  const totalStudents = data.reduce((sum, e) => sum + (e.totalStudents || 0), 0)

  return [
    { key: 'total', label: 'Total Exams', value: total, trend: 0, icon: () => <BookOpen className="w-5 h-5 text-primary-600" /> },
    { key: 'scheduled', label: 'Scheduled', value: scheduled, trend: 0, icon: () => <Calendar className="w-5 h-5 text-warning-600" />, iconBg: 'bg-warning-100' },
    { key: 'ongoing', label: 'Ongoing', value: ongoing, trend: 0, icon: () => <Clock className="w-5 h-5 text-info-600" />, iconBg: 'bg-info-100' },
    { key: 'completed', label: 'Completed', value: completed, trend: 0, icon: () => <span className="w-5 h-5 text-success-600">✓</span>, iconBg: 'bg-success-100' },
    { key: 'results', label: 'Results Published', value: resultsPublished, trend: 0, icon: () => <span className="w-5 h-5 text-primary-600">📊</span>, iconBg: 'bg-primary-100' },
  ]
}

// Initial form data for creating/editing exams
export const initialExamForm = {
  title: '',
  branch: 'CSE',
  semester: 3,
  type: 'theory',
  status: 'draft',
  startDate: '',
  endDate: '',
  venue: '',
  subjects: [],
}

// Form sections configuration for exam modal
export const examFormSections = [
  {
    title: 'Exam Details',
    fields: [
      { type: 'text', name: 'title', label: 'Exam Title', required: true, placeholder: 'e.g., Mid-Semester Examination - CSE 3rd Semester' },
    ],
  },
  {
    title: 'Classification & Status',
    fields: [
      { type: 'select', name: 'branch', label: 'Branch', options: branches.map(b => ({ value: b, label: b })), required: true },
      { type: 'number', name: 'semester', label: 'Semester', min: 1, max: 8, required: true },
      { type: 'select', name: 'type', label: 'Type', options: EXAM_TYPE_OPTIONS, required: true },
      { type: 'select', name: 'status', label: 'Status', options: EXAM_STATUS_OPTIONS, required: true },
    ],
  },
  {
    title: 'Schedule & Venue',
    fields: [
      { type: 'date', name: 'startDate', label: 'Start Date', required: true },
      { type: 'date', name: 'endDate', label: 'End Date', required: true },
      { type: 'text', name: 'venue', label: 'Venue', required: true, placeholder: 'e.g., Exam Hall A, B, C' },
    ],
  },
  {
    title: 'Subjects / Papers',
    fields: [
      { type: 'custom', name: 'subjects', label: 'Subjects', render: () => null }, // Handled separately
    ],
  },
]

export function mapExamToForm(exam) {
  return {
    title: exam.title,
    branch: exam.branch,
    semester: exam.semester,
    type: exam.type,
    status: exam.status,
    startDate: exam.startDate ? exam.startDate.split('T')[0] : '',
    endDate: exam.endDate ? exam.endDate.split('T')[0] : '',
    venue: exam.venue,
    subjects: exam.subjects?.map(s => ({
      code: s.code,
      name: s.name,
      date: s.date,
      time: s.time,
      faculty: s.faculty,
    })) || [],
  }
}

export function mapFormToExam(formData, existingExam = {}) {
  return {
    ...existingExam,
    title: formData.title,
    branch: formData.branch,
    semester: parseInt(formData.semester) || 3,
    type: formData.type,
    status: formData.status,
    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    venue: formData.venue,
    subjects: formData.subjects || [],
    updatedAt: new Date().toISOString(),
  }
}