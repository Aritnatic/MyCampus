// Career paths. `core` skills are what entry-level roles ask for; `advanced` are what sets you apart.
// Nothing here ranks students: "readiness" is shown only to the student themselves, against the path.
export const careers = [
  {
    id: 'career-software', title: 'Software Engineer', icon: '💻', branches: ['CSE', 'IT', 'ECE'],
    summary: 'Design, build and ship software — web, mobile, backend or cloud. The most hired-for path on campus.',
    core: ['Data Structures', 'Algorithms', 'JavaScript', 'Python', 'SQL', 'Git', 'REST APIs'],
    advanced: ['System Design', 'TypeScript', 'Docker', 'Cloud', 'Testing'],
    roadmap: [
      { stage: 'Semesters 1–2', focus: 'Programming fundamentals', actions: ['Learn one language deeply (Python or C++)', 'Solve 50 beginner problems', 'Learn Git and GitHub'] },
      { stage: 'Semesters 3–4', focus: 'Core CS', actions: ['Data structures & algorithms', 'Databases and SQL', 'Build two small projects and put them on GitHub'] },
      { stage: 'Semesters 5–6', focus: 'Real projects & internships', actions: ['Build a full-stack project with real users', 'Apply for summer internships', 'Contribute to an open-source project'] },
      { stage: 'Semesters 7–8', focus: 'Placement readiness', actions: ['System design basics', 'Mock interviews', 'Polish resume and portfolio'] },
    ],
  },
  {
    id: 'career-data', title: 'Data Scientist / ML Engineer', icon: '📊', branches: ['CSE', 'IT', 'ECE'],
    summary: 'Turn data into decisions and models. Needs statistics, Python and a taste for experimentation.',
    core: ['Python', 'Statistics', 'SQL', 'Machine Learning', 'Pandas'],
    advanced: ['Deep Learning', 'TensorFlow', 'PyTorch', 'MLOps', 'Data Visualization'],
    roadmap: [
      { stage: 'Foundation', focus: 'Maths & Python', actions: ['Linear algebra, probability and statistics', 'Python with NumPy and Pandas', 'SQL for analysis'] },
      { stage: 'Core ML', focus: 'Classical machine learning', actions: ['Regression, trees, clustering', 'Take part in a Kaggle competition', 'Learn to evaluate models honestly'] },
      { stage: 'Specialise', focus: 'Pick vision, NLP or tabular', actions: ['Deep learning with PyTorch or TensorFlow', 'Build and deploy one end-to-end project', 'Read two papers and reproduce one'] },
    ],
  },
  {
    id: 'career-embedded', title: 'Embedded & IoT Engineer', icon: '📡', branches: ['ECE', 'EE', 'CSE'],
    summary: 'Write firmware and design hardware for devices — sensors, controllers, connected products.',
    core: ['C/C++', 'Microcontrollers', 'Arduino', 'Digital Electronics', 'PCB Design'],
    advanced: ['RTOS', 'ESP32', 'MQTT', 'LoRaWAN', 'Embedded Linux'],
    roadmap: [
      { stage: 'Foundation', focus: 'Electronics & C', actions: ['Digital electronics and circuits', 'C programming with pointers and bit operations', 'Blink, read a sensor, drive a motor on Arduino'] },
      { stage: 'Build', focus: 'Real hardware', actions: ['Design a PCB in KiCad', 'Build a sensor node that reports over Wi-Fi or LoRa', 'Learn an RTOS'] },
      { stage: 'Ship', focus: 'A product, not a demo', actions: ['Enclosure, power budget, OTA updates', 'Document it and enter a hardware hackathon'] },
    ],
  },
  {
    id: 'career-civil', title: 'Structural & Civil Engineer', icon: '🏗️', branches: ['CE'],
    summary: 'Design and oversee buildings, bridges and infrastructure — analysis, drawing and site work.',
    core: ['AutoCAD', 'STAAD.Pro', 'Surveying', 'Structural Analysis', 'Concrete Technology'],
    advanced: ['Revit', 'ETABS', 'BIM', 'Project Management', 'Sustainable Design'],
    roadmap: [
      { stage: 'Foundation', focus: 'Mechanics & drawing', actions: ['Strength of materials and structural analysis', 'AutoCAD drafting', 'Survey camp'] },
      { stage: 'Practice', focus: 'Software and site exposure', actions: ['STAAD.Pro or ETABS on a real frame', 'Site internship', 'Learn IS codes'] },
      { stage: 'Grow', focus: 'Specialise', actions: ['BIM with Revit', 'Prepare for GATE or a PE-track', 'Sustainable materials project'] },
    ],
  },
  {
    id: 'career-product', title: 'Product & Startup Builder', icon: '🚀', branches: ['CSE', 'IT', 'ECE', 'ME', 'CE', 'EE'],
    summary: 'Find a real problem, build a solution and get people to use it. Any branch, if you can ship.',
    core: ['Product Thinking', 'User Research', 'Figma', 'SQL', 'Communication'],
    advanced: ['Growth', 'Fundraising', 'Analytics', 'Sales', 'Leadership'],
    roadmap: [
      { stage: 'Explore', focus: 'Problems worth solving', actions: ['Talk to 20 potential users', 'Join a campus startup as an early team member', 'Learn Figma and basic prototyping'] },
      { stage: 'Build', focus: 'An MVP', actions: ['Ship in 4–6 weeks', 'Measure what people actually do', 'Find a co-founder with complementary skills'] },
      { stage: 'Grow', focus: 'Traction', actions: ['Pitch at a startup week', 'Apply to an incubator', 'Learn the basics of fundraising'] },
    ],
  },
  {
    id: 'career-security', title: 'Cybersecurity Analyst', icon: '🔐', branches: ['CSE', 'IT', 'ECE'],
    summary: 'Defend systems: find weaknesses before attackers do, monitor and respond to incidents.',
    core: ['Networking', 'Linux', 'Python', 'Cryptography', 'Operating Systems'],
    advanced: ['Penetration Testing', 'Wireshark', 'Incident Response', 'Cloud Security', 'Reverse Engineering'],
    roadmap: [
      { stage: 'Foundation', focus: 'How systems work', actions: ['Networking (TCP/IP, DNS, HTTP)', 'Linux command line', 'Python scripting'] },
      { stage: 'Practice', focus: 'Hands-on labs', actions: ['Capture-the-flag competitions', 'Set up a home lab', 'Learn web vulnerabilities (OWASP Top 10)'] },
      { stage: 'Specialise', focus: 'Offence or defence', actions: ['Security certification', 'Join the campus CTF team', 'Responsible disclosure on a bug bounty'] },
    ],
  },
  {
    id: 'career-power', title: 'Power & Electrical Engineer', icon: '⚡', branches: ['EE', 'ECE'],
    summary: 'Generate, transmit and control electrical power — grids, drives, automation and renewables.',
    core: ['Power Systems', 'Control Systems', 'MATLAB', 'Electrical Machines', 'Circuit Analysis'],
    advanced: ['PLC', 'SCADA', 'Power Electronics', 'Renewable Energy', 'Simulink'],
    roadmap: [
      { stage: 'Foundation', focus: 'Circuits & machines', actions: ['Circuit analysis and electrical machines', 'MATLAB basics', 'Lab work on transformers and motors'] },
      { stage: 'Systems', focus: 'Power and control', actions: ['Power system analysis', 'Control design in Simulink', 'Industrial visit to a substation'] },
      { stage: 'Specialise', focus: 'Automation or renewables', actions: ['PLC/SCADA training', 'Solar or EV charging project', 'Prepare for PSU exams or GATE'] },
    ],
  },
  {
    id: 'career-mechanical', title: 'Mechanical Design Engineer', icon: '⚙️', branches: ['ME'],
    summary: 'Design and manufacture machines and products — CAD, simulation and production.',
    core: ['SolidWorks', 'AutoCAD', 'Thermodynamics', 'Manufacturing Processes', 'Strength of Materials'],
    advanced: ['FEA', 'CFD', 'CNC', '3D Printing', 'Six Sigma'],
    roadmap: [
      { stage: 'Foundation', focus: 'Mechanics & drawing', actions: ['Engineering mechanics and thermodynamics', 'CAD drafting', 'Workshop practice'] },
      { stage: 'Design', focus: 'From model to part', actions: ['Parametric modelling in SolidWorks', 'FEA on a real component', 'Join a Baja or Formula team'] },
      { stage: 'Make', focus: 'Manufacturing', actions: ['CNC and 3D printing a prototype', 'Industry internship', 'Learn GD&T'] },
    ],
  },
]
