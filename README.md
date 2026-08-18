# MyCampus

> **Verified Campus + Cross-University Collaboration Platform** for C. V. Raman Polytechnic

A React 18 + Vite prototype that centralizes campus information (notices, events, results, exams, notes, faculty) while enabling cross-university discovery of peers, mentors, projects, research, startups, and career opportunities.

---

## 🎯 Overview

MyCampus is a modern, full-featured campus platform prototype designed to demonstrate how a unified campus information system could work. It serves C. V. Raman Polytechnic (CVRP) as the primary institution while enabling cross-university collaboration with 5 other institutions.

### Key Features

- **📊 Dashboard** — Stats overview, quick actions, cross-university highlights
- **🗺️ Campus Map** — Interactive SVG map with pan/zoom and building selection
- **👥 Students Directory** — Search + filters (branch, university, interests, skills)
- **👨‍🏫 Faculty Directory** — Search + filters (department, research interests, university)
- **📅 Events** — Type/visibility filters for campus events
- **💼 Jobs Board** — Role/mode/university filters with save functionality
- **🔬 Research Opportunities** — Status/university filters for research positions
- **🚀 Projects Showcase** — Stage/university/"looking for" filters
- **🏢 Startups** — Sector/stage filters with open roles
- **📚 Notes Repository** — Branch/subject filters with download
- **📅 Timetable** — Exam schedules and results tabs
- **🌙 Dark Mode** — Full theme support with persistence

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 + Vite 5 |
| **Styling** | Tailwind CSS 3 (custom design system) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |
| **Data** | Centralized mock data pattern (11 data files) |

---

## 📁 Project Structure

```
MyCampus/
├── mycampus/                    # Main React application
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.jsx             # Entry point with BrowserRouter + ToastProvider
│   │   ├── App.jsx              # Route definitions (11 pages + placeholders)
│   │   ├── index.css            # Tailwind layers + global utilities
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx   # Orchestrates Sidebar + Header + Outlet
│   │   │   │   ├── Sidebar.jsx  # Collapsible nav (72px/260px) + user profile
│   │   │   │   └── Header.jsx   # Search, notifications, user menu
│   │   │   └── ui/              # 9 reusable components (barrel export)
│   │   │       ├── Button.jsx, Card.jsx, Badge.jsx, Avatar.jsx
│   │   │       ├── Input.jsx, Tabs.jsx, Dropdown.jsx, Modal.jsx, Toast.jsx
│   │   ├── pages/               # 11 page components
│   │   │   ├── Dashboard.jsx, CampusMap.jsx, Students.jsx
│   │   │   ├── Faculty.jsx, Events.jsx, Jobs.jsx
│   │   │   ├── Research.jsx, Projects.jsx, Startups.jsx
│   │   │   ├── Notes.jsx, Timetable.jsx
│   │   ├── data/                # 11 mock data files + barrel export
│   │   │   ├── universities.js, students.js, faculty.js
│   │   │   ├── events.js, jobs.js, research.js
│   │   │   ├── projects.js, startups.js, notes.js
│   │   │   ├── exams.js, campusMap.js
│   │   │   └── index.js         # Re-exports all data + selector functions
│   │   └── utils/format.js      # Date/time, relative dates, truncate, grades
│   ├── .github/workflows/
│   │   └── deploy.yml           # GitHub Pages deployment
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── CLAUDE.md                # Development guidance
│
└── frontend-dashboard/          # Legacy admin dashboard (HTML/CSS)
    ├── admin-events.html
    └── assets/css/
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd mycampus
npm install
```

### Development

```bash
npm run dev
# Starts dev server on http://localhost:5173 (auto-opens browser)
```

### Production Build

```bash
npm run build
# Outputs to dist/
```

### Preview Production Build

```bash
npm run preview
# Serves dist/ on http://localhost:4173
```

### Deploy to GitHub Pages

```bash
npm run deploy
# Builds and pushes to gh-pages branch
```

