# MyCampus — Project Overview & Architecture Guide

## Project Overview

**Title:** MyCampus — A Verified Campus + Cross-University Collaboration Platform
**Institution:** C. V. Raman Polytechnic

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

## Architecture Notes (Living Document)

### Current State (Admin Panel - `admin-page/`)
- React + Vite + React Router
- Tailwind CSS (custom admin design system)
- 5 admin pages: Dashboard, Notices & Events, Exams & Results, Placements, Settings
- 10 reusable components (DataTable, FilterBar, FormModal, PageLayout, StatBar, Tabs, Table, Form, Badge)
- Column definitions for 9 entity types
- `useAdminTable` hook for table state management
- Mock data files (admin, events, exams, notices, placements, universities)

### Tech Stack Decisions
| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18, Vite | Admin panel complete |
| Styling | Tailwind CSS | Custom admin design tokens |
| Routing | React Router v6 | Nested routes with layout |
| Icons | Lucide React | Consistent icon system |
| State | React hooks + Context | No Redux/Zustand yet |
| Build | Vite | Fast dev + optimized build |

### Upcoming Architecture Decisions (To Be Finalized)
- [x] **Student App** (`student-app/`) — Expo / React Native (SDK 57) + Expo Router, separate from `admin-page/`
- [x] **Backend** (`backend/`) — Node/Express REST API, JWT auth, access rules in `backend/src/access.js`
- [x] **Database** — SQLite (`node:sqlite`) for dev; JSON documents with promoted columns. Revisit Postgres before production
- [x] **Auth** — custom: scrypt passwords + 7-day JWT with server-side revocation; registration verified by campus email domain + emailed code; reset/change password; token in Keychain/Keystore on the phone
- [x] **Real-time** — Server-Sent Events (one-time ticket auth) + Expo push; in-process bus, needs Redis before multi-instance
- [ ] **AI/ML** — Search is BM25 + synonyms today (`backend/src/search.js`); embeddings provider still undecided
- [ ] **Deployment** — Vercel, Netlify, Railway, or self-hosted?
- [ ] **Monorepo** — Turborepo, Nx, or pnpm workspaces?

---

## Development Workflow

### Adding a New Admin Feature
1. Create column definitions in `admin-page/src/components/admin/columns/`
2. Add mock data in `admin-page/src/data/`
3. Create page component in `admin-page/src/pages/admin/`
4. Add route in `admin-page/src/App.jsx`
5. Add nav item in `AdminSidebar.jsx`

### Code Style
- Functional components with hooks
- Tailwind utility classes (custom admin design tokens: `admin-*`, `primary-*`, `danger-*`)
- Component composition over inheritance
- Mock data separated from components

---

## Key Files Reference

```
admin-page/
├── src/
│   ├── App.jsx                          # Routes
│   ├── main.jsx                         # Entry point
│   ├── index.css                        # Tailwind + custom tokens
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx          # Main layout with sidebar/header
│   │   │   ├── AdminSidebar.jsx         # Navigation sidebar
│   │   │   └── AdminHeader.jsx          # Top header
│   │   └── admin/
│   │       ├── AdminDataTable.jsx       # Main data table
│   │       ├── AdminFilterBar.jsx       # Search, filters, export
│   │       ├── AdminFormModal.jsx       # Create/edit modal
│   │       ├── AdminPageLayout.jsx      # Page wrapper
│   │       ├── AdminStatBar.jsx         # Stats summary row
│   │       ├── AdminTabs.jsx            # Tab navigation
│   │       ├── AdminTable.jsx           # Base table
│   │       ├── AdminForm.jsx            # Form fields
│   │       ├── AdminBadge.jsx           # Status badges
│   │       └── columns/                 # 9 column definition files
│   ├── pages/admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── NoticesEventsPage.jsx
│   │   ├── ExamsResultsPage.jsx
│   │   ├── PlacementsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── data/                            # Mock data (6 files)
│   ├── hooks/
│   │   └── useAdminTable.js             # Table state hook
│   └── utils/
│       └── format.js                    # Formatting utilities
```

---

## Next Steps (Priority Order)

1. **Student App Architecture** — Decide monorepo vs separate repo, scaffold `mycampus/`
2. **Authentication System** — Design auth flow for both admin + student apps
3. **Backend API Design** — Define REST/GraphQL endpoints for all 4 feature categories
4. **Database Schema** — Design tables for users, notices, events, exams, results, placements, projects, mentors, etc.
5. **Real-time Layer** — Plan for notifications, evacuation alerts, live updates
6. **AI/Embeddings** — Plan semantic search implementation

---

*This document is living — update as architecture decisions are made.*