// Campus Events - for admin approval/management
export const events = [
  {
    id: 'evt-001',
    university: 'cvrp',
    title: 'TechFest 2024 - Annual Technical Festival',
    description: `Three-day technical festival featuring hackathons, workshops, tech talks, and competitions.

**Events Include:**
- 24-hour Hackathon (₹1L prize pool)
- ML/AI Workshop by Industry Experts
- Cybersecurity CTF Competition
- Technical Paper Presentation
- Robotics Competition
- Startup Pitch Competition

**Open to:** All branches, all years
**Registration:** Free via MyCampus App`,
    category: 'technical',
    type: 'fest',
    status: 'approved',
    approvalStatus: 'approved',
    startDate: '2024-03-15T09:00:00Z',
    endDate: '2024-03-17T22:00:00Z',
    venue: 'Main Auditorium, Academic Blocks, Open Air Theatre',
    organizer: 'Student Technical Council',
    organizerContact: 'techcouncil@cvrp.edu.in',
    expectedAttendees: 1500,
    registeredAttendees: 892,
    budget: 500000,
    approvedBy: 'admin-001',
    approvedAt: '2024-01-15T10:00:00Z',
    submittedBy: 'student-001',
    submittedAt: '2024-01-10T14:00:00Z',
    tags: ['hackathon', 'workshop', 'competition', 'tech-talks'],
    banner: null,
  },
  {
    id: 'evt-002',
    university: 'cvrp',
    title: 'Cultural Fest - Sanskriti 2024',
    description: `Annual cultural festival celebrating diversity and talent.

**Events:**
- Solo/Group Dance Competition
- Singing (Classical, Light, Western)
- Fashion Show
- Drama & Street Play
- Literary Events (Debate, Quiz, Creative Writing)
- Fine Arts Exhibition`,
    category: 'cultural',
    type: 'fest',
    status: 'pending',
    approvalStatus: 'pending',
    startDate: '2024-04-10T10:00:00Z',
    endDate: '2024-04-12T22:00:00Z',
    venue: 'Main Auditorium, Cultural Centre',
    organizer: 'Cultural Committee',
    organizerContact: 'cultural@cvrp.edu.in',
    expectedAttendees: 2000,
    registeredAttendees: 1245,
    budget: 800000,
    approvedBy: null,
    approvedAt: null,
    submittedBy: 'student-002',
    submittedAt: '2024-01-18T11:00:00Z',
    tags: ['dance', 'music', 'drama', 'fashion', 'literary'],
    banner: null,
  },
  {
    id: 'evt-003',
    university: 'cvrp',
    title: 'Hackathon 2024 - Smart Campus Solutions',
    description: `Internal hackathon focused on building solutions for campus problems.

**Themes:**
- Smart Attendance & Timetable
- Library Management System
- Hostel & Mess Optimization
- Campus Navigation & Safety
- Sustainable Campus Initiatives
- Student Mental Health Support

**Prizes:** ₹50k, ₹30k, ₹20k + Incubation Support
**Team Size:** 3-5 members
**Duration:** 36 hours`,
    category: 'technical',
    type: 'hackathon',
    status: 'pending',
    approvalStatus: 'under_review',
    startDate: '2024-02-24T09:00:00Z',
    endDate: '2024-02-25T21:00:00Z',
    venue: 'Innovation Lab, CSE Block',
    organizer: 'Coding Club',
    organizerContact: 'codingclub@cvrp.edu.in',
    expectedAttendees: 200,
    registeredAttendees: 156,
    budget: 150000,
    approvedBy: null,
    approvedAt: null,
    submittedBy: 'student-003',
    submittedAt: '2024-01-19T09:30:00Z',
    tags: ['hackathon', 'smart-campus', 'innovation', 'coding'],
    banner: null,
  },
  {
    id: 'evt-004',
    university: 'cvrp',
    title: 'Industry Expert Talk - Future of AI in Engineering',
    description: `Guest lecture by Dr. Anand Rao, VP AI Research at Microsoft.

**Topics:**
- Generative AI in Engineering Design
- AI-assisted Code Generation
- Career Opportunities in AI/ML
- Research Directions

**Open to:** All faculty and students (3rd & 4th year priority)
**Registration:** Required (limited seats)`,
    category: 'academic',
    type: 'seminar',
    status: 'approved',
    approvalStatus: 'approved',
    startDate: '2024-02-05T14:00:00Z',
    endDate: '2024-02-05T16:30:00Z',
    venue: 'Seminar Hall, Academic Block A',
    organizer: 'Department of CSE',
    organizerContact: 'cse.hod@cvrp.edu.in',
    expectedAttendees: 300,
    registeredAttendees: 267,
    budget: 50000,
    approvedBy: 'admin-001',
    approvedAt: '2024-01-12T16:00:00Z',
    submittedBy: 'faculty-001',
    submittedAt: '2024-01-10T10:00:00Z',
    tags: ['ai', 'machine-learning', 'career', 'guest-lecture'],
    banner: null,
  },
  {
    id: 'evt-005',
    university: 'cvrp',
    title: 'Blood Donation Camp',
    description: `Annual blood donation drive in collaboration with Red Cross Society.

**Organized by:** NSS Unit, CVRP
**Partner:** Odisha State Blood Transfusion Council
**Certificates:** Donor certificate + refreshments
**Eligibility:** 18-60 years, weight >45kg, hemoglobin >12.5g/dl`,
    category: 'social',
    type: 'camp',
    status: 'approved',
    approvalStatus: 'approved',
    startDate: '2024-01-26T09:00:00Z',
    endDate: '2024-01-26T16:00:00Z',
    venue: 'Medical Centre, Student Activity Centre',
    organizer: 'NSS Unit',
    organizerContact: 'nss@cvrp.edu.in',
    expectedAttendees: 500,
    registeredAttendees: 412,
    budget: 75000,
    approvedBy: 'admin-001',
    approvedAt: '2024-01-10T09:00:00Z',
    submittedBy: 'student-004',
    submittedAt: '2024-01-05T14:00:00Z',
    tags: ['blood-donation', 'social', 'nss', 'health'],
    banner: null,
  },
  {
    id: 'evt-006',
    university: 'cvrp',
    title: 'Sports Week - Inter-Branch Tournament',
    description: `Week-long sports tournament between branches.

**Sports:**
- Cricket (Tennis Ball)
- Football (5-a-side)
- Basketball
- Volleyball
- Badminton (Singles/Doubles)
- Table Tennis
- Chess & Carrom
- Athletics (100m, 400m, Relay)

**Points System:** Winner-10, Runner-up-6, Semi-4, Participation-1
**Championship Trophy:** Best Branch Overall`,
    category: 'sports',
    type: 'tournament',
    status: 'published',
    approvalStatus: 'approved',
    startDate: '2024-02-19T07:00:00Z',
    endDate: '2024-02-24T19:00:00Z',
    venue: 'Sports Complex, Playgrounds',
    organizer: 'Sports Committee',
    organizerContact: 'sports@cvrp.edu.in',
    expectedAttendees: 800,
    registeredAttendees: 567,
    budget: 200000,
    approvedBy: 'admin-001',
    approvedAt: '2024-01-18T12:00:00Z',
    submittedBy: 'student-005',
    submittedAt: '2024-01-15T10:00:00Z',
    tags: ['sports', 'cricket', 'football', 'tournament', 'inter-branch'],
    banner: null,
  },
  {
    id: 'evt-007',
    university: 'cvrp',
    title: 'Alumni Meet 2024 - Silver Jubilee Batch',
    description: `Special alumni reunion for 1999 batch (25 years) and 2014 batch (10 years).

**Schedule:**
- Campus Tour (10:00 AM)
- Department Visits (11:30 AM)
- Lunch with Faculty (1:00 PM)
- Cultural Program by Students (3:00 PM)
- Networking Dinner (7:00 PM)

**Registration:** ₹2000 per person (includes meals & kit)`,
    category: 'alumni',
    type: 'meetup',
    status: 'draft',
    approvalStatus: 'draft',
    startDate: '2024-03-02T10:00:00Z',
    endDate: '2024-03-02T22:00:00Z',
    venue: 'Alumni Centre, Convention Hall',
    organizer: 'Alumni Relations Cell',
    organizerContact: 'alumni@cvrp.edu.in',
    expectedAttendees: 300,
    registeredAttendees: 189,
    budget: 400000,
    approvedBy: null,
    approvedAt: null,
    submittedBy: 'staff-001',
    submittedAt: '2024-01-20T11:00:00Z',
    tags: ['alumni', 'reunion', 'networking', 'batch'],
    banner: null,
  },
  {
    id: 'evt-008',
    university: 'cvrp',
    title: 'Startup Bootcamp - Idea to MVP',
    description: `5-day intensive bootcamp for student entrepreneurs.

**Curriculum:**
- Day 1: Ideation & Problem Validation
- Day 2: Business Model Canvas
- Day 3: MVP Development Basics
- Day 4: Pitch Deck & Fundraising
- Day 5: Demo Day & Investor Connect

**Mentors:** Successful founders, VCs, Industry experts
**Outcome:** Top 3 teams get incubation space + seed funding
**Eligibility:** Current students + recent alumni (2 years)`,
    category: 'entrepreneurship',
    type: 'workshop',
    status: 'pending',
    approvalStatus: 'pending',
    startDate: '2024-03-25T09:00:00Z',
    endDate: '2024-03-29T18:00:00Z',
    venue: 'Incubation Centre, Innovation Hub',
    organizer: 'Entrepreneurship Cell',
    organizerContact: 'ecell@cvrp.edu.in',
    expectedAttendees: 50,
    registeredAttendees: 34,
    budget: 300000,
    approvedBy: null,
    approvedAt: null,
    submittedBy: 'student-006',
    submittedAt: '2024-01-19T15:00:00Z',
    tags: ['startup', 'entrepreneurship', 'bootcamp', 'mvp', 'funding'],
    banner: null,
  },
]

export const getEventsByUniversity = (uniId) => events.filter(e => e.university === uniId)
export const getEventsByStatus = (status) => events.filter(e => e.status === status)
export const getEventsByApprovalStatus = (approvalStatus) => events.filter(e => e.approvalStatus === approvalStatus)
export const getPendingEvents = (uniId) => events.filter(e => e.university === uniId && e.approvalStatus === 'pending')
export const getApprovedEvents = (uniId) => events.filter(e => e.university === uniId && e.approvalStatus === 'approved')
export const getEventById = (id) => events.find(e => e.id === id)
export const getUpcomingEvents = (uniId) => events.filter(e => e.university === uniId && new Date(e.startDate) > new Date())
export const getPastEvents = (uniId) => events.filter(e => e.university === uniId && new Date(e.endDate) < new Date())