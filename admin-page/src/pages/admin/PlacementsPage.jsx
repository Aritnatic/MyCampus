import React, { useState, useMemo } from 'react'
import { useStoreRevision } from '../../data/store'
import { AdminPageLayout, AdminPageSection } from '../../components/admin/AdminPageLayout'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar, AdminQuickFilters } from '../../components/admin/AdminFilterBar'
import { AdminFormModal } from '../../components/admin/AdminFormModal'
import { AdminStatBar, createStat } from '../../components/admin/AdminStatBar'
import { AdminButton } from '../../components/admin/AdminForm'
import { tokens, radius } from '../../theme'
import { formatDate, formatNumber, truncate } from '../../utils/format'
import {
  getJobsByUniversity,
  getCompaniesByUniversity,
  placementStats,
  jobs,
  companies,
} from '../../data/placements'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import {
  Briefcase,
  Building2,
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  GraduationCap,
  Calendar,
  FileText,
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
  const { admin } = useAuth()
  const toast = useToast()
  const uniId = admin?.university
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [rev, setRev] = useState(0)
  const bump = () => setRev((r) => r + 1)
  const storeRev = useStoreRevision() // changes when the API sync or a failed write updates the lists
  const jobsData = React.useMemo(() => getJobsByUniversity(uniId), [uniId, rev, storeRev])
  const companiesData = React.useMemo(() => getCompaniesByUniversity(uniId), [uniId, rev, storeRev])

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
    const payload = { ...jobData, university: uniId, postedBy: admin?.id || 'admin-001' }
    if (editingJob) {
      jobs.update(editingJob.id, payload)
      toast.success('Job posting updated.', { title: 'Saved' })
    } else {
      jobs.add({ id: `job-${Date.now()}`, ...payload, postedAt: new Date().toISOString() })
      toast.success('Job posting created.', { title: 'Saved' })
    }
    bump()
    setEditingJob(null)
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
      <button className="admin-btn-ghost p-1.5" style={{ color: tokens.violetText, background: 'transparent' }} onClick={() => { jobs.remove(row.id); bump(); toast.warning('Job posting removed.', { title: 'Removed' }) }} aria-label="Delete job">
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
    const payload = { ...companyData, addedBy: admin?.id || 'admin-001' }
    if (editingCompany) {
      companies.update(editingCompany.id, payload)
      toast.success('Company updated.', { title: 'Saved' })
    } else {
      companies.add({ id: `comp-${Date.now()}`, ...payload, addedAt: new Date().toISOString() })
      toast.success('Company added.', { title: 'Saved' })
    }
    bump()
    setEditingCompany(null)
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
      <button className="admin-btn-ghost p-1.5" style={{ color: tokens.violetText, background: 'transparent' }} onClick={() => { companies.remove(row.id); bump(); toast.warning('Company removed.', { title: 'Removed' }) }} aria-label="Delete company">
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
      subtitle={`Manage job postings, companies, and recruitment drives for ${uniId?.toUpperCase() || 'your university'}`}
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
            <StatCard
              label="Placement %"
              value={`${placementStats.placementPercentage}%`}
              icon={CheckCircle}
              accent={tokens.green}
              sub={`${formatNumber(placementStats.placedStudents)} placed`}
            />
            <StatCard
              label="Average Package"
              value={`₹${(placementStats.averagePackage / 100000).toFixed(2)} L`}
              icon={TrendingUp}
              accent={tokens.violet}
              sub={`${formatNumber(placementStats.totalCompanies)} companies`}
            />
            <StatCard
              label="Highest Package"
              value={`₹${(placementStats.highestPackage / 100000).toFixed(2)} L`}
              icon={GraduationCap}
              accent={tokens.blue}
              sub={`${placementStats.tier1Companies} Tier-1 companies`}
            />
            <StatCard
              label="Eligible Students"
              value={formatNumber(placementStats.eligibleStudents)}
              icon={Users}
              accent={tokens.yellow}
              sub={`${formatNumber(placementStats.registeredStudents)} registered`}
            />
          </div>

          <AdminPageSection title="Recruitment Summary">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Ongoing Drives"
                value={placementStats.ongoingDrives}
                icon={Briefcase}
                accent={tokens.green}
              />
              <StatCard
                label="Upcoming Drives"
                value={placementStats.upcomingDrives}
                icon={Calendar}
                accent={tokens.blue}
              />
              <StatCard
                label="Total Applications"
                value={formatNumber(1987)}
                icon={FileText}
                accent={tokens.violet}
              />
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

// Local stat card — uses the same dark token system as the dashboard.
function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div
      className="p-5"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: 14,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: `${accent}22`, color: accent, borderRadius: 8 }}
          aria-hidden="true"
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: tokens.inkFaint }}>
          {label}
        </span>
      </div>
      <div
        className="text-2xl font-semibold tracking-tight tabular-nums"
        style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: tokens.inkSoft }}>
          {sub}
        </div>
      )}
    </div>
  )
}