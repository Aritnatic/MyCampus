import React, { useState } from 'react'
import { AdminTabs, TabPanel } from '../../components/admin/AdminTabs'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton, FormRow, AdminConfirmDialog, FormSection } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../utils/format'
import {
  getJobsByUniversity,
  getJobById,
  jobs,
} from '../../data/placements'
import {
  getCompaniesByUniversity,
  companies,
} from '../../data/placements'
import {
  placementStats,
} from '../../data/placements'
import { currentAdmin } from '../../data/admin'
import {
  Briefcase,
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  IndianRupee,
  GraduationCap,
} from 'lucide-react'

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

const branches = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT', 'EEE']

const initialJobForm = {
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

const initialCompanyForm = {
  name: '',
  industry: '',
  tier: 'tier1',
  contactPerson: '',
  contactEmail: '',
  relationship: 'pending',
  totalHires: 0,
  currentOpenings: 0,
  verified: false,
}

export default function PlacementsPage({ defaultTab = 'jobs', action = null }) {
  const uniId = currentAdmin.university
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [jobsData] = useState(getJobsByUniversity(uniId))
  const [companiesData] = useState(getCompaniesByUniversity(uniId))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [editingCompany, setEditingCompany] = useState(null)
  const [jobForm, setJobForm] = useState(initialJobForm)
  const [companyForm, setCompanyForm] = useState(initialCompanyForm)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null })
  const [selectedBranches, setSelectedBranches] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])

  // Filter functions
  const filteredJobs = jobsData.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredCompanies = companiesData.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Job columns
  const jobColumns = [
    createColumn({ key: 'title', header: 'Role', width: '30%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{truncate(val, 40)}</p>
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
    createColumn({ key: 'branch', header: 'Branches', width: '150px', render: (val) => (
      <div className="flex flex-wrap gap-1">
        {val.slice(0, 3).map((b, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 bg-admin-100 text-admin-600 rounded">{b}</span>
        ))}
        {val.length > 3 && <span className="text-xs text-admin-400">+{val.length - 3}</span>}
      </div>
    )}),
    createColumn({ key: 'stipend', header: 'Package', width: '140px', render: (val, row) => (
      <span className="text-sm text-admin-600">
        ₹{formatNumber(row.stipend.min)}-{formatNumber(row.stipend.max)}
        {row.stipend.period === 'year' ? '/yr' : '/mo'}
      </span>
    )}),
    createColumn({ key: 'openings', header: 'Openings', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'applications', header: 'Applications', width: '120px', render: (val, row) => (
      <div className="text-sm">
        <span className="text-admin-600">{formatNumber(val)}</span>
        {row.selected > 0 && (
          <span className="text-success-600 ml-1">({row.selected} selected)</span>
        )}
      </div>
    )}),
    createColumn({ key: 'deadline', header: 'Deadline', width: '130px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
    )}),
  ]

  // Company columns
  const companyColumns = [
    createColumn({ key: 'name', header: 'Company', width: '30%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{truncate(val, 40)}</p>
        <p className="text-sm text-admin-500 mt-0.5">{row.industry}</p>
      </div>
    )}),
    createColumn({ key: 'tier', header: 'Tier', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600 capitalize">{val.replace('tier', 'Tier ')}</span>
    )}),
    createColumn({ key: 'relationship', header: 'Status', width: '120px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'totalHires', header: 'Total Hires', width: '120px', render: (val) => (
      <span className="text-sm text-admin-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'currentOpenings', header: 'Openings', width: '100px', render: (val) => (
      <span className="text-sm text-primary-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'verified', header: 'Verified', width: '110px', render: (val) => (
      <AdminBadge status={val ? 'verified' : 'unverified'} size="sm" />
    )}),
    createColumn({ key: 'contactPerson', header: 'Contact', width: '180px', render: (val, row) => (
      <div className="text-sm">
        <p className="text-admin-600">{val}</p>
        <p className="text-admin-400">{row.contactEmail}</p>
      </div>
    )}),
  ]

  // Handlers
  const openCreateJob = () => {
    setEditingJob(null)
    setJobForm(initialJobForm)
    setSelectedBranches([])
    setSelectedLocations([])
    setSelectedSkills([])
    setJobModalOpen(true)
  }

  const openEditJob = (job) => {
    setEditingJob(job)
    setJobForm({
      title: job.title,
      company: job.company,
      type: job.type,
      status: job.status,
      branch: job.branch,
      cgpaCutoff: job.cgpaCutoff,
      stipendMin: job.stipend.min,
      stipendMax: job.stipend.max,
      stipendPeriod: job.stipend.period,
      openings: job.openings,
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
      description: job.description,
      skills: job.skills,
      mode: job.mode,
      batch: job.batch,
      verified: job.verified,
    })
    setSelectedBranches(job.branch)
    setSelectedLocations(job.locations)
    setSelectedSkills(job.skills)
    setJobModalOpen(true)
  }

  const handleJobSubmit = (e) => {
    e.preventDefault()
    console.log('Save job:', { ...jobForm, branch: selectedBranches, locations: selectedLocations, skills: selectedSkills })
    setJobModalOpen(false)
  }

  const openCreateCompany = () => {
    setEditingCompany(null)
    setCompanyForm(initialCompanyForm)
    setCompanyModalOpen(true)
  }

  const openEditCompany = (company) => {
    setEditingCompany(company)
    setCompanyForm({
      name: company.name,
      industry: company.industry,
      tier: company.tier,
      contactPerson: company.contactPerson,
      contactEmail: company.contactEmail,
      relationship: company.relationship,
      totalHires: company.totalHires,
      currentOpenings: company.currentOpenings,
      verified: company.verified,
    })
    setCompanyModalOpen(true)
  }

  const handleCompanySubmit = (e) => {
    e.preventDefault()
    console.log('Save company:', companyForm)
    setCompanyModalOpen(false)
  }

  const toggleBranch = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter(b => b !== branch))
    } else {
      setSelectedBranches([...selectedBranches, branch])
    }
  }

  const toggleLocation = (location) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(l => l !== location))
    } else {
      setSelectedLocations([...selectedLocations, location])
    }
  }

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
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
    { id: 'jobs', label: 'Job Postings', badge: filteredJobs.length, badgeColor: 'info' },
    { id: 'companies', label: 'Companies', badge: filteredCompanies.length, badgeColor: 'success' },
    { id: 'stats', label: 'Statistics', badge: null, badgeColor: null },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Placements & Careers</h1>
          <p className="admin-page-subtitle">Manage job postings, companies, and recruitment drives for {uniId.toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'jobs' && (
            <AdminButton variant="primary" onClick={openCreateJob}>
              <Plus className="w-4 h-4" />
              Post Job
            </AdminButton>
          )}
          {activeTab === 'companies' && (
            <AdminButton variant="primary" onClick={openCreateCompany}>
              <Plus className="w-4 h-4" />
              Add Company
            </AdminButton>
          )}
        </div>
      </header>

      <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Jobs Tab */}
      <TabPanel id="jobs" activeTab={activeTab}>
        <div className="admin-section">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input pl-10"
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
                <button className="admin-btn-ghost p-1.5" onClick={() => openEditJob(row)} aria-label="Edit job">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => confirmDelete('job', row.id)} aria-label="Delete job">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      {/* Companies Tab */}
      <TabPanel id="companies" activeTab={activeTab}>
        <div className="admin-section">
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input pl-10"
            />
          </div>

          <AdminTable
            columns={companyColumns}
            data={filteredCompanies}
            keyField="id"
            emptyMessage="No companies found"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <button className="admin-btn-ghost p-1.5" onClick={() => openEditCompany(row)} aria-label="Edit company">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => confirmDelete('company', row.id)} aria-label="Delete company">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      {/* Stats Tab */}
      <TabPanel id="stats" activeTab={activeTab}>
        <div className="admin-section">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="admin-stat">
              <p className="admin-stat-label">Placement %</p>
              <p className="admin-stat-value text-2xl">{placementStats.placementPercentage}%</p>
              <p className="admin-stat-trend text-admin-500">
                <CheckCircle className="w-3 h-3 text-success-600" />
                {formatNumber(placementStats.placedStudents)} placed
              </p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat-label">Average Package</p>
              <p className="admin-stat-value text-2xl">₹{(placementStats.averagePackage / 100000).toFixed(2)} L</p>
              <p className="admin-stat-trend text-admin-500">
                <TrendingUp className="w-3 h-3 text-success-600" />
                {formatNumber(placementStats.totalCompanies)} companies
              </p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat-label">Highest Package</p>
              <p className="admin-stat-value text-2xl">₹{(placementStats.highestPackage / 100000).toFixed(2)} L</p>
              <p className="admin-stat-trend text-admin-500">
                <GraduationCap className="w-3 h-3 text-primary-600" />
                {placementStats.tier1Companies} Tier-1 companies
              </p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat-label">Eligible Students</p>
              <p className="admin-stat-value text-2xl">{formatNumber(placementStats.eligibleStudents)}</p>
              <p className="admin-stat-trend text-admin-500">
                <Users className="w-3 h-3 text-primary-600" />
                {formatNumber(placementStats.registeredStudents)} registered
              </p>
            </div>
          </div>

          <div className="admin-section">
            <h3 className="admin-section-title">Recruitment Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="admin-stat">
                <p className="admin-stat-label">Ongoing Drives</p>
                <p className="admin-stat-value text-xl">{placementStats.ongoingDrives}</p>
              </div>
              <div className="admin-stat">
                <p className="admin-stat-label">Upcoming Drives</p>
                <p className="admin-stat-value text-xl">{placementStats.upcomingDrives}</p>
              </div>
              <div className="admin-stat">
                <p className="admin-stat-label">Total Applications</p>
                <p className="admin-stat-value text-xl">{formatNumber(1987)}</p>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      {/* Job Modal */}
      <AdminModal
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        title={editingJob ? 'Edit Job Posting' : 'Post Job'}
        size="xl"
      >
        <form onSubmit={handleJobSubmit} className="space-y-4">
          <AdminInput label="Job Title" value={jobForm.title} onChange={(e) => setJobForm({...jobForm, title: e.target.value})} required />
          <AdminInput label="Company Name" value={jobForm.company} onChange={(e) => setJobForm({...jobForm, company: e.target.value})} required />
          <FormRow cols={3}>
            <AdminSelect label="Type" options={jobTypeOptions} value={jobForm.type} onChange={(e) => setJobForm({...jobForm, type: e.target.value})} />
            <AdminSelect label="Status" options={jobStatusOptions} value={jobForm.status} onChange={(e) => setJobForm({...jobForm, status: e.target.value})} />
            <AdminSelect
              label="Mode"
              options={[
                { value: 'onsite', label: 'On-site' },
                { value: 'remote', label: 'Remote' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
              value={jobForm.mode}
              onChange={(e) => setJobForm({...jobForm, mode: e.target.value})}
            />
          </FormRow>
          <FormRow cols={4}>
            <AdminInput label="Min Package (₹)" type="number" value={jobForm.stipendMin} onChange={(e) => setJobForm({...jobForm, stipendMin: e.target.value})} />
            <AdminInput label="Max Package (₹)" type="number" value={jobForm.stipendMax} onChange={(e) => setJobForm({...jobForm, stipendMax: e.target.value})} />
            <AdminSelect
              label="Period"
              options={[
                { value: 'month', label: 'Per Month' },
                { value: 'year', label: 'Per Year' },
              ]}
              value={jobForm.stipendPeriod}
              onChange={(e) => setJobForm({...jobForm, stipendPeriod: e.target.value})}
            />
            <AdminInput label="Openings" type="number" value={jobForm.openings} onChange={(e) => setJobForm({...jobForm, openings: e.target.value})} />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="CGPA Cutoff" type="number" step="0.1" min="0" max="10" value={jobForm.cgpaCutoff} onChange={(e) => setJobForm({...jobForm, cgpaCutoff: parseFloat(e.target.value)})} />
            <AdminInput label="Application Deadline" type="date" value={jobForm.deadline} onChange={(e) => setJobForm({...jobForm, deadline: e.target.value})} />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="Batch Year" value={jobForm.batch} onChange={(e) => setJobForm({...jobForm, batch: e.target.value})} placeholder="2025" />
            <AdminInput label="Verified" type="checkbox" checked={jobForm.verified} onChange={(e) => setJobForm({...jobForm, verified: e.target.checked})} />
          </FormRow>

          <FormSection title="Eligible Branches" description="Select branches eligible to apply">
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => toggleBranch(branch)}
                  className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                    selectedBranches.includes(branch)
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-admin-300 text-admin-600 hover:bg-admin-50'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Locations">
            <div className="flex flex-wrap gap-2">
              {['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Bhubaneswar'].map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => toggleLocation(location)}
                  className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                    selectedLocations.includes(location)
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-admin-300 text-admin-600 hover:bg-admin-50'
                  }`}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {location}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Required Skills" description="Add skills as comma-separated values">
            <AdminInput
              label="Skills"
              value={selectedSkills.join(', ')}
              onChange={(e) => setSelectedSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="e.g., Java, Python, SQL"
            />
          </FormSection>

          <AdminTextarea label="Job Description" value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} rows={5} />

          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setJobModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingJob ? 'Update' : 'Post Job'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Company Modal */}
      <AdminModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
        size="lg"
      >
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <AdminInput label="Company Name" value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} required />
          <AdminInput label="Industry" value={companyForm.industry} onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})} required />
          <FormRow cols={2}>
            <AdminSelect
              label="Tier"
              options={[
                { value: 'tier1', label: 'Tier 1' },
                { value: 'tier2', label: 'Tier 2' },
                { value: 'tier3', label: 'Tier 3' },
              ]}
              value={companyForm.tier}
              onChange={(e) => setCompanyForm({...companyForm, tier: e.target.value})}
            />
            <AdminSelect
              label="Relationship"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={companyForm.relationship}
              onChange={(e) => setCompanyForm({...companyForm, relationship: e.target.value})}
            />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="Contact Person" value={companyForm.contactPerson} onChange={(e) => setCompanyForm({...companyForm, contactPerson: e.target.value})} />
            <AdminInput label="Contact Email" type="email" value={companyForm.contactEmail} onChange={(e) => setCompanyForm({...companyForm, contactEmail: e.target.value})} />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="Total Hires" type="number" value={companyForm.totalHires} onChange={(e) => setCompanyForm({...companyForm, totalHires: parseInt(e.target.value) || 0})} />
            <AdminInput label="Current Openings" type="number" value={companyForm.currentOpenings} onChange={(e) => setCompanyForm({...companyForm, currentOpenings: parseInt(e.target.value) || 0})} />
          </FormRow>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={companyForm.verified} onChange={(e) => setCompanyForm({...companyForm, verified: e.target.checked})} className="w-4 h-4" />
            <label className="text-sm text-admin-700">Verified Company</label>
          </div>

          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setCompanyModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingCompany ? 'Update' : 'Add Company'}</AdminButton>
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