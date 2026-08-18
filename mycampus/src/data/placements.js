// Placements & Careers mock data for admin pages
import { jobs as studentJobs } from './jobs'

// Companies data (extended from student jobs)
export const placementCompanies = [
  {
    id: 'comp-001',
    name: 'Zomato',
    industry: 'Food Tech',
    tier: 'tier1',
    contactPerson: 'Priya Sharma',
    contactEmail: 'hiring@zomato.com',
    relationship: 'active',
    totalHires: 12,
    currentOpenings: 3,
    verified: true,
    university: 'cvrp',
  },
  {
    id: 'comp-002',
    name: 'Google',
    industry: 'Technology',
    tier: 'tier1',
    contactPerson: 'Rajesh Kumar',
    contactEmail: 'university@google.com',
    relationship: 'active',
    totalHires: 8,
    currentOpenings: 2,
    verified: true,
    university: 'cvrp',
  },
  {
    id: 'comp-003',
    name: 'Infosys',
    industry: 'IT Services',
    tier: 'tier1',
    contactPerson: 'Anita Reddy',
    contactEmail: 'campus@infosys.com',
    relationship: 'active',
    totalHires: 45,
    currentOpenings: 12,
    verified: true,
    university: 'cvrp',
  },
  {
    id: 'comp-004',
    name: 'Swiggy',
    industry: 'Food Tech',
    tier: 'tier1',
    contactPerson: 'Vikram Singh',
    contactEmail: 'talent@swiggy.in',
    relationship: 'pending',
    totalHires: 5,
    currentOpenings: 1,
    verified: false,
    university: 'cvrp',
  },
  {
    id: 'comp-005',
    name: 'Razorpay',
    industry: 'FinTech',
    tier: 'tier2',
    contactPerson: 'Meera Patel',
    contactEmail: 'hiring@razorpay.com',
    relationship: 'active',
    totalHires: 3,
    currentOpenings: 2,
    verified: true,
    university: 'cvrp',
  },
  {
    id: 'comp-006',
    name: 'Cred',
    industry: 'FinTech',
    tier: 'tier2',
    contactPerson: 'Arjun Mehta',
    contactEmail: 'careers@cred.club',
    relationship: 'inactive',
    totalHires: 1,
    currentOpenings: 0,
    verified: true,
    university: 'cvrp',
  },
]

// Jobs data (re-export from jobs.js with admin-specific fields)
export const placementJobs = studentJobs.map(job => ({
  ...job,
  stipend: {
    min: job.stipend || 25000,
    max: (job.stipend || 25000) * 1.5,
    period: job.stipend ? 'month' : 'year',
  },
  branch: job.branches || ['CSE', 'ECE'],
  openings: job.openings || 5,
  applications: Math.floor(Math.random() * 100) + 10,
  selected: Math.floor(Math.random() * 10),
  deadline: job.deadline || '2024-03-31',
  description: job.description || 'We are looking for passionate individuals to join our team...',
  skills: job.skills || ['JavaScript', 'React', 'Node.js'],
  mode: job.mode || 'onsite',
  batch: job.batch || '2025',
  verified: job.verified || false,
  companyId: job.companyId || `comp-${Math.floor(Math.random() * 6) + 1}`,
}))

// Placement statistics
export const placementStats = {
  placementPercentage: 78,
  averagePackage: 850000,
  highestPackage: 3200000,
  eligibleStudents: 480,
  registeredStudents: 520,
  placedStudents: 374,
  totalCompanies: 42,
  tier1Companies: 12,
  ongoingDrives: 5,
  upcomingDrives: 8,
}

// Selector functions
export const getPlacementJobsByUniversity = (uniId) => placementJobs.filter(j => j.university === uniId)
export const getPlacementJobById = (id) => placementJobs.find(j => j.id === id)
export const getPlacementCompaniesByUniversity = (uniId) => placementCompanies.filter(c => c.university === uniId)
export const getPlacementCompanyById = (id) => placementCompanies.find(c => c.id === id)
export const getVerifiedPlacementJobs = (uniId) => getPlacementJobsByUniversity(uniId).filter(j => j.verified)
export const getOpenPlacementJobs = (uniId) => getPlacementJobsByUniversity(uniId).filter(j => j.status === 'open')
export const getActivePlacementCompanies = (uniId) => getPlacementCompaniesByUniversity(uniId).filter(c => c.relationship === 'active')