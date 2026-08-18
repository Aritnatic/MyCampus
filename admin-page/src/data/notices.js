// Campus Notices & Announcements
export const notices = [
  {
    id: 'not-001',
    university: 'cvrp',
    title: 'Semester Registration Opens for Even Sem 2024',
    body: `Registration for Even Semester 2024 opens on January 15, 2024. All students must complete registration by February 15, 2024 to avoid late fees.

**Key Dates:**
- Registration opens: Jan 15, 2024
- Regular registration closes: Feb 15, 2024
- Late registration (with fee): Feb 16 - Feb 28, 2024

**Process:**
1. Log in to the MyCampus portal
2. Navigate to Academics → Semester Registration
3. Select courses and confirm schedule
4. Pay fees online or at the accounts office

**Important:** Students with pending dues will not be able to register until cleared. Contact the Accounts Office for assistance.`,
    category: 'academic',
    status: 'published',
    priority: 'high',
    publishedBy: 'admin-001',
    publishedAt: '2024-01-10T09:00:00Z',
    expiresAt: '2024-02-15T23:59:59Z',
    targetAudience: 'students',
    branches: ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT'],
    pinned: true,
  },
  {
    id: 'not-002',
    university: 'cvrp',
    title: 'Campus Safety & Evacuation Drill - Feb 1, 2024',
    body: `Mandatory annual safety drill for all students, faculty, and staff. Conducted in coordination with Odisha Fire Services and NDRF.

**Drill Scenarios:**
- Fire Evacuation (All Blocks)
- Earthquake Drop-Cover-Hold
- Chemical Spill Response (Lab Areas)
- Medical Emergency Response
- Active Threat Lockdown Procedure

**Attendance:** Mandatory for all campus residents. Digital attendance via MyCampus app.

**Certification:** Participation certificate for all attendees.`,
    category: 'safety',
    status: 'published',
    priority: 'urgent',
    publishedBy: 'admin-001',
    publishedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-02-01T23:59:59Z',
    targetAudience: 'all',
    branches: ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT'],
    pinned: true,
  },
  {
    id: 'not-003',
    university: 'cvrp',
    title: 'TCS Internship Drive - Applications Open',
    body: `Tata Consultancy Services is hiring interns for its Digital Enterprise unit. Work on enterprise-grade applications, microservices, and cloud migration projects.

**Eligibility:**
- Branches: CSE, IT, ECE, EEE
- Year: 3rd & 4th year
- CGPA: 7.0+ preferred

**Stipend:** ₹25,000 - ₹30,000 per month
**Locations:** Bhubaneswar / Pune / Hyderabad
**Application Deadline:** February 15, 2024

**Apply via:** MyCampus → Careers → TCS Internship`,
    category: 'placement',
    status: 'published',
    priority: 'normal',
    publishedBy: 'admin-002',
    publishedAt: '2024-01-12T11:30:00Z',
    expiresAt: '2024-02-15T23:59:59Z',
    targetAudience: 'students',
    branches: ['CSE', 'IT', 'ECE', 'EEE'],
    pinned: false,
  },
  {
    id: 'not-004',
    university: 'cvrp',
    title: 'Library Extended Hours During Exam Period',
    body: `The Central Library will operate extended hours during the upcoming exam period (Feb 12 - Mar 1, 2024):

**Extended Hours:**
- Monday - Friday: 8:00 AM - 11:00 PM
- Saturday: 9:00 AM - 8:00 PM
- Sunday: 10:00 AM - 6:00 PM

**Additional Services:**
- Additional study spaces in Reading Hall B
- Free coffee/tea station (6 PM - 10 PM)
- Silent zones enforced strictly

Regular hours resume March 2, 2024.`,
    category: 'general',
    status: 'published',
    priority: 'low',
    publishedBy: 'admin-003',
    publishedAt: '2024-01-20T08:00:00Z',
    expiresAt: '2024-03-01T23:59:59Z',
    targetAudience: 'all',
    branches: ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT'],
    pinned: false,
  },
  {
    id: 'not-005',
    university: 'cvrp',
    title: 'Faculty Development Program - AI in Education',
    body: `A 3-day Faculty Development Program on "Integrating AI Tools in Teaching & Research" is scheduled for February 5-7, 2024.

**Organized by:** Teaching Learning Center, CVRP
**Venue:** Seminar Hall, Academic Block A
**Target:** All faculty members
**Registration:** Required by Jan 30, 2024

**Sessions Include:**
- AI for personalized learning
- Automated assessment tools
- Research acceleration with AI
- Ethical considerations`,
    category: 'academic',
    status: 'draft',
    priority: 'normal',
    publishedBy: 'admin-001',
    publishedAt: null,
    expiresAt: '2024-02-07T23:59:59Z',
    targetAudience: 'faculty',
    branches: ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT'],
    pinned: false,
  },
  {
    id: 'not-006',
    university: 'cvrp',
    title: 'Scholarship Applications - Merit & Need Based',
    body: `Applications open for the following scholarships for Academic Year 2023-24:

1. **Merit Scholarship** - Top 10% per branch (CGPA 9.0+)
2. **Need-Based Scholarship** - Family income < ₹2.5L/year
3. **SC/ST/OBC Scholarships** - As per government norms
4. **Sports/Cultural Excellence** - National/State level achievements

**Deadline:** March 31, 2024
**Apply at:** Scholarship Portal (scholarships.cvrp.edu.in)
**Documents Required:** Income certificate, caste certificate, marksheets, achievement proofs`,
    category: 'general',
    status: 'published',
    priority: 'normal',
    publishedBy: 'admin-002',
    publishedAt: '2024-01-05T09:00:00Z',
    expiresAt: '2024-03-31T23:59:59Z',
    targetAudience: 'students',
    branches: ['CSE', 'ECE', 'CE', 'EE', 'ME', 'IT'],
    pinned: false,
  },
]

export const getNotice = (id) => notices.find(n => n.id === id)
export const getNoticesByUniversity = (uniId) => notices.filter(n => n.university === uniId)
export const getNoticesByStatus = (status) => notices.filter(n => n.status === status)
export const getPublishedNotices = (uniId) => notices.filter(n => n.university === uniId && n.status === 'published' && new Date(n.expiresAt) > new Date())
export const getNoticesByCategory = (category) => notices.filter(n => n.category === category)
export const getPinnedNotices = (uniId) => notices.filter(n => n.university === uniId && n.pinned && n.status === 'published')