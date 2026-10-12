// Placements & Careers - Job postings, companies, applications
import { makeLiveList, makeRemoteList } from './store'

const COMPANIES_KEY = 'companies'

// Jobs are backed by the API; companies are still local-only demo data.
export const jobs = makeRemoteList('jobs', 'jobs')

const _demoCompanies = [
  {
    id: 'comp-001',
    name: 'Tata Consultancy Services (TCS)',
    industry: 'IT Services',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 145,
    currentOpenings: 2,
    contactPerson: 'Mr. S. Mohanty',
    contactEmail: 'campus.tcs@tcs.com',
    lastDrive: '2024-01-12',
    verified: true,
  },
  {
    id: 'comp-002',
    name: 'Infosys',
    industry: 'IT Services',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 98,
    currentOpenings: 1,
    contactPerson: 'Ms. R. Nayak',
    contactEmail: 'campus.infosys@infosys.com',
    lastDrive: '2024-01-10',
    verified: true,
  },
  {
    id: 'comp-003',
    name: 'Swiggy',
    industry: 'Food Tech',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 28,
    currentOpenings: 0,
    contactPerson: 'Mr. A. Sharma',
    contactEmail: 'university@swiggy.in',
    lastDrive: '2023-12-15',
    verified: true,
  },
  {
    id: 'comp-004',
    name: 'Larsen & Toubro (L&T)',
    industry: 'Engineering & Construction',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 67,
    currentOpenings: 1,
    contactPerson: 'Dr. P. Das',
    contactEmail: 'campus.lnt@lntecc.com',
    lastDrive: '2024-01-08',
    verified: true,
  },
  {
    id: 'comp-005',
    name: 'Siemens',
    industry: 'Industrial Automation',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 34,
    currentOpenings: 1,
    contactPerson: 'Ms. K. Reddy',
    contactEmail: 'university.siemens@siemens.com',
    lastDrive: '2024-01-15',
    verified: true,
  },
  {
    id: 'comp-006',
    name: 'Mahindra & Mahindra',
    industry: 'Automotive',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 42,
    currentOpenings: 1,
    contactPerson: 'Mr. V. Singh',
    contactEmail: 'campus.mahindra@mahindra.com',
    lastDrive: '2024-01-18',
    verified: true,
  },
  {
    id: 'comp-007',
    name: 'Accenture',
    industry: 'Consulting & Services',
    tier: 'tier1',
    relationship: 'pending',
    totalHires: 0,
    currentOpenings: 1,
    contactPerson: 'Ms. N. Gupta',
    contactEmail: 'campus.accenture@accenture.com',
    lastDrive: null,
    verified: false,
  },
  {
    id: 'comp-008',
    name: 'Intel',
    industry: 'Semiconductor',
    tier: 'tier1',
    relationship: 'active',
    totalHires: 15,
    currentOpenings: 1,
    contactPerson: 'Dr. R. Iyer',
    contactEmail: 'university.intel@intel.com',
    lastDrive: '2024-01-05',
    verified: true,
  },
]

export const companies = makeLiveList(COMPANIES_KEY, _demoCompanies, 'companies')

export const placementStats = {
  totalStudents: 2847,
  eligibleStudents: 2156,
  registeredStudents: 1987,
  placedStudents: 892,
  placementPercentage: 44.9,
  averagePackage: 520000,
  highestPackage: 1800000,
  totalCompanies: 42,
  tier1Companies: 8,
  ongoingDrives: 5,
  upcomingDrives: 3,
}

export const getJobsByUniversity = (uniId) => jobs.filter(j => j.university === uniId)
export const getJobsByStatus = (status) => jobs.filter(j => j.status === status)
export const getJobsByBranch = (branch) => jobs.filter(j => j.branch.includes(branch))
export const getJobsByType = (type) => jobs.filter(j => j.type === type)
export const getJobById = (id) => jobs.find(j => j.id === id)

export const getCompaniesByUniversity = (uniId) => companies // All companies available to all for now
export const getCompanyById = (id) => companies.find(c => c.id === id)

export const getOpenJobs = (uniId) => jobs.filter(j => j.university === uniId && j.status === 'open')
export const getClosedJobs = (uniId) => jobs.filter(j => j.university === uniId && j.status === 'closed')
export const getDraftJobs = (uniId) => jobs.filter(j => j.university === uniId && j.status === 'draft')