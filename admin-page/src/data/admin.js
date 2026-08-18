// Admin users and university-scoped selectors
export const adminUsers = [
  {
    id: 'admin-001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@cvrp.edu.in',
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
    university: 'cvrp',
    role: 'exams',
    permissions: ['exams', 'results'],
    status: 'active',
    lastLogin: '2024-01-18T09:15:00Z',
    createdAt: '2023-08-10T11:00:00Z',
    avatar: null,
  },
]

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

// Dashboard stats - university scoped
export const getDashboardStats = (uniId) => ({
  students: 2847,
  faculty: 186,
  pendingApprovals: 12,
  activeEvents: 8,
  publishedNotices: 5,
  scheduledExams: 24,
  pendingResults: 3,
  activeJobPostings: 15,
  totalApplications: 1247,
  placedStudents: 892,
})

// Recent activity - university scoped
export const getRecentActivity = (uniId, limit = 10) => [
  { id: 'act-001', type: 'notice_published', title: 'Semester Registration Opens for Even Sem 2024', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-20T09:00:00Z', status: 'completed' },
  { id: 'act-002', type: 'event_approved', title: 'TechFest 2024 - Annual Technical Festival', actor: 'Prof. Anita Sharma', timestamp: '2024-01-19T16:30:00Z', status: 'completed' },
  { id: 'act-003', type: 'exam_scheduled', title: 'Mid-Semester Exams - CSE 3rd Sem', actor: 'Dr. Vikram Singh', timestamp: '2024-01-19T11:00:00Z', status: 'completed' },
  { id: 'act-004', type: 'job_posted', title: 'TCS Internship Drive - Applications Open', actor: 'Prof. Anita Sharma', timestamp: '2024-01-18T14:20:00Z', status: 'completed' },
  { id: 'act-005', type: 'result_published', title: 'End-Sem Results - ECE 5th Sem', actor: 'Dr. Vikram Singh', timestamp: '2024-01-17T10:00:00Z', status: 'completed' },
  { id: 'act-006', type: 'notice_draft', title: 'Faculty Development Program - AI in Education', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-20T08:00:00Z', status: 'pending' },
  { id: 'act-007', type: 'event_pending', title: 'Hackathon 2024 - Internal Review', actor: 'Prof. Anita Sharma', timestamp: '2024-01-19T09:30:00Z', status: 'pending' },
  { id: 'act-008', type: 'exam_pending', title: 'Lab Exam Schedule - ME 4th Sem', actor: 'Dr. Vikram Singh', timestamp: '2024-01-18T16:00:00Z', status: 'pending' },
].slice(0, limit)

// Pending items requiring admin attention
export const getPendingItems = (uniId) => ({
  notices: 2,
  events: 3,
  exams: 1,
  results: 2,
  placements: 0,
})