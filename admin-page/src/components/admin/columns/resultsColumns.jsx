import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../../utils/format'
import { FileText, Upload, Download, Eye, CheckCircle, XCircle, AlertTriangle, BookOpen } from 'lucide-react'

export const RESULT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'published', label: 'Published' },
]

export function createResultColumns({ getExamById, onRowAction, actionsWidth = '140px' } = {}) {
  const columns = [
    createColumn({
      key: 'examId',
      header: 'Exam',
      width: '320px',
      sortable: true,
      render: (val, row) => {
        const exam = getExamById?.(val)
        return (
          <div>
            <p className="font-medium text-admin-900 truncate max-w-xs">{exam ? truncate(exam.title, 55) : 'Unknown Exam'}</p>
            <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
              {exam && (
                <>
                  <BookOpen className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{exam.branch} - Sem {exam.semester}</span>
                </>
              )}
            </p>
          </div>
        )
      },
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
      key: 'totalStudents',
      header: 'Students',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'passed',
      header: 'Passed',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm font-medium text-success-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'failed',
      header: 'Failed',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm font-medium text-danger-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'passPercentage',
      header: 'Pass %',
      width: '90px',
      sortable: true,
      render: (_, row) => {
        const passed = row.passed || 0
        const total = row.totalStudents || 1
        const pct = ((passed / total) * 100).toFixed(1)
        return (
          <span className={`text-sm font-medium ${passed === total ? 'text-success-600' : pct >= 80 ? 'text-primary-600' : pct >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
            {pct}%
          </span>
        )
      },
    }),
    createColumn({
      key: 'averagePercentage',
      header: 'Avg %',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{val ? val.toFixed(1) + '%' : '—'}</span>
      ),
    }),
    createColumn({
      key: 'uploadedAt',
      header: 'Uploaded',
      width: '130px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
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

// Quick filter configurations for results
export const resultQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'pending', label: 'Pending', count: null },
  { value: 'uploaded', label: 'Uploaded', count: null },
  { value: 'published', label: 'Published', count: null },
]

// Filter bar configurations for results
export const resultFilters = [
  {
    key: 'status',
    type: 'select',
    placeholder: 'Status',
    options: RESULT_STATUS_OPTIONS,
    allLabel: 'All Status',
    width: 44,
  },
  {
    key: 'branch',
    type: 'select',
    placeholder: 'Branch',
    options: [
      'CSE', 'ECE', 'CE', 'EE', 'ME', 'IT', 'EEE'
    ].map(b => ({ value: b, label: b })),
    allLabel: 'All Branches',
    width: 44,
  },
]

// Stats bar configurations for results
export function createResultStats(data) {
  const total = data.length
  const pending = data.filter(r => r.status === 'pending').length
  const uploaded = data.filter(r => r.status === 'uploaded').length
  const published = data.filter(r => r.status === 'published').length
  const totalStudents = data.reduce((sum, r) => sum + (r.totalStudents || 0), 0)
  const totalPassed = data.reduce((sum, r) => sum + (r.passed || 0), 0)
  const overallPassPct = totalStudents > 0 ? ((totalPassed / totalStudents) * 100).toFixed(1) : 0

  return [
    { key: 'total', label: 'Total Results', value: total, trend: 0, icon: () => <FileText className="w-5 h-5 text-primary-600" /> },
    { key: 'pending', label: 'Pending Upload', value: pending, trend: 0, icon: () => <AlertTriangle className="w-5 h-5 text-warning-600" />, iconBg: 'bg-warning-100' },
    { key: 'uploaded', label: 'Ready to Publish', value: uploaded, trend: 0, icon: () => <Upload className="w-5 h-5 text-info-600" />, iconBg: 'bg-info-100' },
    { key: 'published', label: 'Published', value: published, trend: 0, icon: () => <CheckCircle className="w-5 h-5 text-success-600" />, iconBg: 'bg-success-100' },
    { key: 'passPct', label: 'Overall Pass %', value: `${overallPassPct}%`, trend: 0, icon: () => <span className="w-5 h-5 text-primary-600">📈</span>, iconBg: 'bg-primary-100' },
  ]
}

// Initial form data for creating/editing results
export const initialResultForm = {
  examId: '',
  status: 'pending',
  fileName: '',
}

// Form sections configuration for result modal
export const resultFormSections = [
  {
    title: 'Exam Selection',
    fields: [
      { type: 'custom', name: 'examId', label: 'Select Exam', render: () => null }, // Handled separately
    ],
  },
  {
    title: 'Results File',
    fields: [
      { type: 'file', name: 'fileName', label: 'Results CSV File', accept: '.csv,.xlsx,.xls', required: true },
      { type: 'custom', name: 'fileInfo', render: () => (
        <p className="text-sm text-admin-500 mt-1">
          Upload CSV with columns: Student ID, Name, Subject Codes..., Total, Percentage, Grade
        </p>
      )},
    ],
  },
  {
    title: 'Status',
    fields: [
      { type: 'select', name: 'status', label: 'Status', options: RESULT_STATUS_OPTIONS, required: true },
    ],
  },
]

export function mapResultToForm(result, exams = []) {
  const exam = exams.find(e => e.id === result.examId)
  return {
    examId: result.examId,
    examTitle: exam?.title,
    status: result.status,
    fileName: result.fileName,
    totalStudents: result.totalStudents,
    passed: result.passed,
    failed: result.failed,
    averagePercentage: result.averagePercentage,
  }
}

export function mapFormToResult(formData, existingResult = {}) {
  return {
    ...existingResult,
    examId: formData.examId,
    status: formData.status,
    fileName: formData.fileName,
    uploadedAt: formData.status !== 'pending' && !existingResult.uploadedAt ? new Date().toISOString() : existingResult.uploadedAt,
    publishedAt: formData.status === 'published' && !existingResult.publishedAt ? new Date().toISOString() : existingResult.publishedAt,
    updatedAt: new Date().toISOString(),
  }
}