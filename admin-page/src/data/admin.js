import { getNoticesByUniversity } from './notices'
import { getEventsByUniversity } from './events'
import { getExamsByUniversity, getResultsByUniversity } from './exams'
import { getJobsByUniversity } from './placements'
import { makeLiveList } from './store'

// Admin users and university-scoped selectors
const _demoAdminUsers = [
  {
    id: 'admin-001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@cvrp.edu.in',
    mode: 'admin',
    university: 'cvrp',
    role: 'superadmin',
    permissions: ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users'],
    status: 'active',
    lastLogin: '2024-01-20T10:30:00Z',
    createdAt: '2023-06-15T09:00:00Z',
    avatar: null,
  },
  {
    id: 'admin-002',
    name: 'Prof. Anita Sharma',
    email: 'anita.sharma@cvrp.edu.in',
    mode: 'admin',
    university: 'cvrp',
    role: 'moderator',
    permissions: ['notices', 'events', 'placements'],
    status: 'active',
    lastLogin: '2024-01-19T14:20:00Z',
    createdAt: '2023-07-01T10:00:00Z',
    avatar: null,
  },
  {
    id: 'admin-003',
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@cvrp.edu.in',
    mode: 'admin',
    university: 'cvrp',
    role: 'exams',
    permissions: ['exams', 'results'],
    status: 'active',
    lastLogin: '2024-01-18T09:15:00Z',
    createdAt: '2023-08-10T11:00:00Z',
    avatar: null,
  },
]

export const adminUsers = makeLiveList('adminUsers', _demoAdminUsers, 'adminUsers')

export const currentAdmin = adminUsers[0] // Mock current logged-in admin

export const roles = [
  { id: 'superadmin', name: 'Super Admin', description: 'Full access to all modules and settings', color: 'admin-badge-info' },
  { id: 'moderator', name: 'Moderator', description: 'Manage notices, events, and placements', color: 'admin-badge-warning' },
  { id: 'exams', name: 'Exam Controller', description: 'Manage exams, schedules, and results', color: 'admin-badge-danger' },
  { id: 'placements', name: 'Placement Officer', description: 'Manage job postings and recruitment drives', color: 'admin-badge-success' },
  { id: 'content', name: 'Content Manager', description: 'Manage notices and announcements only', color: 'admin-badge-gray' },
]

export const permissions = [
  { id: 'notices', name: 'Notices & Announcements', modules: ['Create', 'Edit', 'Delete', 'Publish', 'Archive'] },
  { id: 'events', name: 'Events Management', modules: ['Create', 'Edit', 'Approve', 'Reject', 'Cancel'] },
  { id: 'exams', name: 'Exams & Timetables', modules: ['Create', 'Edit', 'Schedule', 'Cancel'] },
  { id: 'results', name: 'Results Management', modules: ['Upload', 'Publish', 'Re-publish', 'Download'] },
  { id: 'placements', name: 'Placements & Careers', modules: ['Create', 'Edit', 'Track Applications', 'Manage Companies'] },
  { id: 'settings', name: 'Settings & Security', modules: ['Admin Users', 'Roles', 'Verification Rules', 'Audit Logs'] },
  { id: 'users', name: 'User Management', modules: ['View', 'Edit Roles', 'Suspend', 'Activate'] },
]

// University-scoped data selectors
export const getAdminByUniversity = (uniId) => adminUsers.filter(a => a.university === uniId && a.status === 'active')

export const getAdminById = (id) => adminUsers.find(a => a.id === id)

export const getAdminByRole = (role) => adminUsers.filter(a => a.role === role)

export const hasPermission = (adminId, permission) => {
  const admin = getAdminById(adminId)
  return admin?.permissions?.includes(permission) ?? false
}

export const getRoleById = (id) => roles.find(r => r.id === id)

export const getPermissionById = (id) => permissions.find(p => p.id === id)

