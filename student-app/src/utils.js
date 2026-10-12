// Mock data stores branch as a full name on profiles but a short code on exams/results.
const CODES = {
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication': 'ECE',
  'Civil Engineering': 'CE',
  'Electrical Engineering': 'EE',
  'Mechanical Engineering': 'ME',
  'Information Technology': 'IT',
}
export const branchCode = (name) => CODES[name] ?? name
