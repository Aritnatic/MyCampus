import React, { useState, useMemo } from 'react'
import { AdminPageLayout, AdminPageSection } from '../../components/admin/AdminPageLayout'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar, AdminQuickFilters } from '../../components/admin/AdminFilterBar'
import { AdminFormModal } from '../../components/admin/AdminFormModal'
import { AdminStatBar, createStat } from '../../components/admin/AdminStatBar'
import { AdminButton } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, truncate } from '../../utils/format'
import {
  getJobsByUniversity,
  getCompaniesByUniversity,
  placementStats,
} from '../../data/placements'
import { currentAdmin } from '../../data/admin'
import {
  Briefcase,
  Building2,
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  GraduationCap,
} from 'lucide-react'
import {
  createJobColumns,
  jobFilters,
  jobQuickFilters,
  createJobStats,
  initialJobForm,
  jobFormSections,
  mapJobToForm,
  mapFormToJob,
} from '../../components/admin/columns/placementsJobsColumns'
import {
  createCompanyColumns,
  companyFilters,
  companyQuickFilters,
  createCompanyStats,
  initialCompanyForm,
  companyFormSections,
  mapCompanyToForm,
  mapFormToCompany,
} from '../../components/admin/columns/placementsCompaniesColumns'

export default function PlacementsPage({ defaultTab = 'jobs' }) {
  const uniId = currentAdmin.university
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [jobsData] = useState(getJobsByUniversity(uniId))
  const [companiesData] = useState(getCompaniesByUniversity(uniId))

  // Jobs state
  const [jobSearch, setJobSearch] = useState('')
  const [jobFiltersState, setJobFiltersState] = useState({})
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [jobForm, setJobForm] = useState(initialJobForm)

  // Companies state
  const [companySearch, setCompanySearch] = useState('')
  const [companyFiltersState, setCompanyFiltersState] = useState({})
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [companyForm, setCompanyForm] = useState(initialCompanyForm)

  // Filter functions
  const filteredJobs = useMemo(() => {
    return jobsData.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.company.toLowerCase().includes(jobSearch.toLowerCase())
      const matchesStatus = jobFiltersState.status === 'all' || !jobFiltersState.status || j.status === jobFiltersState.status
      const matchesType = jobFiltersState.type === 'all' || !jobFiltersState.type || j.type === jobFiltersState.type
      const matchesBranch = !jobFiltersState.branch || jobFiltersState.branch.length === 0 || jobFiltersState.branch.some(b => j.branch.includes(b))
      return matchesSearch && matchesStatus && matchesType && matchesBranch
    })
  }, [jobsData, jobSearch, jobFiltersState])

  const filteredCompanies = useMemo(() => {
    return companiesData.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.industry.toLowerCase().includes(companySearch.toLowerCase())
      const matchesStatus = companyFiltersState.relationship === 'all' || !companyFiltersState.relationship || c.relationship === companyFiltersState.relationship
      const matchesTier = companyFiltersState.tier === 'all' || !companyFiltersState.tier || c.tier === companyFiltersState.tier
      const matchesVerified = companyFiltersState.verified === 'all' || !companyFiltersState.verified || String(c.verified) === companyFiltersState.verified
      const matchesIndustry = companyFiltersState.industry === 'all' || !companyFiltersState.industry || c.industry === companyFiltersState.industry
      return matchesSearch && matchesStatus && matchesTier && matchesVerified && matchesIndustry
    })
  }, [companiesData, companySearch, companyFiltersState])

  // Job handlers
  const openCreateJob = () => {
    setEditingJob(null)
    setJobForm(initialJobForm)
    setJobModalOpen(true)
  }

  const openEditJob = (job) => {
    setEditingJob(job)
    setJobForm(mapJobToForm(job))
    setJobModalOpen(true)
  }

  const handleJobSubmit = (data) => {
    const jobData = mapFormToJob(data, editingJob)
    console.log('Save job:', jobData)
    setJobModalOpen(false)
  }

  const handleJobFilterChange = (key, value) => {
    setJobFiltersState(prev => ({ ...prev, [key]: value }))
  }

  const handleJobSearchChange = (value) => {
    setJobSearch(value)
  }

  const handleJobRowAction = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button className="admin-btn-ghost p-1.5" onClick={() => openEditJob(row)} aria-label="Edit job">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </button>
      <button className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => console.log('Delete job:', row.id)} aria-label="Delete job">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  )

  // Company handlers
  const openCreateCompany = () => {
    setEditingCompany(null)
    setCompanyForm(initialCompanyForm)
    setCompanyModalOpen(true)
  }

  const openEditCompany = (company) => {
    setEditingCompany(company)
    setCompanyForm(mapCompanyToForm(company))
    setCompanyModalOpen(true)
  }

  const handleCompanySubmit = (data) => {
    const companyData = mapFormToCompany(data, editingCompany)
    console.log('Save company:', companyData)
    setCompanyModalOpen(false)
  }

  const handleCompanyFilterChange = (key, value) => {
    setCompanyFiltersState(prev => ({ ...prev, [key]: value }))
  }

  const handleCompanySearchChange = (value) => {
    setCompanySearch(value)
  }

  const handleCompanyRowAction = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button className="admin-btn-ghost p-1.5" onClick={() => openEditCompany(row)} aria-label="Edit company">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </button>
      <button className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => console.log('Delete company:', row.id)} aria-label="Delete company">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  )

  // Tabs
  const tabs = [
    { id: 'jobs', label: 'Job Postings', badge: filteredJobs.length, badgeColor: 'info' },
    { id: 'companies', label: 'Companies', badge: filteredCompanies.length, badgeColor: 'success' },
    { id: 'stats', label: 'Statistics', badge: null, badgeColor: null },
  ]

  return (
    <AdminPageLayout
      title="Placements & Careers"
      subtitle={`Manage job postings, companies, and recruitment drives for ${uniId.toUpperCase()}`}
      actions={activeTab === 'jobs' ? [
        { label: 'Post Job', icon: <Plus className="w-4 h-4" />, onClick: openCreateJob, variant: 'primary' }
      ] : activeTab === 'companies' ? [
        { label: 'Add Company', icon: <Plus className="w-4 h-4" />, onClick: openCreateCompany, variant: 'primary' }
      ] : []}
    >
      {/* Tabs */}
      <div className="admin-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab ${activeTab === tab.id ? 'admin-tab-active' : ''}`}
          >
            <span className="flex items-center gap-2">
              {tab.id === 'jobs' && <Briefcase className="w-4 h-4" />}
              {tab.id === 'companies' && <Building2 className="w-4 h-4" />}
              {tab.id === 'stats' && <TrendingUp className="w-4 h-4" />}
              {tab.label}
              {tab.badge !== null && tab.badge !== undefined && (
                <span className={`admin-badge text-xs px-1.5 py-0.5 admin-badge-${tab.badgeColor || 'info'}`}>
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <AdminPageSection>
          {/* Stats Bar */}
          <AdminStatBar stats={createJobStats(filteredJobs)} />

          {/* Filter Bar */}
          <AdminFilterBar
            searchPlaceholder="Search jobs by title, company..."
            searchValue={jobSearch}
            onSearchChange={handleJobSearchChange}
            filters={jobFilters}
            filterValues={jobFiltersState}
            onFilterChange={handleJobFilterChange}
          />

          {/* Quick Filters */}
          <AdminQuickFilters
            filters={jobQuickFilters}
            activeFilter={jobFiltersState.status || 'all'}
            onChange={(value) => handleJobFilterChange('status', value)}
            className="mb-4"
          />

          {/* Table */}
          <AdminDataTable
            columns={createJobColumns({ onRowAction: handleJobRowAction })}
            data={filteredJobs}
            keyField="id"
            emptyMessage="No job postings found"
            hoverable
            striped
          />
        </AdminPageSection>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <AdminPageSection>
          {/* Stats Bar */}
          <AdminStatBar stats={createCompanyStats(filteredCompanies)} />

          {/* Filter Bar */}
          <AdminFilterBar
            searchPlaceholder="Search companies by name, industry..."
            searchValue={companySearch}
            onSearchChange={handleCompanySearchChange}
            filters={companyFilters}
            filterValues={companyFiltersState}
            onFilterChange={handleCompanyFilterChange}
          />

          {/* Quick Filters */}
          <AdminQuickFilters
            filters={companyQuickFilters}
            activeFilter={companyFiltersState.relationship || 'all'}
            onChange={(value) => handleCompanyFilterChange('relationship', value)}
            className="mb-4"
          />

          {/* Table */}
          <AdminDataTable
            columns={createCompanyColumns({ onRowAction: handleCompanyRowAction })}
            data={filteredCompanies}
            keyField="id"
            emptyMessage="No companies found"
            hoverable
            striped
          />
        </AdminPageSection>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <AdminPageSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-admin-100 rounded-lg p-6">
              <p className="text-sm font-medium text-admin-500">Placement %</p>
              <p className="text-3xl font-bold text-admin-900 mt-1">{placementStats.placementPercentage}%</p>
              <p className="text-sm text-admin-500 mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-success-600" />
                {formatNumber(placementStats.placedStudents)} placed
              </p>
            </div>
            <div className="bg-white border border-admin-100 rounded-lg p-6">
              <p className="text-sm font-medium text-admin-500">Average Package</p>
              <p className="text-3xl font-bold text-admin-900 mt-1">₹{(placementStats.averagePackage / 100000).toFixed(2)} L</p>
              <p className="text-sm text-admin-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-success-600" />
                {formatNumber(placementStats.totalCompanies)} companies
              </p>
            </div>
            <div className="bg-white border border-admin-100 rounded-lg p-6">
              <p className="text-sm font-medium text-admin-500">Highest Package</p>
              <p className="text-3xl font-bold text-admin-900 mt-1">₹{(placementStats.highestPackage / 100000).toFixed(2)} L</p>
              <p className="text-sm text-admin-500 mt-1 flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-primary-600" />
                {placementStats.tier1Companies} Tier-1 companies
              </p>
            </div>
            <div className="bg-white border border-admin-100 rounded-lg p-6">
              <p className="text-sm font-medium text-admin-500">Eligible Students</p>
              <p className="text-3xl font-bold text-admin-900 mt-1">{formatNumber(placementStats.eligibleStudents)}</p>
              <p className="text-sm text-admin-500 mt-1 flex items-center gap-1">
                <Users className="w-4 h-4 text-primary-600" />
                {formatNumber(placementStats.registeredStudents)} registered
              </p>
            </div>
          </div>

          <AdminPageSection title="Recruitment Summary">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-admin-100 rounded-lg p-6">
                <p className="text-sm font-medium text-admin-500">Ongoing Drives</p>
                <p className="text-2xl font-bold text-admin-900 mt-1">{placementStats.ongoingDrives}</p>
              </div>
              <div className="bg-white border border-admin-100 rounded-lg p-6">
                <p className="text-sm font-medium text-admin-500">Upcoming Drives</p>
                <p className="text-2xl font-bold text-admin-900 mt-1">{placementStats.upcomingDrives}</p>
              </div>
              <div className="bg-white border border-admin-100 rounded-lg p-6">
                <p className="text-sm font-medium text-admin-500">Total Applications</p>
                <p className="text-2xl font-bold text-admin-900 mt-1">{formatNumber(1987)}</p>
              </div>
            </div>
          </AdminPageSection>
        </AdminPageSection>
      )}

      {/* Job Modal */}
      <AdminFormModal
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        title={editingJob ? 'Edit Job Posting' : 'Post Job'}
        sections={jobFormSections}
        initialData={jobForm}
        onSubmit={handleJobSubmit}
        size="xl"
      />

      {/* Company Modal */}
      <AdminFormModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
        sections={companyFormSections}
        initialData={companyForm}
        onSubmit={handleCompanySubmit}
        size="lg"
      />
    </AdminPageLayout>
  )
}