// Student projects
export const projects = [
  {
    id: 'prj-001',
    title: 'CampusNav - Indoor Navigation for CVRP',
    university: 'cvrp',
    team: ['Aritra Das', 'Priya Sharma', 'Vikram Singh'],
    teamIds: ['stu-001', 'stu-002', 'stu-007'],
    description: 'AR-based indoor navigation app for campus buildings. Uses visual positioning and Bluetooth beacons for meter-level accuracy.',
    longDescription: `CampusNav solves the "where is this room?" problem for freshers and visitors.

**Features:**
- AR arrow overlays on camera view for turn-by-turn navigation
- Offline maps with building floor plans
- Accessibility routes (ramps, elevators)
- Real-time crowd density for canteen/library
- Emergency exit guidance with haptic feedback

**Tech Stack:** React Native, ARCore/ARKit, Bluetooth LE, Node.js backend, PostgreSQL + PostGIS

**Progress:** MVP deployed on TestFlight/Play Console Internal. 200+ beta testers. Accuracy: 1.2m average.

**Looking For:** iOS developer (Swift/ARKit), Backend scaling help, UX researcher for accessibility`,
    status: 'active',
    stage: 'beta',
    category: 'Mobile App',
    tags: ['AR/VR', 'Mobile', 'Navigation', 'Campus', 'Open Source'],
    skills: ['React Native', 'ARCore', 'ARKit', 'Bluetooth LE', 'Node.js', 'PostgreSQL', 'PostGIS', 'TypeScript'],
    github: 'https://github.com/cvrp/campusnav',
    demo: 'https://campusnav.cvrp.edu.in/demo',
    lookingFor: ['iOS Developer', 'Backend Engineer', 'UX Researcher'],
    visibility: 'campus',
    featured: true,
    startDate: '2023-08-01',
    members: 3,
    maxMembers: 6
  },
  {
    id: 'prj-002',
    title: 'GreenGrade - AI Carbon Footprint Tracker',
    university: 'kiit',
    team: ['Arjun Patel', 'Rahul Mehta'],
    teamIds: ['stu-005', 'stu-003'],
    description: 'Browser extension + dashboard that estimates carbon footprint of your digital activities (streaming, cloud compute, browsing) and suggests reductions.',
    longDescription: `GreenGrade makes invisible digital emissions visible.

**Features:**
- Real-time CO2 estimation per tab/activity
- Cloud compute carbon tracking (AWS/GCP/Azure API integration)
- Video streaming quality vs carbon tradeoff suggestions
- Team/organization dashboards for green engineering
- Gamified reduction challenges and leaderboards

**Tech Stack:** TypeScript, React, Chrome Extension APIs, Cloud Provider APIs, PostgreSQL, Chart.js

**Progress:** Chrome Web Store published (500+ users). Backend API handling 10k req/day. Enterprise pilot with 2 startups.

**Looking For:** Cloud cost optimization expert, Data visualization designer, Growth/marketing co-founder`,
    status: 'active',
    stage: 'live',
    category: 'Sustainability',
    tags: ['Climate Tech', 'Browser Extension', 'Carbon Tracking', 'SaaS', 'Open Source'],
    skills: ['TypeScript', 'React', 'Chrome Extensions', 'AWS SDK', 'GCP SDK', 'Azure SDK', 'PostgreSQL', 'Chart.js'],
    github: 'https://github.com/kiit/greengarde',
    demo: 'https://greengarde.vercel.app',
    lookingFor: ['Cloud Expert', 'Data Viz Designer', 'Co-founder (Growth)'],
    visibility: 'cross-university',
    featured: true,
    startDate: '2023-06-15',
    members: 2,
    maxMembers: 5
  },
  {
    id: 'prj-003',
    title: 'MediLink - Telemedicine for Rural Odisha',
    university: 'iitbbs',
    team: ['Sneha Reddy', 'Kavya Nair'],
    teamIds: ['stu-004', 'stu-006'],
    description: 'Low-bandwidth telemedicine platform connecting rural PHCs with specialist doctors. Offline-first, multilingual, works on 2G.',
    longDescription: `MediLink addresses the specialist doctor shortage in rural Odisha.

**Features:**
- Async consultation (store-and-forward) for low bandwidth
- Offline patient records with sync when online
- Multilingual UI (Odia, Hindi, English, Telugu)
- AI triage assistant for health workers
- Prescription generation with digital signature
- Integration with ABHA (Ayushman Bharat Health Account)

**Tech Stack:** Flutter (mobile), Django (backend), PostgreSQL, TensorFlow Lite (on-device AI), WebRTC (when bandwidth permits)

**Progress:** Pilot in 5 PHCs in Koraput district. 500+ consultations completed. 92% patient satisfaction.

**Looking For:** Flutter developer, Django backend engineer, Public health domain expert, Regulatory/legal advisor`,
    status: 'active',
    stage: 'pilot',
    category: 'Healthcare',
    tags: ['Telemedicine', 'Rural Health', 'Offline-First', 'Social Impact', 'AI'],
    skills: ['Flutter', 'Django', 'PostgreSQL', 'TensorFlow Lite', 'WebRTC', 'ABHA Integration', 'Multilingual'],
    github: 'https://github.com/iitbbs/medilink',
    demo: null,
    lookingFor: ['Flutter Developer', 'Backend Engineer', 'Public Health Expert', 'Legal Advisor'],
    visibility: 'cross-university',
    featured: true,
    startDate: '2023-09-01',
    members: 2,
    maxMembers: 6
  },
  {
    id: 'prj-004',
    title: 'CodeMentor - AI Pair Programmer for Students',
    university: 'soa',
    team: ['Meera Joshi'],
    teamIds: ['stu-008'],
    description: 'VS Code extension that explains code, suggests fixes, and teaches concepts - like a patient TA who never gets tired.',
    longDescription: `CodeMentor is built for students learning to code, not just professionals.

**Features:**
- "Explain this code" in plain English (multiple levels: ELI5, Undergrad, Expert)
- Bug detection with "why this is wrong" explanations
- Concept cards: hover any keyword → instant micro-lesson
- Practice problems generated from your codebase
- Progress tracking: concepts mastered, weak areas
- Works offline for basic features (local LLM)

**Tech Stack:** TypeScript, VS Code Extension API, Ollama (local LLM), Tree-sitter (AST parsing)

**Progress:** Private beta with 50 students at SOA. 4.7/5 rating. Local LLM (CodeLlama-7B) runs on M1/M2 Macs and modern Windows.

**Looking For:** Compiler/AST expert, Educational psychology input, Windows optimization help, More beta testers`,
    status: 'active',
    stage: 'beta',
    category: 'EdTech',
    tags: ['AI', 'Education', 'VS Code', 'Local LLM', 'Developer Tools'],
    skills: ['TypeScript', 'VS Code Extension', 'Ollama', 'Tree-sitter', 'CodeLlama', 'AST'],
    github: 'https://github.com/soa/codementor',
    demo: 'https://codementor.soa.ac.in',
    lookingFor: ['Compiler Expert', 'Ed Psych Input', 'Windows Dev', 'Beta Testers'],
    visibility: 'cross-university',
    featured: false,
    startDate: '2023-11-01',
    members: 1,
    maxMembers: 4
  },
  {
    id: 'prj-005',
    title: 'AgriSense - Drone-Based Crop Health Monitoring',
    university: 'nist',
    team: ['Aditya Kumar', 'Vikram Singh'],
    teamIds: ['stu-009', 'stu-007'],
    description: 'Autonomous drone fleet for multispectral imaging of crops. NDVI analysis, disease detection, variable rate application maps.',
    longDescription: `Precision agriculture for small-to-medium farms in India.

**Features:**
- Autonomous flight planning for irregular fields
- Multispectral image stitching and orthomosaic generation
- NDVI, EVI, SAVI indices with temporal comparison
- Disease detection using CNN on high-res RGB
- Prescription maps for fertilizer/pesticide (compatible with spray drones)
- Farmer dashboard with WhatsApp alerts (Odia/Hindi)

**Tech Stack:** PX4/ArduPilot, ROS2, Python, OpenCV, PyTorch, QGIS, React + Mapbox

**Progress:** 3 drones built. Tested on 50 acres paddy + 20 acres mango. Disease detection F1: 0.87.

**Looking For:** Drone pilot (DGCA certified), Agronomist, React/Mapbox frontend, Grant writing help`,
    status: 'active',
    stage: 'prototype',
    category: 'AgriTech',
    tags: ['Drones', 'Computer Vision', 'Agriculture', 'ROS2', 'Precision Ag'],
    skills: ['PX4', 'ArduPilot', 'ROS2', 'Python', 'OpenCV', 'PyTorch', 'QGIS', 'React', 'Mapbox'],
    github: 'https://github.com/nist/agrisense',
    demo: null,
    lookingFor: ['DGCA Pilot', 'Agronomist', 'Frontend Dev', 'Grant Writer'],
    visibility: 'cross-university',
    featured: true,
    startDate: '2023-07-01',
    members: 2,
    maxMembers: 5
  },
  {
    id: 'prj-006',
    title: 'SkillSwap - Peer-to-Peer Skill Exchange Platform',
    university: 'vit',
    team: ['Ishita Banerjee'],
    teamIds: ['stu-010'],
    description: 'Time-banking platform where students teach each other skills. 1 hour teaching = 1 hour learning. No money, just time.',
    longDescription: `SkillSwap creates a curriculum-free learning economy on campus.

**Features:**
- Skill listings with proficiency verification (peer-endorsed)
- Matching algorithm: complementary skills + schedule overlap
- Session scheduling with integrated video/whiteboard
- Time-bank ledger (immutable, transparent)
- Reputation system: reliability, teaching quality, responsiveness
- Clubs/societies can host group workshops

**Tech Stack:** Next.js, PostgreSQL, Prisma, WebRTC (SimplePeer), Tailwind, NextAuth

**Progress:** Alpha deployed on Vercel. 120 signups in 2 weeks at VIT. Core matching + video working.

**Looking For:** Full-stack developer (Next.js), Community manager, UX designer, Campus ambassador program lead`,
    status: 'active',
    stage: 'alpha',
    category: 'EdTech',
    tags: ['Peer Learning', 'Time Banking', 'Skill Exchange', 'Community', 'Next.js'],
    skills: ['Next.js', 'PostgreSQL', 'Prisma', 'WebRTC', 'Tailwind', 'NextAuth', 'TypeScript'],
    github: 'https://github.com/vit/skillswap',
    demo: 'https://skillswap.vit.ac.in',
    lookingFor: ['Full-stack Dev', 'Community Manager', 'UX Designer', 'Campus Lead'],
    visibility: 'cross-university',
    featured: false,
    startDate: '2024-01-01',
    members: 1,
    maxMembers: 5
  }
]

export const getProject = (id) => projects.find(p => p.id === id)
export const getProjectsByUniversity = (uniId) => projects.filter(p => p.university === uniId)
export const getProjectsByStage = (stage) => projects.filter(p => p.stage === stage)
export const getCrossUniversityProjects = () => projects.filter(p => p.visibility === 'cross-university')
export const getFeaturedProjects = () => projects.filter(p => p.featured)
export const getProjectsLookingFor = (role) => projects.filter(p => p.lookingFor.some(r => r.toLowerCase().includes(role.toLowerCase())))