---

## 🎨 Design System

### Colors
- **Primary** — Blue scale (`primary-50` to `primary-950`)
- **Campus** — Indigo scale (`campus-50` to `campus-950`)
- **Semantic** — Success, Warning, Danger, Info variants

### Typography
- **Sans** — Inter
- **Display** — Plus Jakarta Sans

### Animations
- `fade-in`, `slide-up`, `slide-down`, `scale-in`, `pulse-soft`

### Shadows
- `soft`, `card`, `card-hover`

### Utility Classes (in `src/index.css`)
- `.card`, `.card-interactive`
- `.btn-primary`, `.btn-secondary`
- `.section-title`
- `.animate-slide-up`
- `.input`
- `.badge-*` variants

---

## 📦 Mock Data Scale

| Entity | Count | Details |
|--------|-------|---------|
| Universities | 6 | CVRP, KIIT, IIT BBS, SOA, VIT, NIST |
| Students | 10 | Across universities with skills/interests/achievements |
| Faculty | 6 | With departments/research interests |
| Events | 8 | Various types and visibility levels |
| Jobs | 8 | Multiple roles, modes, universities |
| Research | 6 | Various statuses and universities |
| Projects | 6 | Different stages and "looking for" tags |
| Startups | 5 | Sectors, stages, open roles |
| Notes | 8 | Branches, subjects, downloadable |
| Campus Buildings | 14 | SVG paths with landmarks |
| Exams/Results | — | CSE branch schedule |

---

## 🧭 Navigation

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/map` | Campus Map |
| `/students` | Students Directory |
| `/faculty` | Faculty Directory |
| `/events` | Events |
| `/jobs` | Jobs Board |
| `/research` | Research Opportunities |
| `/projects` | Projects Showcase |
| `/startups` | Startups |
| `/notes` | Notes Repository |
| `/timetable` | Timetable (Exams + Results) |
| `/profile` | *Coming Soon* |
| `/notifications` | *Coming Soon* |
| `/settings` | *Coming Soon* |

---

## 🔧 Adding New Pages

1. Create `src/pages/YourPage.jsx`
2. Add route in `App.jsx` inside `<Layout>`
3. Add nav entry in `Sidebar.jsx` `navigation` array
4. Import data selectors from `@/data` (aliased via barrel)
5. Follow existing filter/search patterns (see `Students.jsx` or `Events.jsx`)

---

## 📝 Key Files to Reference

| File | Purpose |
|------|---------|
| `src/App.jsx` | Routing overview |
| `src/components/layout/Layout.jsx` | Layout composition |
| `src/components/layout/Sidebar.jsx` | Navigation structure |
| `src/components/layout/Header.jsx` | Search, notifications, user menu |
| `src/components/ui/index.js` | Barrel export for all 9 UI components |
| `src/data/index.js` | All available data + selector functions |
| `src/utils/format.js` | Formatting helpers |
| `tailwind.config.js` | Design tokens |

---

## ✅ Current Status (Aug 2026)

- ✅ Dev server runs on port 5173 with all modules transforming successfully
- ✅ Production build passes (`npm run build` - no errors)
- ✅ Preview server works - production build serves correctly
- ✅ UI barrel export (`src/components/ui/index.js`) resolves all import errors
- ✅ `DropdownLabel` exported from `Dropdown.jsx` and re-exported in barrel
- ✅ Duplicate `className` attribute fixed in `CampusMap.jsx`
- ✅ `ToastProvider` wrapped around App in `main.jsx` - fixes runtime crashes
- ✅ Badge `pink` variant added for Dashboard cross-university highlights
- ✅ All 11 pages + 3 layout components load without import/runtime errors
- ✅ Ready for demonstration

---

## 📄 License

This is a prototype project for C. V. Raman Polytechnic. All rights reserved.

---

## 🤝 Contributing

This is a prototype. For feature requests or bug reports, please open an issue.