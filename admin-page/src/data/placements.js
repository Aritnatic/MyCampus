// Placements & Careers - job postings and recruiter companies, both stored on the server.
import { makeRemoteList } from './store'

export const jobs = makeRemoteList('jobs', 'jobs')
export const companies = makeRemoteList('companies', 'companies')

// Summary figures worked out from the real records (nothing invented).
export function getPlacementStats(uniId) {
  const uJobs = jobs.filter((j) => j.university === uniId)
  const uCompanies = companies.filter((c) => c.university === uniId)
  const now = new Date()
  const deadline = (j) => (j.deadline ? new Date(j.deadline) : null)
  return {
    totalCompanies: uCompanies.length,
    activeCompanies: uCompanies.filter((c) => c.relationship === 'active').length,
    tier1Companies: uCompanies.filter((c) => c.tier === 'tier1').length,
    totalHires: uCompanies.reduce((sum, c) => sum + (Number(c.totalHires) || 0), 0),
    openJobs: uJobs.filter((j) => j.status === 'open').length,
    closingSoon: uJobs.filter((j) => j.status === 'open' && deadline(j) && deadline(j) > now && deadline(j) - now < 7 * 864e5).length,
    totalJobs: uJobs.length,
    totalOpenings: uJobs.filter((j) => j.status === 'open').reduce((sum, j) => sum + (Number(j.openings) || 0), 0),
  }
}

export const getJobsByUniversity = (uniId) => jobs.filter(j => j.university === uniId)
export const getJobsByStatus = (status) => jobs.filter(j => j.status === status)
export const getJobsByBranch = (branch) => jobs.filter(j => j.branch.includes(branch))
export const getJobsByType = (type) => jobs.filter(j => j.type === type)
export const getJobById = (id) => jobs.find(j => j.id === id)

export const getCompaniesByUniversity = (uniId) => companies.filter((c) => c.university === uniId)
export const getCompanyById = (id) => companies.find(c => c.id === id)

export const getOpenJobs = (uniId) => jobs.filter(j => j.university === uniId && j.status === 'open')
export const getClosedJobs = (uniId) => jobs.filter(j => j.university === uniId && j.status === 'closed')
export const getDraftJobs = (uniId) => jobs.filter(j => j.university === uniId && j.status === 'draft')