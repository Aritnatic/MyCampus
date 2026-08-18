// Placements & Careers - Job postings, companies, applications
export const jobs = [
  {
    id: 'job-001',
    university: 'cvrp',
    title: 'Software Engineer Intern',
    company: 'Tata Consultancy Services (TCS)',
    type: 'internship',
    status: 'open',
    branch: ['CSE', 'IT', 'ECE', 'EEE'],
    cgpaCutoff: 7.0,
    stipend: { min: 25000, max: 30000, currency: 'INR', period: 'month' },
    locations: ['Bhubaneswar', 'Pune', 'Hyderabad'],
    openings: 50,
    applications: 234,
    shortlisted: 45,
    selected: 12,
    postedBy: 'admin-002',
    postedAt: '2024-01-12T11:30:00Z',
    deadline: '2024-02-15T23:59:59Z',
    description: `Work on enterprise-grade applications, microservices, and cloud migration projects.

**Requirements:**
- Strong programming fundamentals (Java/Python/C++)
- Understanding of data structures & algorithms
- Basic knowledge of databases (SQL/NoSQL)
- Good communication skills

**Selection Process:**
1. Online Assessment (Aptitude + Technical)
2. Technical Interview (2 rounds)
3. HR Interview`,
    skills: ['Java', 'Python', 'SQL', 'Data Structures', 'Algorithms', 'Cloud Basics'],
    mode: 'hybrid',
    batch: '2025',
    verified: true,
  },
  {
    id: 'job-002',
    university: 'cvrp',
    title: 'Graduate Engineer Trainee',
    company: 'Infosys',
    type: 'full-time',
    status: 'open',
    branch: ['CSE', 'IT', 'ECE', 'EEE', 'CE', 'ME', 'EE'],
    cgpaCutoff: 6.5,
    stipend: { min: 360000, max: 420000, currency: 'INR', period: 'year' },
    locations: ['Mysuru', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai'],
    openings: 100,
    applications: 567,
    shortlisted: 89,
    selected: 23,
    postedBy: 'admin-002',
    postedAt: '2024-01-10T09:00:00Z',
    deadline: '2024-02-28T23:59:59Z',
    description: `Infosys Graduate Engineer Trainee program for 2024 batch.

**Training:** 24-week intensive training at Mysuru campus
**Bond:** 1 year service agreement

**Eligibility:**
- 2024 passing out batch
- No active backlogs
- 60%+ in 10th, 12th, and graduation`,
    skills: ['Programming Fundamentals', 'Database Concepts', 'OOPS', 'SDLC'],
    mode: 'onsite',
    batch: '2024',
    verified: true,
  },
  {
    id: 'job-003',
    university: 'cvrp',
    title: 'Backend Developer Intern',
    company: 'Swiggy',
    type: 'internship',
    status: 'closed',
    branch: ['CSE', 'IT'],
    cgpaCutoff: 8.0,
    stipend: { min: 40000, max: 50000, currency: 'INR', period: 'month' },
    locations: ['Bangalore'],
    openings: 10,
    applications: 189,
    shortlisted: 28,
    selected: 8,
    postedBy: 'admin-002',
    postedAt: '2023-12-01T10:00:00Z',
    deadline: '2023-12-31T23:59:59Z',
    description: `Build scalable backend services for food delivery platform.

**Tech Stack:** Go, Python, PostgreSQL, Redis, Kubernetes
**Duration:** 6 months (Jan - Jun 2024)

**Requirements:**
- Strong Go/Python skills
- Understanding of distributed systems
- Experience with REST APIs & microservices`,
    skills: ['Go', 'Python', 'PostgreSQL', 'Redis', 'Kubernetes', 'Microservices'],
    mode: 'onsite',
    batch: '2024',
    verified: true,
  },
  {
    id: 'job-004',
    university: 'cvrp',
    title: 'Civil Engineer - Site Supervisor',
    company: 'Larsen & Toubro (L&T)',
    type: 'full-time',
    status: 'open',
    branch: ['CE'],
    cgpaCutoff: 6.0,
    stipend: { min: 450000, max: 550000, currency: 'INR', period: 'year' },
    locations: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bhubaneswar'],
    openings: 25,
    applications: 145,
    shortlisted: 32,
    selected: 5,
    postedBy: 'admin-002',
    postedAt: '2024-01-08T11:00:00Z',
    deadline: '2024-03-15T23:59:59Z',
    description: `Site supervision for infrastructure projects (roads, bridges, buildings).

**Requirements:**
- B.Tech Civil Engineering
- Knowledge of construction practices
- AutoCAD, STAAD Pro proficiency
- Willingness to travel to project sites`,
    skills: ['AutoCAD', 'STAAD Pro', 'Construction Management', 'Site Supervision', 'Quality Control'],
    mode: 'onsite',
    batch: '2024',
    verified: true,
  },
  {
    id: 'job-005',
    university: 'cvrp',
    title: 'Electrical Design Engineer',
    company: 'Siemens',
    type: 'full-time',
    status: 'open',
    branch: ['EE', 'EEE'],
    cgpaCutoff: 7.5,
    stipend: { min: 600000, max: 800000, currency: 'INR', period: 'year' },
    locations: ['Gurgaon', 'Bangalore', 'Pune'],
    openings: 15,
    applications: 98,
    shortlisted: 24,
    selected: 3,
    postedBy: 'admin-002',
    postedAt: '2024-01-15T14:00:00Z',
    deadline: '2024-03-01T23:59:59Z',
    description: `Design and develop electrical systems for industrial automation.

**Requirements:**
- Strong in Power Systems, Control Systems
- MATLAB/Simulink, ETAP proficiency
- Knowledge of IEC standards
- 0-2 years experience preferred`,
    skills: ['MATLAB', 'Simulink', 'ETAP', 'Power Systems', 'Control Systems', 'IEC Standards'],
    mode: 'hybrid',
    batch: '2024',
    verified: true,
  },
  {
    id: 'job-006',
    university: 'cvrp',
    title: 'Mechanical Design Engineer Intern',
    company: 'Mahindra & Mahindra',
    type: 'internship',
    status: 'open',
    branch: ['ME'],
    cgpaCutoff: 7.0,
    stipend: { min: 20000, max: 25000, currency: 'INR', period: 'month' },
    locations: ['Chennai', 'Pune', 'Mumbai'],
    openings: 20,
    applications: 167,
    shortlisted: 38,
    selected: 0,
    postedBy: 'admin-002',
    postedAt: '2024-01-18T09:30:00Z',
    deadline: '2024-02-20T23:59:59Z',
    description: `Automotive design and development for SUV portfolio.

**Requirements:**
- Strong in CAD (CATIA/SolidWorks/NX)
- GD&T knowledge
- Automotive domain interest
- 6 months internship (Feb - Jul 2024)`,
    skills: ['CATIA', 'SolidWorks', 'NX', 'GD&T', 'Automotive Design', 'PLM'],
    mode: 'onsite',
    batch: '2025',
    verified: true,
  },
  {
    id: 'job-007',
    university: 'cvrp',
    title: 'Data Analyst Intern',
    company: 'Accenture',
    type: 'internship',
    status: 'draft',
    branch: ['CSE', 'IT', 'ECE', 'EEE', 'CE', 'ME', 'EE'],
    cgpaCutoff: 6.5,
    stipend: { min: 30000, max: 35000, currency: 'INR', period: 'month' },
    locations: ['Bangalore', 'Hyderabad', 'Pune'],
    openings: 30,
    applications: 0,
    shortlisted: 0,
    selected: 0,
    postedBy: 'admin-002',
    postedAt: null,
    deadline: '2024-03-01T23:59:59Z',
    description: `Data analytics and visualization for client projects.

**Requirements:**
- Python/R for data analysis
- SQL, Tableau/PowerBI
- Statistical thinking
- Problem-solving mindset`,
    skills: ['Python', 'R', 'SQL', 'Tableau', 'PowerBI', 'Statistics'],
    mode: 'hybrid',
    batch: '2025',
    verified: false,
  },
  {
    id: 'job-008',
    university: 'cvrp',
    title: 'VLSI Design Engineer',
    company: 'Intel',
    type: 'full-time',
    status: 'open',
    branch: ['ECE', 'EEE'],
    cgpaCutoff: 8.5,
    stipend: { min: 1200000, max: 1500000, currency: 'INR', period: 'year' },
    locations: ['Bangalore', 'Hyderabad'],
    openings: 8,
    applications: 45,
    shortlisted: 12,
    selected: 2,
    postedBy: 'admin-002',
    postedAt: '2024-01-05T10:00:00Z',
    deadline: '2024-02-28T23:59:59Z',
    description: `Cutting-edge VLSI design for next-gen processors.

**Requirements:**
- Strong in Digital VLSI, Verilog/SystemVerilog
- UVM verification methodology
- CAD tools: Cadence, Synopsys
- Publications in VLSI conferences a plus`,
    skills: ['Verilog', 'SystemVerilog', 'UVM', 'Cadence', 'Synopsys', 'Digital Design'],
    mode: 'onsite',
    batch: '2024',
    verified: true,
  },
]

export const companies = [
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