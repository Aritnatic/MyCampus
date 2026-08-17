# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MyCampus** — Verified Campus + Cross-University Collaboration Platform for C. V. Raman Polytechnic. A React 18 + Vite prototype that centralizes campus information (notices, events, results, exams, notes, faculty) while enabling cross-university discovery of peers, mentors, projects, research, startups, and career opportunities.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 5173 (auto-opens browser)

# Build
npm run build        # Production build to dist/
npm run preview      # Preview production build locally

# Install
npm install          # Install dependencies (142 packages)
```

No linting, type checking, or test commands configured — this is a prototype.

## Architecture

### Tech Stack
- **React 18** with Vite 5 for fast HMR
- **Tailwind CSS 3** with custom design system (primary/campus color palettes, custom animations, shadows)
- **Framer Motion** for page transitions and micro-interactions
- **Lucide React** for consistent iconography
- **React Router v6** for SPA routing
- **Centralized mock data pattern** — 11 data files with barrel exports in `src/data/index.js` and selector functions

### Source Structure
```
src/
├── main.jsx                    # Entry point with BrowserRouter
├── App.jsx                     # Route definitions (11 pages + placeholders)
├── index.css                   # Tailwind layers + global utilities (.card, .btn-*, .section-title)
├── components/
│   ├── layout/
│   │   ├── Layout.jsx          # Orchestrates Sidebar + Header + Outlet
│   │   ├── Sidebar.jsx         # Collapsible (72px/260px) nav + user profile
│   │   └── Header.jsx          # Search, notifications, user menu
│   └── ui/                     # 9 reusable components (barrel: components/ui/index.js)
│       ├── Button, Card, Badge, Avatar, Input, Tabs, Dropdown, Modal, Toast
├── pages/                      # 11 page components
│   ├── Dashboard.jsx           # Stats, quick actions, cross-uni highlights
│   ├── CampusMap.jsx           # Interactive SVG map with pan/zoom, building selection
│   ├── Students.jsx            # Search + filters (branch, uni, interest, skill)
│   ├── Faculty.jsx             # Search + filters (dept, interest, uni)
│   ├── Events.jsx              # Type/visibility filters
│   ├── Jobs.jsx                # Role/mode/uni filters, save
│   ├── Research.jsx            # Status/uni filters
│   ├── Projects.jsx            # Stage/uni/looking-for filters
│   ├── Startups.jsx            # Sector/stage filters, open roles
│   ├── Notes.jsx               # Branch/subject filters, download
│   └── Timetable.jsx           # Exam schedule + results tabs
├── data/                       # 11 mock data files + barrel export
│   ├── universities, students, faculty, events, jobs
│   ├── research, projects, startups, notes, exams, campusMap
│   └── index.js                # Re-exports all data + selectors
└── utils/format.js             # Date/time, relative dates, truncate, grades, etc.
```

### Data Pattern
Each `src/data/*.js` exports:
- A const array (e.g., `students`, `events`)
- Selector functions (e.g., `getStudentsByUniversity()`, `getUpcomingEvents()`)

Pages import from `@/data` (aliased via barrel) and filter client-side.

### Routing
`App.jsx` wraps all routes in `<Layout />` (Sidebar + Header + Outlet). Active routes:
- `/` → Dashboard
- `/map` → CampusMap
- `/students`, `/faculty`, `/events`, `/jobs`, `/research`, `/projects`, `/startups`, `/notes`, `/timetable`
- Placeholders: `/profile`, `/notifications`, `/settings`

### Layout Behavior
- **Sidebar**: Fixed left, animates width (72px collapsed / 260px expanded). Mobile: off-canvas drawer.
- **Header**: Fixed top, 64px height. Search, notification bell, user avatar dropdown.
- **Main**: `lg:ml-[260px]` (expanded) or `lg:ml-[72px]` (collapsed). Smooth transitions.

### UI Component Conventions
All components in `components/ui/` use:
- `forwardRef` for DOM access
- Variant/size props via config objects (not className strings)
- Tailwind utility classes, no CSS-in-JS
- Compound components where appropriate (Card + CardHeader/Title/Content/Footer)

Key components:
- **Card**: `hover`, `interactive`, `padding` props
- **Badge**: `variant` (primary/success/warning/danger/gray/info/purple/orange), `size`, `dot`
- **Dropdown**: Click-outside close, `DropdownMenu`/`Item`/`Divider`/`Label` sub-components
- **Tabs**: Context-based (`TabsProvider`, `TabsList`, `TabsTrigger`, `TabsContent`)
- **Toast**: Portal to `document.body`, `ToastProvider` + `useToast()` hook

### Styling System (tailwind.config.js)
- **Colors**: `primary-50..950` (blue), `campus-50..950` (indigo)
- **Fonts**: `sans` = Inter, `display` = Plus Jakarta Sans
- **Animations**: `fade-in`, `slide-up`, `slide-down`, `scale-in`, `pulse-soft`
- **Shadows**: `soft`, `card`, `card-hover`
- **Utility classes** in `index.css`: `.card`, `.card-interactive`, `.btn-primary`, `.btn-secondary`, `.section-title`, `.animate-slide-up`, `.input`, `.badge-*`

### Mock Data Scale (prototype-realistic)
- 6 universities (CVRP, KIIT, IIT BBS, SOA, VIT, NIST)
- 10 students across universities with skills/interests/achievements
- 6 faculty with departments/research interests
- 8 events, 8 jobs, 6 research ops, 6 projects, 5 startups, 8 notes
- 14 campus buildings with SVG paths/landmarks
- Exams + results for CSE branch

### Adding New Pages
1. Create `src/pages/YourPage.jsx`
2. Add route in `App.jsx` inside `<Layout>`
3. Add nav entry in `Sidebar.jsx` `navigation` array
4. Import data selectors from `../data`
5. Follow existing filter/search patterns (see `Students.jsx` or `Events.jsx`)

### Key Files to Read First
- `src/App.jsx` — routing overview
- `src/components/layout/Layout.jsx` — layout composition
- `src/components/layout/Sidebar.jsx` — navigation structure
- `src/components/layout/Header.jsx` — search, notifications, user menu (imports DropdownLabel from UI barrel)
- `src/components/ui/index.js` — barrel export for all 9 UI components
- `src/data/index.js` — all available data + selectors
- `src/utils/format.js` — formatting helpers
- `tailwind.config.js` — design tokens

### Current Status (Aug 18, 2026)
- ✅ Dev server running on port 5175 with all modules transforming successfully
- ✅ **Production build passes** (`npm run build` - no errors)
- ✅ **Preview server works** (port 4174) - production build serves correctly
- ✅ UI barrel export (`src/components/ui/index.js`) created - resolves all import errors
- ✅ `DropdownLabel` exported from `Dropdown.jsx` and re-exported in barrel - fixes build error
- ✅ `DropdownLabel` import fixed in `Header.jsx` (line 5)
- ✅ Duplicate `className` attribute fixed in `CampusMap.jsx` (line 207)
- ✅ `ToastProvider` wrapped around App in `main.jsx` - fixes Students page runtime crash (was white screen)
- ✅ Badge `pink` variant added for Dashboard cross-university highlights
- ✅ All 11 pages + 3 layout components load without import/runtime errors
- ✅ Ready for professor demo - Dashboard page accessible at http://localhost:5175/