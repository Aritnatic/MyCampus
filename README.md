# 🎓 MyCampus

**A verified campus and cross-university collaboration platform.**

MyCampus connects students across universities through AI-powered discovery, verified identities, and real collaboration tools — turning isolated campus communities into one connected network.

**Institution:** C. V. Raman Polytechnic  
**Status:** 🚧 Active development — final-year major project.

---

## The Problem

Campus information today is scattered — spread across notices, WhatsApp groups, faculty communication, and word of mouth. Students struggle to find mentors, collaborators, research opportunities, and startups that match their interests. Results, exams, events, hackathons, and hiring updates are all fragmented across different channels.

**MyCampus's answer:** One platform. A verified campus layer, combined with connected opportunities across universities.

---

## Project Goals (4 Objectives)

1. **Unify Campus Life** — Centralize notices, events, results, exams, notes, faculty info, and general campus information in one trusted platform.
2. **Enable Discovery** — Help students find peers, mentors, projects, research, and startups aligned with their interests.
3. **Support Careers** — Surface hiring updates, hackathons, and competitions, plus structured career guidance — without ranking students.
4. **Keep It Trusted** — Keep college information private to verified users, while letting selected projects/research/startups connect across universities.

---

## Core Features (Grouped into 4 Categories)

### 1. Discovery, Mentorship & Campus
- Find similar students (peers with related interests/goals)
- Mentor discovery (seniors and experienced people)
- Collaboration matching (complementary skills for projects/research/startups)
- Semantic search (natural-language search for opportunities)
- **Interactive 2D campus map** (clickable buildings, roads, paths, with extruded depth)

### 2. Career, Research & Startup Growth
- Hiring updates (which companies are recruiting)
- Job requirements (skills/qualifications employers want)
- Faculty directory (professors + contact info)
- Research discovery (cross-university research opportunities)
- Career guidance (structured career direction)
- Startup discovery (student startups and roles they need)

### 3. Campus Life & Collaboration
- Event notifications (college events, activities, programs)
- Project discovery (student projects across universities)
- Cross-university collaboration (connect with teams beyond your own campus)
- Hackathons & competitions updates

### 4. Academics, Safety & Access
- Evacuation alerts (real-time emergency safety notifications)
- Results announcements (instant updates when results are out)
- Notes section (shared, organized study notes by subject)
- Exam dates & timetable (centralized exam schedule)
- College-verified access (notices, results, exams, safety info stay within the verified campus layer)

---

## Scope — Why MyCampus is Different

- **Not a generic social network** — combines a trusted digital campus with a wider collaboration network.
- **Campus Layer:** Students register with their official college identity to access college-specific info (notices, results, exams, safety updates).
- **Open Collaboration:** People/teams state what they're doing and need; relevant students discover and connect.
- **AI usage is targeted** — used specifically for semantic discovery and requirement matching, not as a gimmick; core campus functions run on standard software.
- **Cross-university visibility** — projects, research, startups, mentors, and opportunities are discoverable across universities according to visibility rules.

---

## 🛠️ Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React 18, Vite | ✅ Admin panel complete |
| Styling | Tailwind CSS | ✅ Custom admin design system |
| Routing | React Router v6 | ✅ Nested routes with layout |
| Icons | Lucide React | ✅ Consistent icon system |
| State | React hooks + Context | ✅ No external state lib yet |
| Build | Vite | ✅ Fast dev + optimized build |

**Upcoming decisions:** Backend, Database, Auth, Real-time, AI/ML, Deployment, Monorepo strategy

---

## 🚀 Getting Started (Admin Panel)

```bash
# Clone the repo
git clone https://github.com/GUD-marani-org/MyCampus_org.git
cd MyCampus_org/admin-page

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin panel will be running locally — check your terminal for the local dev URL.

### Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```
MyCampus_org/
├── CLAUDE.md                    # Architecture guide & decisions
├── admin-page/                  # Admin panel (complete)
│   ├── src/
│   │   ├── App.jsx              # Routes
│   │   ├── components/
│   │   │   ├── layout/          # AdminLayout, Sidebar, Header
│   │   │   └── admin/           # 10 reusable admin components
│   │   ├── pages/admin/         # 5 admin pages
│   │   ├── data/                # Mock data (6 files)
│   │   ├── hooks/               # useAdminTable
│   │   └── utils/
│   └── ...
└── mycampus/                    # Student app (to be built)
```

---

## 📄 Project Docs

- Abstract
- References
- Project Presentation
- [Architecture Guide (CLAUDE.md)](CLAUDE.md)

---

## 🎯 Current Progress

### ✅ Admin Panel (Complete)
- **5 Pages:** Dashboard, Notices & Events, Exams & Results, Placements, Settings
- **10 Reusable Components:** DataTable, FilterBar, FormModal, PageLayout, StatBar, Tabs, Table, Form, Badge
- **9 Column Definitions** for all entity types
- **Mock Data** for all entities
- **Responsive Layout** with collapsible sidebar, mobile support

### 🔄 Next Up
- Student app architecture & scaffolding
- Authentication system
- Backend API design
- Database schema

---

## 🤝 Contributing

This is a final-year major project. For questions or collaboration, reach out to the MyCampus team.

---

<p align="center">Made with ❤️ by the MyCampus team</p>