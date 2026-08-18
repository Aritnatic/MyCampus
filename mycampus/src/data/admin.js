// Admin user & university-scoped selectors
import { universities } from './universities'
import { students } from './students'
import { faculty } from './faculty'
import { events } from './events'
import { jobs } from './jobs'
import { research } from './research'
import { projects } from './projects'
import { startups } from './startups'
import { notes } from './notes'
import { exams, results } from './exams'
import { notices } from './notices'

// Mock admin user (in real app, this comes from auth)
export const adminUser = {
  id: 'admin-001',
  name: 'Dr. Admin User',
  email: 'admin@cvrp.edu.in',
  university: 'cvrp',
  role: 'superadmin', // superadmin | moderator | exams | placements | content
  permissions: [
    'notices:read', 'notices:write', 'notices:publish', 'notices:delete',
    'events:read', 'events:approve', 'events:reject', 'events:delete',
    'exams:read', 'exams:write', 'exams:publish',
    'results:read', 'results:write', 'results:publish',
    'placements:read', 'placements:write', 'placements:verify',
    'users:read', 'users:manage',
    'settings:read', 'settings:write',
  ],
  avatar: null,
  lastLogin: '2024-01-18T08:30:00Z',
}

// Get admin user for a university (mock - replace with real auth)
export const getAdminUser = (universityId = 'cvrp') => ({
  ...adminUser,
  university: universityId,
})

// University-scoped selectors for admin
export const getAdminStudents = (uniId) => students.filter(s => s.university === uniId)
export const getAdminFaculty = (uniId) => faculty.filter(f => f.university === uniId)
export const getAdminEvents = (uniId) => events.filter(e => e.university === uniId)
export const getAdminJobs = (uniId) => jobs.filter(j => j.university === uniId)
export const getAdminResearch = (uniId) => research.filter(r => r.university === uniId)
export const getAdminProjects = (uniId) => projects.filter(p => p.university === uniId)
export const getAdminStartups = (uniId) => startups.filter(s => s.university === uniId)
export const getAdminNotes = (uniId) => notes.filter(n => n.university === uniId)
export const getAdminExams = (uniId) => exams.filter(e => {
  // Exams don't have university field - filter by branch/university mapping
  return true // For now, return all exams
})
export const getAdminResults = (uniId) => results.filter(r => {
  // Results don't have university field
  return true
})
export const getAdminNotices = (uniId) => notices.filter(n => n.university === uniId)

// Admin dashboard stats
export const getAdminStats = (uniId) => {
  const uniStudents = getAdminStudents(uniId)
  const uniFaculty = getAdminFaculty(uniId)
  const uniEvents = getAdminEvents(uniId)
  const uniJobs = getAdminJobs(uniId)
  const uniNotices = getAdminNotices(uniId)

  return {
    students: {
      total: uniStudents.length,
      verified: uniStudents.filter(s => s.verified).length,
      pending: uniStudents.filter(s => !s.verified).length,
      byBranch: uniStudents.reduce((acc, s) => {
        acc[s.branch] = (acc[s.branch] || 0) + 1
        return acc
      }, {}),
    },
    faculty: {
      total: uniFaculty.length,
      byDepartment: uniFaculty.reduce((acc, f) => {
        acc[f.department] = (acc[f.department] || 0) + 1
        return acc
      }, {}),
    },
    events: {
      total: uniEvents.length,
      upcoming: uniEvents.filter(e => e.status === 'upcoming').length,
      ongoing: uniEvents.filter(e => e.status === 'ongoing').length,
      completed: uniEvents.filter(e => e.status === 'completed').length,
      pendingApproval: uniEvents.filter(e => e.approvalStatus === 'pending').length,
    },
    jobs: {
      total: uniJobs.length,
      open: uniJobs.filter(j => j.status === 'open').length,
      closed: uniJobs.filter(j => j.status === 'closed').length,
      verified: uniJobs.filter(j => j.verified).length,
      pendingVerification: uniJobs.filter(j => !j.verified).length,
    },
    notices: {
      total: uniNotices.length,
      published: uniNotices.filter(n => n.status === 'published').length,
      draft: uniNotices.filter(n => n.status === 'draft').length,
      archived: uniNotices.filter(n => n.status === 'archived').length,
      pinned: uniNotices.filter(n => n.pinned && n.status === 'published').length,
    },
  }
}

// Recent activity for dashboard
export const getRecentActivity = (uniId, limit = 10) => {
  const activities = [
    ...getAdminStudents(uniId).slice(0, 3).map(s => ({
      id: `activity-student-${s.id}`,
      type: 'student_registered',
      title: `New student registered: ${s.name}`,
      subtitle: `${s.branch} · Year ${s.year}`,
      timestamp: s.createdAt || '2024-01-15T10:00:00Z',
      status: s.verified ? 'verified' : 'pending',
    })),
    ...getAdminEvents(uniId).slice(0, 3).map(e => ({
      id: `activity-event-${e.id}`,
      type: 'event_created',
      title: `Event submitted: ${e.title}`,
      subtitle: e.type,
      timestamp: e.createdAt || '2024-01-14T14:30:00Z',
      status: e.approvalStatus || 'pending',
    })),
    ...getAdminJobs(uniId).slice(0, 2).map(j => ({
      id: `activity-job-${j.id}`,
      type: 'job_posted',
      title: `Job posted: ${j.title}`,
      subtitle: `${j.company} · ${j.type}`,
      timestamp: j.postedDate || '2024-01-13T09:15:00Z',
      status: j.verified ? 'verified' : 'pending_verification',
    })),
  ]

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

// University info for admin context
export const getAdminUniversity = (uniId) => universities.find(u => u.id === uniId) || universities[0]

// Permission helpers
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false
  if (user.role === 'superadmin') return true
  return user.permissions.includes(permission)
}

export const canAccess = (user, ...permissions) => {
  return permissions.some(p => hasPermission(user, p))
}