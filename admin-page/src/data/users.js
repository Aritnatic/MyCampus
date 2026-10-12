// Mock user accounts for the 3 login modes (Individual, University, Admin).
// In a real backend these would come from a DB with hashed passwords.

export const individualUsers = [
  {
    id: 'ind-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    mode: 'individual',
    interests: ['AI/ML', 'Web Development', 'Hackathons'],
    verified: true,
    status: 'active',
  },
  {
    id: 'ind-002',
    name: 'Rohit Kumar',
    email: 'rohit.kumar@gmail.com',
    mode: 'individual',
    interests: ['Robotics', 'IoT', 'Startups'],
    verified: true,
    status: 'active',
  },
]

// "University" mode = verified student/faculty of a specific university, scoped access.
export const universityUsers = [
  {
    id: 'uni-001',
    name: 'Ananya Das',
    email: 'ananya.das@cvrp.edu.in',
    mode: 'university',
    university: 'cvrp',
    role: 'student',
    branch: 'CSE',
    year: 3,
    status: 'active',
  },
  {
    id: 'uni-002',
    name: 'Vikash Yadav',
    email: 'vikash.yadav@cvrp.edu.in',
    mode: 'university',
    university: 'cvrp',
    role: 'student',
    branch: 'ECE',
    year: 4,
    status: 'active',
  },
  {
    id: 'uni-003',
    name: 'Dr. S. Mishra',
    email: 's.mishra@cvrp.edu.in',
    mode: 'university',
    university: 'cvrp',
    role: 'faculty',
    department: 'CSE',
    status: 'active',
  },
]

// Re-export admin users (already in data/admin.js) under the unified name.
export { adminUsers } from './admin'
