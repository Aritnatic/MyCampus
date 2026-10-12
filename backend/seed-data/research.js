// Research opportunities
export const research = [
  {
    id: 'res-001',
    title: 'Federated Learning for Healthcare Data Privacy',
    university: 'iitbbs',
    department: 'Computer Science & Engineering',
    supervisor: 'Dr. Kavita Singh',
    supervisorId: 'fac-005',
    type: 'funded',
    status: 'recruiting',
    duration: '12-18 months',
    stipend: '₹25,000/month + conference travel',
    description: 'Develop privacy-preserving federated learning frameworks for multi-institutional healthcare data. Focus on differential privacy, secure aggregation, and medical imaging.',
    longDescription: `This project aims to enable collaborative machine learning across hospitals without sharing raw patient data. We explore:

**Research Questions:**
- How to maintain model utility under strict differential privacy guarantees?
- Efficient secure aggregation protocols for medical imaging models
- Handling non-IID data distributions across hospitals
- Regulatory compliance (HIPAA, GDPR) in FL systems

**Tech Stack:** PyTorch, TensorFlow Privacy, OpenMined PySyft, Flower FL framework

**Expected Outcomes:** 2-3 top-tier publications (NeurIPS, ICML, ICLR, MICCAI), open-source FL library for healthcare

**Funding:** ICMR-DST Joint Grant, Google Research India Grant`,
    requiredSkills: ['Python', 'PyTorch', 'Machine Learning', 'Privacy-preserving ML', 'Distributed Systems'],
    preferredSkills: ['Federated Learning', 'Differential Privacy', 'Medical Imaging', 'Cryptography'],
    eligibility: ['B.Tech 3rd/4th year', 'M.Tech 1st/2nd year', 'Strong ML fundamentals', 'Research aptitude'],
    positions: 3,
    applicants: 24,
    deadline: '2024-02-28',
    tags: ['Federated Learning', 'Healthcare AI', 'Privacy', 'Publication', 'Funded'],
    crossUniversity: true,
    visibility: 'cross-university',
    featured: true
  },
  {
    id: 'res-002',
    title: 'Smart Grid Optimization using Reinforcement Learning',
    university: 'iitbbs',
    department: 'Electrical Engineering',
    supervisor: 'Dr. Amitabh Das',
    supervisorId: 'fac-006',
    type: 'funded',
    status: 'recruiting',
    duration: '12 months',
    stipend: '₹30,000/month',
    description: 'Apply multi-agent RL for real-time demand response and renewable integration in distribution grids. Collaboration with Odisha Power Utilities.',
    longDescription: `Develop RL-based control policies for:
- Distributed energy resource coordination
- Voltage regulation with high PV penetration
- Demand response optimization
- Grid resilience against contingencies

**Simulation Environment:** OpenDSS + Python (Gym interface), Pandapower
**Real-world Validation:** IIT Bhubaneswar Smart Grid Lab, Odisha Discom pilot

**Funding:** DST Clean Energy Research Initiative, Industry consortium`,
    requiredSkills: ['Python', 'Reinforcement Learning', 'Power Systems', 'Optimization', 'MATLAB/Simulink'],
    preferredSkills: ['Multi-Agent RL', 'OpenDSS', 'Pandapower', 'GridLAB-D'],
    eligibility: ['EE/ECE background', 'Strong math fundamentals', 'RL coursework or projects'],
    positions: 2,
    applicants: 18,
    deadline: '2024-02-20',
    tags: ['Reinforcement Learning', 'Smart Grid', 'Power Systems', 'Renewable Energy', 'Funded'],
    crossUniversity: true,
    visibility: 'cross-university',
    featured: true
  },
  {
    id: 'res-003',
    title: 'Low-Cost IoT Sensor Network for Precision Agriculture',
    university: 'cvrp',
    department: 'Electronics & Communication',
    supervisor: 'Dr. Rajesh Kumar',
    supervisorId: 'fac-002',
    type: 'funded',
    status: 'recruiting',
    duration: '10-12 months',
    stipend: '₹15,000/month + hardware budget',
    description: 'Design and deploy LoRaWAN-based soil moisture, pH, and NPK sensor nodes for smallholder farms. End-to-end system from sensor to farmer app.',
    longDescription: `Complete IoT system development:
- **Hardware:** Low-power sensor node design (PCB, enclosure, power management)
- **Connectivity:** LoRaWAN gateway deployment, network planning
- **Backend:** Time-series database, anomaly detection, irrigation advisory
- **Frontend:** Farmer-facing mobile app (multilingual), SMS alerts
- **Field Trials:** 50+ farms in Odisha districts

**Collaboration:** ICAR-NRRI, Odisha Agriculture Dept, Local FPOs

**Funding:** DST-SERB CRG, State Government Scheme`,
    requiredSkills: ['Embedded C', 'PCB Design (KiCad/Eagle)', 'LoRaWAN', 'Python', 'IoT Protocols', 'Mobile App (Flutter/React Native)'],
    preferredSkills: ['FreeRTOS', 'STM32', 'ESP32', 'Agriculture Domain Knowledge', 'Edge ML'],
    eligibility: ['ECE/EEE/CSE', 'Hardware prototyping experience', 'Field deployment interest'],
    positions: 4,
    applicants: 31,
    deadline: '2024-02-15',
    tags: ['IoT', 'Agriculture', 'LoRaWAN', 'Embedded Systems', 'Social Impact', 'Funded'],
    crossUniversity: false,
    visibility: 'campus',
    featured: true
  },
  {
    id: 'res-004',
    title: 'Geopolymer Concrete for Sustainable Construction',
    university: 'cvrp',
    department: 'Civil Engineering',
    supervisor: 'Dr. Pradeep Jena',
    supervisorId: 'fac-004',
    type: 'funded',
    status: 'active',
    duration: '18 months',
    stipend: '₹20,000/month',
    description: 'Develop fly-ash based geopolymer concrete with enhanced durability. Life cycle assessment and carbon footprint analysis.',
    longDescription: `Sustainable alternative to Portland cement:
- Mix design optimization using industrial by-products (fly ash, GGBS, silica fume)
- Durability testing: chloride penetration, sulfate attack, carbonation
- Structural performance: beams, columns, slabs
- LCA and carbon credits quantification
- Field demonstration: campus building element

**Funding:** DST-SERB, Cement Industry Consortium`,
    requiredSkills: ['Concrete Technology', 'Materials Characterization', 'LCA Software', 'Statistical Analysis', 'Lab Testing'],
    preferredSkills: ['Geopolymer Chemistry', 'Microstructure Analysis (SEM/XRD)', 'BIM', 'Construction Experience'],
    eligibility: ['Civil Engineering', 'Materials Science', 'Chemistry background welcome'],
    positions: 2,
    applicants: 12,
    deadline: '2024-03-01',
    tags: ['Sustainable Materials', 'Geopolymer', 'Carbon Reduction', 'Construction', 'Funded'],
    crossUniversity: false,
    visibility: 'campus',
    featured: false
  },
  {
    id: 'res-005',
    title: 'AI-Driven Drug Discovery for Neglected Tropical Diseases',
    university: 'vit',
    department: 'Biotechnology',
    supervisor: 'Dr. Meera Krishnan',
    supervisorId: null,
    type: 'collaborative',
    status: 'recruiting',
    duration: '12-15 months',
    stipend: '₹18,000/month',
    description: 'Use graph neural networks and molecular docking to identify lead compounds for dengue, chikungunya, and leishmaniasis.',
    longDescription: `Computational drug discovery pipeline:
- **Data Curation:** ChEMBL, PubChem, BindingDB for target proteins
- **Models:** Graph Neural Networks (GNNs) for property prediction, Molecular docking (AutoDock Vina, GNINA)
- **Validation:** In vitro assays (collaboration with ICMR institutes)
- **Open Science:** All models and data open-sourced

**Collaboration:** CDRI Lucknow, NIPER Hyderabad, Open Source Drug Discovery`,
    requiredSkills: ['Python', 'PyTorch/TensorFlow', 'Cheminformatics (RDKit)', 'Molecular Docking', 'Bioinformatics'],
    preferredSkills: ['Graph Neural Networks', 'Drug Discovery Pipeline', 'HPC/GPU Computing', 'Structural Biology'],
    eligibility: ['Biotech/Bioinfo/CSE with Bio interest', 'Programming + Biology comfort'],
    positions: 3,
    applicants: 27,
    deadline: '2024-02-25',
    tags: ['Drug Discovery', 'GNN', 'Tropical Diseases', 'Open Science', 'Collaborative'],
    crossUniversity: true,
    visibility: 'cross-university',
    featured: true
  },
  {
    id: 'res-006',
    title: 'Autonomous Navigation for Agricultural Robots',
    university: 'soa',
    department: 'Mechanical Engineering',
    supervisor: 'Dr. Arun Mohapatra',
    supervisorId: null,
    type: 'funded',
    status: 'recruiting',
    duration: '12 months',
    stipend: '₹22,000/month',
    description: 'Develop vision-based navigation for crop-row following and precision spraying. ROS2, stereo vision, and IMU fusion.',
    longDescription: `Field robotics for precision agriculture:
- **Perception:** Stereo vision + semantic segmentation for crop/weed detection
- **Localization:** Visual-inertial odometry, GPS-denied navigation
- **Planning:** Row-following, headland turning, obstacle avoidance
- **Control:** MPC for differential drive, implement control
- **Platform:** Custom 4WD rover, 3D printed spray system

**Field Testing:** SOA Agricultural Research Farm, Farmer fields in Khordha`,
    requiredSkills: ['ROS2', 'C++', 'Python', 'Computer Vision (OpenCV)', 'Control Theory', 'Robotics'],
    preferredSkills: ['Stereo Vision', 'VIO', 'MPC', 'Semantic Segmentation', 'Field Robotics Experience'],
    eligibility: ['Mechanical/CSE/EE', 'Robotics coursework', 'Linux/ROS comfort'],
    positions: 2,
    applicants: 15,
    deadline: '2024-02-28',
    tags: ['Robotics', 'Agriculture', 'ROS2', 'Computer Vision', 'Autonomous Navigation', 'Funded'],
    crossUniversity: false,
    visibility: 'campus',
    featured: false
  }
]

export const getResearch = (id) => research.find(r => r.id === id)
export const getResearchByUniversity = (uniId) => research.filter(r => r.university === uniId)
export const getRecruitingResearch = () => research.filter(r => r.status === 'recruiting')
export const getCrossUniversityResearch = () => research.filter(r => r.crossUniversity && r.visibility === 'cross-university')
export const getFeaturedResearch = () => research.filter(r => r.featured && r.status === 'recruiting')