// Student startups
export const startups = [
  {
    id: 'stp-001',
    name: 'EduVerse',
    university: 'cvrp',
    founded: '2023',
    stage: 'Seed',
    team: ['Aritra Das', 'Priya Sharma'],
    teamIds: ['stu-001', 'stu-002'],
    tagline: 'Adaptive learning platform that personalizes engineering education using AI.',
    description: 'EduVerse builds adaptive learning paths for engineering students. Our AI analyzes performance, identifies knowledge gaps, and generates personalized practice. Used by 5 colleges in pilot.',
    longDescription: `EduVerse is transforming how engineering students learn.

**Problem:** One-size-fits-all lectures leave 40% of students behind. Engineering dropout rates are high.

**Solution:** Adaptive learning engine that:
- Diagnoses knowledge gaps via smart quizzes
- Generates personalized practice paths
- Explains concepts via AI tutor (multilingual)
- Tracks mastery with spaced repetition
- Gives instructors class-level insights

**Traction:**
- 5 college pilots, 2,000 students onboarded
- 73% improvement in assessment scores
- 4.2/5 student satisfaction
- 2 LOIs from engineering colleges

**Ask:** Raising ₹50L seed | Looking for: CTO, Growth lead, Institutional partnerships`,
    sector: 'EdTech',
    rolesOpen: [
      { role: 'CTO / Tech Lead', type: 'co-founder', equity: '10-15%' },
      { role: 'Growth Lead', type: 'full-time', equity: '2-4%', salary: '₹8-12 LPA' },
      { role: 'Content Strategist (Engineering)', type: 'contract', salary: '₹40k-60k/month' },
      { role: 'Institutional Partnerships', type: 'full-time', equity: '1-3%' }
    ],
    skills: ['React', 'Node.js', 'Python', 'ML', 'Next.js', 'PostgreSQL', 'AWS', 'EdTech'],
    website: 'https://eduverse.tech',
    funding: 'Bootstrapped + ₹10L angel',
    teamSize: 6,
    status: 'hiring',
    seeking: true,
    featured: true
  },
  {
    id: 'stp-002',
    name: 'Carbonly',
    university: 'kiit',
    founded: '2022',
    stage: 'Pre-Seed',
    team: ['Arjun Patel', 'Rahul Mehta'],
    teamIds: ['stu-005', 'stu-003'],
    tagline: 'Carbon accounting API for Indian startups and SMBs.',
    description: 'Carbonly provides plug-and-play carbon accounting for Indian businesses. API integrates with accounting, cloud, and logistics to auto-calculate emissions.',
    longDescription: `Carbonly makes carbon accounting effortless for Indian businesses.

**Problem:** ESG reporting is manual, expensive, and inaccurate. SMBs can't afford consultants.

**Solution:**
- API auto-pulls data from accounting (Tally/Zoho), cloud (AWS/GCP), logistics (Delhivery)
- Activity-based emissions using India-specific emission factors
- Automated BRSR/GHG Protocol reports
- Reduction recommendations with ROI

**Traction:**
- 15 paying customers (startups + 2 enterprises)
- ₹3L MRR
- Part of KIIT TBI incubator
- Selected for climate accelerator

**Ask:** Raising ₹1Cr pre-seed | Looking for: Founding backend engineer, Sales lead (B2B), Sustainability analyst`,
    sector: 'ClimateTech',
    rolesOpen: [
      { role: 'Founding Backend Engineer', type: 'co-founder', equity: '8-12%' },
      { role: 'B2B Sales Lead', type: 'full-time', salary: '₹10-14 LPA + commission' },
      { role: 'Sustainability Analyst', type: 'full-time', salary: '₹7-9 LPA' },
      { role: 'DevOps Engineer', type: 'contract', salary: '₹80k-1L/month' }
    ],
    skills: ['Go', 'Python', 'PostgreSQL', 'AWS', 'API Design', 'Kubernetes', 'Sustainability', 'B2B Sales'],
    website: 'https://carbonly.io',
    funding: '₹30L pre-seed from TBI',
    teamSize: 5,
    status: 'hiring',
    seeking: true,
    featured: true
  },
  {
    id: 'stp-003',
    name: 'AgriLoop',
    university: 'nist',
    founded: '2023',
    stage: 'Idea',
    team: ['Aditya Kumar'],
    teamIds: ['stu-009'],
    tagline: 'Post-harvest loss reduction via IoT cold-chain and marketplace.',
    description: 'AgriLoop installs IoT sensors in cold storage and transport, reducing spoilage, then connects farmers to better-priced buyers via marketplace.',
    longDescription: `AgriLoop tackles India's 30% post-harvest loss.

**Problem:** Poor cold-chain and信息不对称 cost farmers billions. Middlemen capture margin.

**Solution (two-sided):**
- Cold storage/truck IoT monitors (temp, humidity, GPS) with spoilage alerts
- Farmer-to-buyer marketplace with transparent pricing
- Quality grading via computer vision at collection centers
- Working capital via FPO integration

**Traction:** Idea stage. MVP sensor built. 3 FPO LOIs in Ganjam district.

**Ask:** Looking for: Co-founder (tech), Agri domain advisor, Pilot partner FPOs, Grant applications`,
    sector: 'AgriTech',
    rolesOpen: [
      { role: 'Tech Co-founder', type: 'co-founder', equity: '20-30%' },
      { role: 'Agri Domain Advisor', type: 'advisor', equity: '1-2%' },
      { role: 'Field Operations Lead', type: 'full-time', salary: '₹5-7 LPA' }
    ],
    skills: ['IoT', 'Embedded', 'React Native', 'Node.js', 'Supply Chain', 'Agriculture', 'Marketplace'],
    website: null,
    funding: 'Grant applications in progress',
    teamSize: 2,
    status: 'hiring',
    seeking: true,
    featured: false
  },
  {
    id: 'stp-004',
    name: 'HealthBridge AI',
    university: 'iitbbs',
    founded: '2023',
    stage: 'Seed',
    team: ['Sneha Reddy', 'Kavya Nair'],
    teamIds: ['stu-004', 'stu-006'],
    tagline: 'Clinical decision support for resource-limited settings.',
    description: 'HealthBridge AI builds explainable ML models for early disease detection from routine clinical data, designed for PHCs and district hospitals.',
    longDescription: `HealthBridge AI brings specialist-level triage to under-resourced clinics.

**Problem:** Rural PHCs lack specialists. Late diagnosis increases mortality.

**Solution:**
- Risk stratification from routine vitals/labs/EHR
- Explainable models clinicians trust (SHAP-based)
- Multi-disease panels: sepsis, AKI, cardiac, maternal
- Offline-capable inference on modest hardware
- Integrated with government ABDM infrastructure

**Traction:**
- Validated on 200k anonymized records
- 0.91 AUROC for sepsis prediction
- MoU with 2 district hospitals
- ICMR grant recipient

**Ask:** Raising ₹2Cr seed | Looking for: ML Engineer (healthcare), Clinical informaticist, Regulatory lead`,
    sector: 'HealthTech',
    rolesOpen: [
      { role: 'ML Engineer (Healthcare)', type: 'full-time', equity: '1-3%', salary: '₹18-25 LPA' },
      { role: 'Clinical Informaticist', type: 'full-time', salary: '₹15-20 LPA' },
      { role: 'Regulatory & Compliance Lead', type: 'full-time', salary: '₹12-16 LPA' },
      { role: 'Frontend Engineer', type: 'contract', salary: '₹1-1.2L/month' }
    ],
    skills: ['PyTorch', 'Healthcare ML', 'Python', 'MLOps', 'React', 'SHAP', 'ABDM', 'Clinical Data'],
    website: 'https://healthbridge.ai',
    funding: '₹50L ICMR grant + ₹25L angel',
    teamSize: 7,
    status: 'hiring',
    seeking: true,
    featured: true
  },
  {
    id: 'stp-005',
    name: 'SkillForge Labs',
    university: 'soa',
    founded: '2023',
    stage: 'Pre-Seed',
    team: ['Meera Joshi'],
    teamIds: ['stu-008'],
    tagline: '微-learning platform for practical, job-ready skills.',
    description: 'SkillForge delivers 5-minute daily micro-lessons in practical skills (Git, SQL, Excel, design) with hands-on practice, built for busy students.',
    longDescription: `SkillForge makes skill-building a daily habit.

**Problem:** Students finish college without practical skills employers need. Courses are too long, theoretical.

**Solution:**
- 5-min daily micro-lessons with instant practice
- Project-based: build real things (not quizzes)
- Skill streaks and peer accountability
- Curated for Indian job market (SQL, Git, Excel, design, communication)
- Free core + Pro for advanced tracks

**Traction:** Beta, 800 users, 62% weekly retention, 4.5/5 rating.

**Ask:** Looking for: Mobile developer (React Native), Content creator (tech skills), Growth co-founder`,
    sector: 'EdTech',
    rolesOpen: [
      { role: 'Mobile Developer', type: 'co-founder', equity: '10-15%' },
      { role: 'Content Creator (Tech)', type: 'contract', salary: '₹50-70k/month' },
      { role: 'Growth Co-founder', type: 'co-founder', equity: '10-15%' }
    ],
    skills: ['React Native', 'Content', 'Growth', 'EdTech', 'Video', 'SQL', 'Git'],
    website: 'https://skillforge.xyz',
    funding: 'Bootstrapped',
    teamSize: 3,
    status: 'hiring',
    seeking: true,
    featured: false
  }
]

export const getStartup = (id) => startups.find(s => s.id === id)
export const getStartupsByUniversity = (uniId) => startups.filter(s => s.university === uniId)
export const getStartupsBySector = (sector) => startups.filter(s => s.sector.toLowerCase() === sector.toLowerCase())
export const getHiringStartups = () => startups.filter(s => s.status === 'hiring')
export const getFeaturedStartups = () => startups.filter(s => s.featured)
export const getStartupsHiringRole = (role) => startups.filter(s => s.rolesOpen.some(r => r.role.toLowerCase().includes(role.toLowerCase()) || r.type.toLowerCase().includes(role.toLowerCase())))