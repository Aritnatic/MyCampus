// Student roster for the Student List page.
// Mock data — CVRP students, branches CSE/ECE/CE/EE/ME/IT, semesters 1-8.

export const BRANCHES = ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT']

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const SECTIONS = ['A', 'B', 'C']

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohit', 'Ananya', 'Vikram', 'Sneha', 'Amit', 'Kavya', 'Arjun', 'Pooja',
  'Rahul', 'Divya', 'Siddharth', 'Meera', 'Karthik', 'Ishita', 'Aditya', 'Riya', 'Nikhil', 'Tanya',
  'Rohan', 'Shreya', 'Abhishek', 'Neha', 'Manish', 'Aishwarya', 'Sandeep', 'Anjali', 'Vivek', 'Swati',
  'Suresh', 'Geeta', 'Pradeep', 'Kiran', 'Rajesh', 'Lakshmi', 'Sandeep', 'Pallavi', 'Sandeep', 'Yamini',
]

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Singh', 'Patel', 'Reddy', 'Nair', 'Das', 'Mishra', 'Jain', 'Gupta',
  'Yadav', 'Iyer', 'Menon', 'Bose', 'Roy', 'Chatterjee', 'Mukherjee', 'Banerjee', 'Saha', 'Dey',
  'Mohanty', 'Sahu', 'Patnaik', 'Rath', 'Pradhan', 'Sethi', 'Tripathi', 'Dwivedi', 'Pandey', 'Tiwari',
]

function makeStudent(i, branch, semester, section) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length]
  const last = LAST_NAMES[(i * 7) % LAST_NAMES.length]
  const id = `STU-${branch}-${String(semester).padStart(1, '0')}${section}-${String(i + 1).padStart(3, '0')}`
  const baseCGPA = 6.5 + ((i * 13) % 35) / 10
  return {
    id,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@cvrp.edu.in`,
    university: 'cvrp',
    branch,
    semester,
    section,
    cgpa: Math.round(baseCGPA * 10) / 10,
    status: i % 17 === 0 ? 'inactive' : 'active',
    rollNo: `CV${String(2024 - Math.floor((semester - 1) / 2)).slice(-2)}${String((i * 11) % 9999).padStart(4, '0')}`,
    admitted: `202${4 - Math.floor((semester - 1) / 2)}-08-15`,
  }
}

// Build a realistic roster: ~15-25 students per section per semester per branch.
const _demoStudents = []
let n = 0
for (const branch of BRANCHES) {
  for (const sem of SEMESTERS) {
    for (const section of SECTIONS) {
      // Vary headcount: bigger branches have more sections filled
      const baseCount = branch === 'CSE' || branch === 'ECE' ? 12 : branch === 'ME' || branch === 'CE' ? 8 : 10
      const count = baseCount + ((n * 3) % 5)
      for (let k = 0; k < count; k++) {
        _demoStudents.push(makeStudent(n, branch, sem, section))
        n++
      }
    }
  }
}

import { makeLiveList } from './store'
export const students = makeLiveList('students', _demoStudents, 'students')

// Selectors
export const getStudentsByUniversity = (uniId) => students.filter(s => s.university === uniId)
export const getStudentsByBranch = (uniId, branch) => students.filter(s => s.university === uniId && s.branch === branch)
export const getStudentsBySemester = (uniId, sem) => students.filter(s => s.university === uniId && s.semester === sem)
export const getStudentById = (id) => students.find(s => s.id === id)
export const getStudentStats = (uniId) => {
  const list = getStudentsByUniversity(uniId)
  return {
    total: list.length,
    active: list.filter(s => s.status === 'active').length,
    inactive: list.filter(s => s.status === 'inactive').length,
    avgCGPA: list.length ? Math.round((list.reduce((sum, s) => sum + s.cgpa, 0) / list.length) * 10) / 10 : 0,
  }
}
