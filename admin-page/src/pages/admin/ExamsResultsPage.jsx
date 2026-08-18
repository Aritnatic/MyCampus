import React, { useState } from 'react'
import { AdminTabs, TabPanel } from '../../components/admin/AdminTabs'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton, FormRow, AdminConfirmDialog, FormSection } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../utils/format'
import {
  getExamsByUniversity,
  getExamById,
  exams,
} from '../../data/exams'
import {
  getResultsByUniversity,
  getResultByExamId,
  results,
} from '../../data/exams'
import { currentAdmin } from '../../data/admin'
import {
  BookOpen,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react'

const examStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const examTypeOptions = [
  { value: 'theory', label: 'Theory' },
  { value: 'lab', label: 'Lab' },
  { value: 'viva', label: 'Viva' },
]

const resultStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'published', label: 'Published' },
]

const branches = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT', 'EEE']

const initialExamForm = {
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

const initialResultForm = {
  examId: '',
  status: 'pending',
  fileName: '',
}

export default function ExamsResultsPage({ defaultTab = 'exams' }) {
  const uniId = currentAdmin.university
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [examsData] = useState(getExamsByUniversity(uniId))
  const [resultsData] = useState(getResultsByUniversity(uniId))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [examModalOpen, setExamModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [editingResult, setEditingResult] = useState(null)
  const [examForm, setExamForm] = useState(initialExamForm)
  const [resultForm, setResultForm] = useState(initialResultForm)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null })
  const [subjects, setSubjects] = useState([{ code: '', name: '', date: '', time: '', faculty: '' }])
  const [selectedFile, setSelectedFile] = useState(null)

  // Filter functions
  const filteredExams = examsData.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.branch.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredResults = resultsData.filter(r => {
    const exam = getExamById(r.examId)
    const matchesSearch = exam?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam?.branch.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Exam columns
  const examColumns = [
    createColumn({ key: 'title', header: 'Exam', width: '30%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{truncate(val, 50)}</p>
        <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {row.branch} - Sem {row.semester} ({row.type})
        </p>
      </div>
    )}),
    createColumn({ key: 'status', header: 'Status', width: '130px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'startDate', header: 'Start Date', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{formatDate(val)}</span>
    )}),
    createColumn({ key: 'endDate', header: 'End Date', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{formatDate(val)}</span>
    )}),
    createColumn({ key: 'venue', header: 'Venue', width: '200px', render: (val) => (
      <span className="text-sm text-admin-600">{truncate(val, 30)}</span>
    )}),
    createColumn({ key: 'totalStudents', header: 'Students', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'resultsPublished', header: 'Results', width: '100px', render: (val, row) => (
      <AdminBadge status={val ? 'published' : 'pending'} size="sm" variant="dot" />
    )}),
  ]

  // Result columns
  const resultColumns = [
    createColumn({ key: 'examId', header: 'Exam', width: '30%', render: (val, row) => {
      const exam = getExamById(val)
      return (
        <div>
          <p className="font-medium text-admin-900">{exam ? truncate(exam.title, 50) : 'Unknown'}</p>
          <p className="text-sm text-admin-500 mt-0.5">{exam ? `${exam.branch} - Sem ${exam.semester}` : ''}</p>
        </div>
      )
    }}),
    createColumn({ key: 'status', header: 'Status', width: '130px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'totalStudents', header: 'Students', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'passed', header: 'Passed', width: '100px', render: (val, row) => (
      <span className="text-sm text-success-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'failed', header: 'Failed', width: '100px', render: (val) => (
      <span className="text-sm text-danger-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'averagePercentage', header: 'Avg %', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? val.toFixed(1) + '%' : '—'}</span>
    )}),
    createColumn({ key: 'publishedAt', header: 'Published', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
    )}),
  ]

  // Handlers
  const openCreateExam = () => {
    setEditingExam(null)
    setExamForm(initialExamForm)
    setSubjects([{ code: '', name: '', date: '', time: '', faculty: '' }])
    setExamModalOpen(true)
  }

  const openEditExam = (exam) => {
    setEditingExam(exam)
    setExamForm({
      title: exam.title,
      branch: exam.branch,
      semester: exam.semester,
      type: exam.type,
      status: exam.status,
      startDate: exam.startDate ? exam.startDate.split('T')[0] : '',
      endDate: exam.endDate ? exam.endDate.split('T')[0] : '',
      venue: exam.venue,
    })
    setSubjects(exam.subjects.map(s => ({
      code: s.code,
      name: s.name,
      date: s.date,
      time: s.time,
      faculty: s.faculty,
    })))
    setExamModalOpen(true)
  }

  const handleExamSubmit = (e) => {
    e.preventDefault()
    console.log('Save exam:', { ...examForm, subjects })
    setExamModalOpen(false)
  }

  const addSubject = () => {
    setSubjects([...subjects, { code: '', name: '', date: '', time: '', faculty: '' }])
  }

  const updateSubject = (index, field, value) => {
    const newSubjects = [...subjects]
    newSubjects[index] = { ...newSubjects[index], [field]: value }
    setSubjects(newSubjects)
  }

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index))
    }
  }

  const openUploadResult = (exam) => {
    const existingResult = getResultByExamId(exam.id)
    setEditingResult(existingResult || null)
    setResultForm({
      examId: exam.id,
      status: existingResult?.status || 'pending',
      fileName: existingResult?.fileName || '',
    })
    setSelectedFile(null)
    setResultModalOpen(true)
  }

  const handleResultSubmit = (e) => {
    e.preventDefault()
    console.log('Save result:', { ...resultForm, file: selectedFile })
    setResultModalOpen(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setResultForm({ ...resultForm, fileName: file.name })
    }
  }

  const confirmDelete = (type, id) => {
    setDeleteConfirm({ open: true, type, id })
  }

  const handleDeleteConfirm = () => {
    console.log('Delete:', deleteConfirm.type, deleteConfirm.id)
    setDeleteConfirm({ open: false, type: null, id: null })
  }

  const tabs = [
    { id: 'exams', label: 'Exam Schedule', badge: filteredExams.length, badgeColor: 'warning' },
    { id: 'results', label: 'Results', badge: filteredResults.length, badgeColor: 'success' },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Exams & Results</h1>
          <p className="admin-page-subtitle">Manage exam schedules and publish results for {uniId.toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'exams' && (
            <AdminButton variant="primary" onClick={openCreateExam}>
              <Plus className="w-4 h-4" />
              Schedule Exam
            </AdminButton>
          )}
        </div>
      </header>

      <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Exams Tab */}
      <TabPanel id="exams" activeTab={activeTab}>
        <div className="admin-section">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input pl-10"
              />
            </div>
            <AdminSelect
              options={[{ value: 'all', label: 'All Status' }, ...examStatusOptions]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <AdminTable
            columns={examColumns}
            data={filteredExams}
            keyField="id"
            emptyMessage="No exams scheduled"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                {row.status !== 'completed' && row.status !== 'cancelled' && !row.resultsPublished && (
                  <AdminButton variant="primary" size="sm" onClick={() => openUploadResult(row)}>
                    <Upload className="w-4 h-4" />
                    Upload Results
                  </AdminButton>
                )}
                {row.resultsPublished && (
                  <AdminButton variant="secondary" size="sm" onClick={() => openUploadResult(row)}>
                    <Eye className="w-4 h-4" />
                    View Results
                  </AdminButton>
                )}
                <button
                  className="admin-btn-ghost p-1.5"
                  onClick={() => openEditExam(row)}
                  aria-label="Edit exam"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50"
                  onClick={() => confirmDelete('exam', row.id)}
                  aria-label="Delete exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      {/* Results Tab */}
      <TabPanel id="results" activeTab={activeTab}>
        <div className="admin-section">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
              <input
                type="text"
                placeholder="Search results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input pl-10"
              />
            </div>
            <AdminSelect
              options={[{ value: 'all', label: 'All Status' }, ...resultStatusOptions]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <AdminTable
            columns={resultColumns}
            data={filteredResults}
            keyField="id"
            emptyMessage="No results uploaded"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                {row.status === 'uploaded' && (
                  <AdminButton variant="primary" size="sm" onClick={() => openUploadResult(getExamById(row.examId))}>
                    <CheckCircle className="w-4 h-4" />
                    Publish
                  </AdminButton>
                )}
                {row.status === 'published' && (
                  <AdminButton variant="secondary" size="sm" onClick={() => openUploadResult(getExamById(row.examId))}>
                    <Eye className="w-4 h-4" />
                    View
                  </AdminButton>
                )}
                {row.status === 'pending' && (
                  <AdminButton variant="secondary" size="sm" onClick={() => openUploadResult(getExamById(row.examId))}>
                    <Upload className="w-4 h-4" />
                    Upload
                  </AdminButton>
                )}
                <button
                  className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50"
                  onClick={() => confirmDelete('result', row.id)}
                  aria-label="Delete result"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      {/* Exam Modal */}
      <AdminModal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title={editingExam ? 'Edit Exam' : 'Schedule Exam'}
        size="xl"
      >
        <form onSubmit={handleExamSubmit} className="space-y-4">
          <AdminInput label="Exam Title" value={examForm.title} onChange={(e) => setExamForm({...examForm, title: e.target.value})} required />
          <FormRow cols={4}>
            <AdminSelect
              label="Branch"
              options={branches.map(b => ({ value: b, label: b }))}
              value={examForm.branch}
              onChange={(e) => setExamForm({...examForm, branch: e.target.value})}
            />
            <AdminInput
              label="Semester"
              type="number"
              min="1"
              max="8"
              value={examForm.semester}
              onChange={(e) => setExamForm({...examForm, semester: parseInt(e.target.value)})}
            />
            <AdminSelect
              label="Type"
              options={examTypeOptions}
              value={examForm.type}
              onChange={(e) => setExamForm({...examForm, type: e.target.value})}
            />
            <AdminSelect
              label="Status"
              options={examStatusOptions}
              value={examForm.status}
              onChange={(e) => setExamForm({...examForm, status: e.target.value})}
            />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="Start Date" type="date" value={examForm.startDate} onChange={(e) => setExamForm({...examForm, startDate: e.target.value})} required />
            <AdminInput label="End Date" type="date" value={examForm.endDate} onChange={(e) => setExamForm({...examForm, endDate: e.target.value})} required />
          </FormRow>
          <AdminInput label="Venue" value={examForm.venue} onChange={(e) => setExamForm({...examForm, venue: e.target.value})} required />

          <FormSection title="Subjects / Papers" description="Add each subject with date, time, and faculty">
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 border border-admin-200">
                  <AdminInput label="Subject Code" value={subject.code} onChange={(e) => updateSubject(index, 'code', e.target.value)} className="flex-1" placeholder="e.g., CS301" />
                  <AdminInput label="Subject Name" value={subject.name} onChange={(e) => updateSubject(index, 'name', e.target.value)} className="flex-1" placeholder="e.g., Data Structures" />
                  <AdminInput label="Date" type="date" value={subject.date} onChange={(e) => updateSubject(index, 'date', e.target.value)} className="w-40" />
                  <AdminInput label="Time" value={subject.time} onChange={(e) => updateSubject(index, 'time', e.target.value)} className="w-40" placeholder="09:00-12:00" />
                  <AdminInput label="Faculty" value={subject.faculty} onChange={(e) => updateSubject(index, 'faculty', e.target.value)} className="flex-1" placeholder="Dr. Name" />
                  <button
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50 self-end mb-1"
                    disabled={subjects.length === 1}
                    aria-label="Remove subject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSubject} className="admin-btn-outline w-fit">
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>
          </FormSection>

          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setExamModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingExam ? 'Update' : 'Create'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Result Upload Modal */}
      <AdminModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title={editingResult ? 'Edit Result' : 'Upload Results'}
        size="lg"
      >
        <form onSubmit={handleResultSubmit} className="space-y-4">
          {editingResult && (
            <AdminInput label="Exam" value={getExamById(editingResult.examId)?.title || 'Unknown'} disabled />
          )}
          {!editingResult && (
            <AdminSelect
              label="Select Exam"
              options={examsData.filter(e => !getResultByExamId(e.id)).map(e => ({ value: e.id, label: `${e.title} (${e.branch} Sem ${e.semester})` }))}
              value={resultForm.examId}
              onChange={(e) => setResultForm({...resultForm, examId: e.target.value})}
              required
            />
          )}
          <div className="admin-form-group">
            <label className="admin-label">Results CSV File</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="admin-input"
              required={!editingResult}
            />
            <p className="text-sm text-admin-500 mt-1">Upload CSV with columns: Student ID, Name, Subject Codes..., Total, Percentage, Grade</p>
            {selectedFile && <p className="text-sm text-primary-600 mt-1">Selected: {selectedFile.name}</p>}
            {editingResult?.fileName && !selectedFile && <p className="text-sm text-admin-500 mt-1">Current: {editingResult.fileName}</p>}
          </div>
          <AdminSelect
            label="Status"
            options={resultStatusOptions}
            value={resultForm.status}
            onChange={(e) => setResultForm({...resultForm, status: e.target.value})}
          />
          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setResultModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingResult ? 'Update' : 'Upload'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to delete this ${deleteConfirm.type}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}