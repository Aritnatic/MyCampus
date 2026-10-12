// Participating universities
export const universities = [
  { id: 'cvrp', name: 'C. V. Raman Polytechnic', short: 'CVRP', city: 'Bhubaneswar', state: 'Odisha', tier: 'campus', verified: true },
  { id: 'kiit', name: 'KIIT University', short: 'KIIT', city: 'Bhubaneswar', state: 'Odisha', tier: 'partner' },
  { id: 'iitbbs', name: 'IIT Bhubaneswar', short: 'IIT-BBS', city: 'Bhubaneswar', state: 'Odisha', tier: 'partner' },
  { id: 'soa', name: 'SOA University', short: 'SOA', city: 'Bhubaneswar', state: 'Odisha', tier: 'partner' },
  { id: 'vit', name: 'VIT Bhubaneswar', short: 'VIT', city: 'Bhubaneswar', state: 'Odisha', tier: 'partner' },
  { id: 'nist', name: 'NIST University', short: 'NIST', city: 'Berhampur', state: 'Odisha', tier: 'partner' },
]

export const getUniversity = (id) => universities.find(u => u.id === id) || universities[0]