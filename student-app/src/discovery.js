import { branchCode } from './utils'

// Presentation for each discovery kind. Listing, visibility, search and match scoring
// all happen on the server (backend/src/access.js); each item arrives with `_uni` attached.

export const KINDS = {
  people: {
    label: 'People',
    icon: 'people-outline',
    tone: 'violet',
    hint: 'Find peers and mentors who share your skills.',
    summary: (s) => ({
      title: s.name,
      subtitle: `${s.year >= 4 ? 'Mentor · ' : ''}${branchCode(s.branch)} · Year ${s.year} · ${s._uni?.short}`,
      blurb: s.bio,
      chips: s.skills.slice(0, 4),
    }),
    detail: (s) => ({
      title: s.name,
      subtitle: `${s.branch} · Year ${s.year} · ${s._uni?.name}`,
      badge: s.verified ? 'Verified' : null,
      body: s.bio,
      facts: [['Projects', s.projects], ['Connections', s.connections], ['Year', s.year]],
      groups: [
        { title: 'Skills', items: s.skills, tone: 'violet' },
        { title: 'Interests', items: s.interests, tone: 'blue' },
        { title: 'Looking for', items: s.lookingFor, tone: 'yellow' },
        { title: 'Achievements', items: s.achievements, list: true },
      ],
    }),
  },

  projects: {
    label: 'Projects',
    icon: 'rocket-outline',
    tone: 'blue',
    hint: 'Join student projects or start your own.',
    summary: (p) => ({
      title: p.title,
      subtitle: `${p.category} · ${p.stage} · ${p._uni?.short}`,
      blurb: p.description,
      chips: p.lookingFor.map((r) => `Needs ${r}`).slice(0, 3),
    }),
    detail: (p) => ({
      title: p.title,
      subtitle: `${p.category} · ${p._uni?.name}`,
      badge: p.stage,
      body: p.longDescription ?? p.description,
      facts: [['Team', `${p.members}/${p.maxMembers}`], ['Status', p.status], ['Started', p.startDate]],
      groups: [
        { title: 'Looking for', items: p.lookingFor, tone: 'yellow' },
        { title: 'Tech', items: p.skills, tone: 'violet' },
        { title: 'Team', items: p.team, list: true },
      ],
    }),
  },

  startups: {
    label: 'Startups',
    icon: 'bulb-outline',
    tone: 'yellow',
    hint: 'Student startups and the roles they need.',
    summary: (s) => ({
      title: s.name,
      subtitle: `${s.sector} · ${s.stage} · ${s._uni?.short}`,
      blurb: s.tagline,
      chips: s.rolesOpen.map((r) => r.role).slice(0, 3),
    }),
    detail: (s) => ({
      title: s.name,
      subtitle: `${s.sector} · ${s._uni?.name}`,
      badge: s.stage,
      body: s.longDescription ?? s.description,
      facts: [['Founded', s.founded], ['Team', s.teamSize], ['Status', s.status]],
      groups: [
        { title: 'Open roles', items: s.rolesOpen.map((r) => [r.role, r.type, r.equity && `${r.equity} equity`, r.salary].filter(Boolean).join(' · ')), list: true },
        { title: 'Skills', items: s.skills, tone: 'violet' },
        { title: 'Founders', items: s.team, list: true },
      ],
    }),
  },

  research: {
    label: 'Research',
    icon: 'flask-outline',
    tone: 'green',
    hint: 'Research openings across universities.',
    summary: (r) => ({
      title: r.title,
      subtitle: `${r.supervisor} · ${r._uni?.short} · ${r.status}`,
      blurb: r.description,
      chips: r.requiredSkills.slice(0, 4),
    }),
    detail: (r) => ({
      title: r.title,
      subtitle: `${r.supervisor} · ${r._uni?.name}`,
      badge: r.status,
      body: r.longDescription ?? r.description,
      facts: [['Duration', r.duration], ['Positions', r.positions], ['Deadline', r.deadline]],
      groups: [
        { title: 'Stipend', items: [r.stipend], list: true },
        { title: 'Required skills', items: r.requiredSkills, tone: 'violet' },
        { title: 'Preferred skills', items: r.preferredSkills, tone: 'blue' },
        { title: 'Eligibility', items: r.eligibility, list: true },
      ],
    }),
  },

  jobs: {
    label: 'Jobs',
    icon: 'briefcase-outline',
    tone: 'blue',
    hint: 'Internships and jobs, with the skills they want.',
    summary: (j) => ({
      title: j.title,
      subtitle: `${j.company} · ${j.type} · ${j.mode}`,
      blurb: j.stipend ?? j.salary ?? j.description,
      chips: j.skills.slice(0, 4),
    }),
    detail: (j) => ({
      title: j.title,
      subtitle: `${j.company} · ${j.location}`,
      badge: j.type,
      body: j.description,
      facts: [['Positions', j.positions], ['Applicants', j.applicants], ['Deadline', j.deadline]],
      groups: [
        { title: 'Pay', items: [j.stipend ?? j.salary].filter(Boolean), list: true },
        { title: 'Requirements', items: j.requirements, list: true },
        { title: 'Skills', items: j.skills, tone: 'violet' },
        { title: 'Eligible branches', items: j.eligibleBranches, tone: 'blue' },
      ],
    }),
  },

  faculty: {
    label: 'Faculty',
    icon: 'school-outline',
    tone: 'violet',
    hint: 'Teachers on your campus and what they research.',
    summary: (f) => ({
      title: f.name,
      subtitle: `${f.designation} · ${f.department}`,
      blurb: f.bio,
      chips: f.researchInterests.slice(0, 4),
    }),
    detail: (f) => ({
      title: f.name,
      subtitle: `${f.designation} · ${f.department}`,
      badge: f.verified ? 'Verified' : null,
      body: f.bio,
      facts: [['Publications', f.publications], ['Citations', f.citations], ['Projects', f.projects?.length ?? 0]],
      email: f.email,
      groups: [
        { title: 'Availability', items: [f.availability], list: true },
        { title: 'Research interests', items: f.researchInterests, tone: 'violet' },
        { title: 'Qualifications', items: f.qualifications, list: true },
        { title: 'Projects', items: f.projects, list: true },
      ],
    }),
  },
}

export const KIND_ORDER = ['people', 'projects', 'startups', 'research', 'jobs', 'faculty']
