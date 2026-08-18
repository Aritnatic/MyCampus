import React from 'react'
import { currentUser } from '../../data'
import { placementJobs, getPlacementJobsByUniversity, placementCompanies, getPlacementCompaniesByUniversity } from '../../data/placements'
import { formatDate, getRelativeDate } from '../../utils/format'
import { Briefcase, Building2, Eye, Edit, Trash2, Search, Plus } from 'lucide-react'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton, FormRow } from '../../components/admin/AdminForm'

const jobStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'on-hold', label: 'On Hold' },
]

const jobTypeOptions = [
  { value: 'internship', label: 'Internship' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

export default function PlacementsPage() {
  const uniId = currentUser.university
  const jobsData = getPlacementJobsByUniversity(uniId)
  const companiesData = getPlacementCompaniesByUniversity(uniId)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingJob, setEditingJob] = React.useState(null)

  const filteredJobs = jobsData.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const jobColumns = [
    createColumn({ key: 'title', header: 'Role', width: '30%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{val}</p>
        <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {row.company}
        </p>
      </div>
    )}),
    createColumn({ key: 'type', header: 'Type', width: '120px', render: (val) => (
      <AdminBadge status={val} size="sm" variant="outline" />
    )}),
    createColumn({ key: 'status', header: 'Status', width: '110px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'location', header: 'Location', width: '180px' }),
    createColumn({ key: 'stipend', header: 'Package', width: '140px' }),
    createColumn({ key: 'deadline', header: 'Deadline', width: '130px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
    )}),
  ]

  const openCreate = () => {
    setEditingJob(null)
    setModalOpen(true)
  }

  const openEdit = (job) => {
    setEditingJob(job)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Placements & Careers</h1>
          <p className="text-gray-500 mt-1">Manage job postings for {uniId.toUpperCase()}</p>
        </div>
        <AdminButton variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Post Job
        </AdminButton>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        <AdminSelect
          options={[{ value: 'all', label: 'All Status' }, ...jobStatusOptions]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <AdminTable
        columns={jobColumns}
        data={filteredJobs}
        keyField="id"
        emptyMessage="No job postings found"
        hoverable
        striped
        renderRowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" onClick={() => openEdit(row)} aria-label="Edit job">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label="Delete job">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  )
}