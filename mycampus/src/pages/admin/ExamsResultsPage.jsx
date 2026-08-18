import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Edit, Trash2, Eye, Upload, Download, FileText, Calendar, Clock, AlertTriangle, CheckCircle, Search
} from 'lucide-react'
import { currentUser, getAdminExams, getAdminResults, getAdminUniversity } from '../../data'
import { getExamsByBranch } from '../../data/exams'
import { formatDate, getRelativeDate } from '../../utils/format'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminTabs, TabPanel } from '../../components/admin/AdminTabs'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton } from '../../components/admin/AdminForm'

const branches = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT']
const semesters = [1, 2, 3, 4, 5, 6, 7, 8]

const ExamsResultsPage = () => {
  const university = getAdminUniversity(currentUser.university)
  const exams = getAdminExams(currentUser.university)
  const results = getAdminResults(currentUser.university)

  const [activeTab, setActiveTab] = useState('exams')

  // Exams state
  const [examsFilter, setExamsFilter] = useState('all')
  const [examsBranch, setExamsBranch] = useState('all')
  const [examsSearch, setExamsSearch] = useState('')
  const [examsModalOpen, setExamsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [examForm, setExamForm] = useState({
    subjectCode: '',
    subjectName: '',
    branch: 'CSE',
    semester: 5,
    date: '',
    day: '',
    startTime: '10:00',
    endTime: '13:00',
    room: '',
    seatNo: '',
    type: 'Theory',
  })

  // Results state
  const [resultsFilter, setResultsFilter] = useState('all')
  const [resultsBranch, setResultsBranch] = useState('all')
  const [resultsModalOpen, setResultsModalOpen] = useState(false)
  const [editingResult, setEditingResult] = useState(null)

  // Filtered data
  const filteredExams = exams
    .filter(e => {
      if (examsFilter !== 'all' && e.status !== examsFilter) return false
      if (examsBranch !== 'all' && e.branch !== examsBranch) return false
      if (examsSearch && !e.subjectName.toLowerCase().includes(examsSearch.toLowerCase()) &&
          !e.subjectCode.toLowerCase().includes(examsSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const filteredResults = results
    .filter(r => {
      if (resultsFilter !== 'all' && r.status !== resultsFilter) return false
      if (resultsBranch !== 'all' && r.branch !== resultsBranch) return false
      return true
    })
    .sort((a, b) => new Date(b.announcedDate) - new Date(a.announcedDate))

  // Exam columns
  const examColumns = [
    createColumn({ key: 'subjectCode', header: 'Code', width: '100px' }),
    createColumn({ key: 'subjectName', header: 'Subject', width: '25%', render: (val) => <p className="font-medium text-gray-900">{val}</p> }),
    createColumn({ key: 'branch', header: 'Branch', width: '80px', render: (val) => <span className="text-sm font-medium text-gray-700">{val}</span> }),
    createColumn({ key: 'semester', header: 'Sem', width: '60px', render: (val) => <span className="text-sm text-gray-600">{val}</span> }),
    createColumn({ key: 'date', header: 'Date', width: '120px', render: (val) => formatDate(val) }),
    createColumn({ key: 'time', header: 'Time', width: '140px', render: (_, row) => `${row.startTime} - ${row.endTime}` }),
    createColumn({ key: 'room', header: 'Room', width: '150px' }),
    createColumn({ key: 'type', header: 'Type', render: (val) => <AdminBadge status={val.toLowerCase()} size="xs" /> }),
    createColumn({ key: 'status', header: 'Status', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'actions', header: 'Actions', width: '120px', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Edit">
          <Edit className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}),
  ]

  // Result columns
  const resultColumns = [
    createColumn({ key: 'examName', header: 'Exam', width: '30%', render: (val) => <p className="font-medium text-gray-900 truncate max-w-xs">{val}</p> }),
    createColumn({ key: 'branch', header: 'Branch', width: '80px', render: (val) => <span className="text-sm font-medium text-gray-700">{val}</span> }),
    createColumn({ key: 'semester', header: 'Sem', width: '60px', render: (val) => <span className="text-sm text-gray-600">{val}</span> }),
    createColumn({ key: 'announcedDate', header: 'Announced', width: '120px', render: (val) => formatDate(val) }),
    createColumn({ key: 'status', header: 'Status', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'sgpa', header: 'SGPA', width: '80px', render: (val) => <span className="font-medium text-gray-900">{val}</span> }),
    createColumn({ key: 'cgpa', header: 'CGPA', width: '80px', render: (val) => <span className="font-medium text-gray-900">{val}</span> }),
    createColumn({ key: 'actions', header: 'Actions', width: '120px', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="View">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Download">
          <Download className="w-4 h-4" />
        </button>
        {row.status === 'draft' && (
          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Publish">
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    )}),
  ]

  const handleNewExam = () => {
    setEditingExam(null)
    setExamForm({
      subjectCode: '',
      subjectName: '',
      branch: 'CSE',
      semester: 5,
      date: '',
      day: '',
      startTime: '10:00',
      endTime: '13:00',
      room: '',
      seatNo: '',
      type: 'Theory',
    })
    setExamsModalOpen(true)
  }

  const handleSaveExam = () => {
    console.log('Save exam:', { ...examForm, id: editingExam?.id || `exam-${Date.now()}` })
    setExamsModalOpen(false)
    setEditingExam(null)
  }

  const tabs = [
    { id: 'exams', label: 'Exam Schedule', icon: Calendar, badge: exams.length },
    { id: 'results', label: 'Results', icon: FileText, badge: results.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exams & Results</h1>
          <p className="text-gray-500 mt-1">Manage exam schedules and publish results</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNewExam} className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Exam
          </button>
        </div>
      </div>

      {/* Tabs */}
      <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Exams Tab */}
      <TabPanel id="exams" activeTab={activeTab}>
        <div className="space-y-4">
        {/* Filter/Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search exams..."
              value={examsSearch}
              onChange={(e) => setExamsSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <AdminSelect
            value={examsBranch}
            onChange={(e) => setExamsBranch(e.target.value)}
            options={[{ value: 'all', label: 'All Branches' }, ...branches.map(b => ({ value: b, label: b }))]}
            className="w-full sm:w-40"
          />
          <AdminSelect
            value={examsFilter}
            onChange={(e) => setExamsFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'completed', label: 'Completed' },
            ]}
            className="w-full sm:w-40"
          />
        </div>

        {/* Exams Table */}
        <AdminTable
          columns={examColumns}
          data={filteredExams}
          keyField="id"
          emptyMessage="No exams found"
        />

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Total Exams</p>
            <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">{exams.filter(e => e.status === 'upcoming').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Ongoing</p>
            <p className="text-2xl font-bold text-amber-600">{exams.filter(e => e.status === 'ongoing').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{exams.filter(e => e.status === 'completed').length}</p>
          </div>
        </div>
      </div>
    </TabPanel>

    {/* Results Tab */}
    <TabPanel id="results" activeTab={activeTab}>
      <div className="space-y-4">
        {/* Filter/Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search results..."
              value={resultsSearch}
              onChange={(e) => setResultsSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <AdminSelect
            value={resultsBranch}
            onChange={(e) => setResultsBranch(e.target.value)}
            options={[{ value: 'all', label: 'All Branches' }, ...branches.map(b => ({ value: b, label: b }))]}
            className="w-full sm:w-40"
          />
          <AdminSelect
            value={resultsFilter}
            onChange={(e) => setResultsFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ]}
            className="w-full sm:w-40"
          />
        </div>

        {/* Results Table */}
        <AdminTable
          columns={resultColumns}
          data={filteredResults}
          keyField="id"
          emptyMessage="No results found"
        />

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Total Results</p>
            <p className="text-2xl font-bold text-gray-900">{results.length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-2xl font-bold text-green-600">{results.filter(r => r.status === 'published').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Draft</p>
            <p className="text-2xl font-bold text-gray-500">{results.filter(r => r.status === 'draft').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Avg CGPA</p>
            <p className="text-2xl font-bold text-blue-600">
              {results.length > 0
                ? (results.reduce((acc, r) => acc + (r.cgpa || 0), 0) / results.length).toFixed(2)
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </TabPanel>

      {/* Exam Modal */}
      <AdminModal
        isOpen={examsModalOpen}
        onClose={() => setExamsModalOpen(false)}
        title={editingExam ? 'Edit Exam' : 'Add Exam'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminInput
              label="Subject Code"
              required
              value={examForm.subjectCode}
              onChange={(e) => setExamForm({ ...examForm, subjectCode: e.target.value })}
              placeholder="e.g., CSE-301"
            />
            <AdminInput
              label="Subject Name"
              required
              value={examForm.subjectName}
              onChange={(e) => setExamForm({ ...examForm, subjectName: e.target.value })}
              placeholder="e.g., Data Structures & Algorithms"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminSelect
              label="Branch"
              value={examForm.branch}
              onChange={(e) => setExamForm({ ...examForm, branch: e.target.value })}
              options={branches.map(b => ({ value: b, label: b }))}
            />
            <AdminSelect
              label="Semester"
              value={examForm.semester}
              onChange={(e) => setExamForm({ ...examForm, semester: parseInt(e.target.value) })}
              options={semesters.map(s => ({ value: s, label: `Sem ${s}` }))}
            />
            <AdminSelect
              label="Type"
              value={examForm.type}
              onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
              options={[
                { value: 'Theory', label: 'Theory' },
                { value: 'Practical', label: 'Practical' },
                { value: 'Viva', label: 'Viva' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminInput
              type="date"
              label="Date"
              required
              value={examForm.date}
              onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
            />
            <AdminInput
              label="Day"
              value={examForm.day}
              onChange={(e) => setExamForm({ ...examForm, day: e.target.value })}
              placeholder="e.g., Monday"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminInput
              type="time"
              label="Start Time"
              value={examForm.startTime}
              onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
            />
            <AdminInput
              type="time"
              label="End Time"
              value={examForm.endTime}
              onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
            />
            <AdminInput
              label="Room"
              value={examForm.room}
              onChange={(e) => setExamForm({ ...examForm, room: e.target.value })}
              placeholder="e.g., Room 201, Block A"
            />
          </div>

          <AdminInput
            label="Seat No (optional)"
            value={examForm.seatNo}
            onChange={(e) => setExamForm({ ...examForm, seatNo: e.target.value })}
            placeholder="e.g., CSE-5021"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <AdminButton variant="secondary" onClick={() => setExamsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton onClick={handleSaveExam}>{editingExam ? 'Update' : 'Create'}</AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

export default ExamsResultsPage