// Dashboard stats - computed from the actual data layer for the given university
export const getDashboardStats = (uniId) => {
  const uNotices = getNoticesByUniversity(uniId)
  const uEvents = getEventsByUniversity(uniId)
  const uExams = getExamsByUniversity(uniId)
  const uResults = getResultsByUniversity(uniId)
  const uJobs = getJobsByUniversity(uniId)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return {
    publishedNotices: uNotices.filter(n => n.status === 'published').length,
    upcomingEvents: uEvents.filter(e => e.approvalStatus === 'approved' && new Date(e.startDate) > now).length,
    scheduledExams: uExams.filter(e => e.status === 'scheduled').length,
    activeJobPostings: uJobs.filter(j => j.status === 'open').length,
    newThisWeek: {
      notices: uNotices.filter(n => n.publishedAt && new Date(n.publishedAt) > weekAgo).length,
      events: uEvents.filter(e => new Date(e.submittedAt) > weekAgo).length,
      exams: uExams.filter(e => new Date(e.createdAt) > weekAgo).length,
      jobs: uJobs.filter(j => j.postedAt && new Date(j.postedAt) > weekAgo).length,
    },
  }
}

// Recent activity - composed from real notice/event/exam/result/job records
export const getRecentActivity = (uniId, limit = 8) => {
  const uNotices = getNoticesByUniversity(uniId)
  const uEvents = getEventsByUniversity(uniId)
  const uExams = getExamsByUniversity(uniId)
  const uResults = getResultsByUniversity(uniId)
  const uJobs = getJobsByUniversity(uniId)

  const adminName = (id) => adminUsers.find(a => a.id === id)?.name || 'System'

  const items = [
    ...uNotices
      .filter(n => n.publishedAt)
      .map(n => ({
        id: `notice-${n.id}`,
        type: 'notice_published',
        title: n.title,
        actor: adminName(n.publishedBy),
        timestamp: n.publishedAt,
        status: n.status === 'published' ? 'completed' : 'pending',
      })),
    ...uEvents.map(e => ({
      id: `event-${e.id}`,
      type: e.approvalStatus === 'approved' ? 'event_approved' : 'event_pending',
      title: e.title,
      actor: adminName(e.approvedBy) || e.organizer,
      timestamp: e.approvedAt || e.submittedAt,
      status: e.approvalStatus === 'approved' ? 'completed' : 'pending',
    })),
    ...uExams.map(ex => ({
      id: `exam-${ex.id}`,
      type: ex.status === 'scheduled' ? 'exam_scheduled' : 'exam_pending',
      title: ex.title,
      actor: adminName(ex.createdBy),
      timestamp: ex.updatedAt || ex.createdAt,
      status: ex.status === 'scheduled' || ex.status === 'published' ? 'completed' : 'pending',
    })),
    ...uResults
      .filter(r => r.publishedAt)
      .map(r => ({
        id: `result-${r.id}`,
        type: 'result_published',
        title: `${r.branch} ${r.semester} Sem Results`,
        actor: adminName(r.uploadedBy),
        timestamp: r.publishedAt,
        status: 'completed',
      })),
    ...uJobs
      .filter(j => j.postedAt)
      .map(j => ({
        id: `job-${j.id}`,
        type: 'job_posted',
        title: `${j.title} - ${j.company}`,
        actor: adminName(j.postedBy),
        timestamp: j.postedAt,
        status: j.status === 'open' ? 'completed' : 'pending',
      })),
  ]

  return items
    .filter(i => i.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

// Pending items requiring admin attention - counted from the actual data
export const getPendingItems = (uniId) => {
  const uNotices = getNoticesByUniversity(uniId)
  const uEvents = getEventsByUniversity(uniId)
  const uExams = getExamsByUniversity(uniId)
  const uResults = getResultsByUniversity(uniId)
  const uJobs = getJobsByUniversity(uniId)

  return {
    notices: uNotices.filter(n => n.status === 'draft').length,
    events: uEvents.filter(e => e.approvalStatus === 'pending' || e.approvalStatus === 'under_review').length,
    exams: uExams.filter(e => e.status === 'draft').length,
    results: uResults.filter(r => r.status === 'pending' || r.status === 'uploaded').length,
    placements: uJobs.filter(j => j.status === 'draft').length,
  }
}