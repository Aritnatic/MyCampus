# MyCampus Project Status & Architecture

**Last Updated:** 2026-08-18  
**Branch:** main (up to date with origin)

---

## 🎯 Project Overview

**MyCampus** is a Verified Campus + Cross-University Collaboration Platform prototype for **C. V. Raman Polytechnic (CVRP)**. Built with React 18 + Vite 5.

**Two separate applications exist:**

| App | Location | Purpose | Port |
|-----|----------|---------|------|
| **Student App** | `/mycampus/` | Student-facing platform (Dashboard, Students, Faculty, Events, Jobs, Research, Projects, Startups, Notes, Timetable, Campus Map + Admin routes) | 5173 |
| **Admin App** | `/admin-page/` | Standalone admin dashboard (Notices, Events, Exams, Results, Placements, Settings) | 5174 |

---

## 📁 Current File Structure

```
MyCampus/
├── mycampus/                          # MAIN STUDENT APP (active)
│   ├── src/
│   │   ├── App.jsx                    # Routes (11 student pages + 4 admin pages)
│   │   ├── main.jsx                   # Entry: BrowserRouter + ThemeProvider + ToastProvider
│   │   ├── components/
│   │   │   ├── layout/                # Layout, Sidebar, Header
│   │   │   ├── ui/                    # 9 reusable components (Button, Card, Badge, Avatar, Input, Tabs, Dropdown, Modal, Toast)
│   │   │   └── admin/                 # 4 admin UI primitives (AdminTable, AdminTabs, AdminBadge, AdminForm)
│   │   ├── pages/
│   │   │   ├── *.jsx                  # 11 student pages
│   │   │   └── admin/                 # 5 admin pages (ALL FIXED ✅)
│   │   ├── data/                      # 12 mock data files + barrel
│   │   ├── context/ThemeContext.jsx   # Dark mode
│   │   └── utils/format.js
│   ├── package.json
│   └── CLAUDE.md                      # Dev guidance
│
├── admin-page/                        # STANDALONE ADMIN APP
│   ├── src/
│   │   ├── App.jsx                    # Admin routes only
│   │   ├── components/layout/         # AdminLayout, AdminSidebar, AdminHeader
│   │   ├── components/admin/          # Same admin UI primitives
│   │   ├── pages/admin/               # 5 complete admin pages
│   │   ├── data/                      # Admin-specific data (universities, admin, notices, events, exams, placements)
│   │   └── utils/format.js
│   └── package.json
│
├── frontend-dashboard/                # LEGACY (HTML/CSS only)
├── README.md                          # Project overview
├── UPDATES.md                         # Change log
├── Chnagestomake.md                   # TODO notes
└── PROJECT_STATUS.md                  # THIS FILE
```

---

## ✅ BUILD BLOCKERS - ALL FIXED (Aug 18, 2026)

### 1. ✅ Missing Admin Pages in `mycampus/src/pages/admin/`
**FIXED** - Created both missing pages:
- `PlacementsPage.jsx` - Uses mycampus data (`placementJobs`, `placementCompanies`, `placementStats`)
- `SettingsPage.jsx` - Uses mycampus data (`currentUser`, `getAdminUser`, `getAdminUniversity`)

### 2. ✅ Duplicate Import in ExamsResultsPage.jsx
**FIXED** - Removed duplicate Search imports (lines 331-335)

### 3. ✅ Admin UI Components Updated
**FIXED** - Updated all admin components to use enhanced versions from admin-page:
- `AdminTable.jsx` - Added `createColumn` helper, sorting, striped/hoverable rows
- `AdminTabs.jsx` - Added `TabPanel` component, proper `id` prop on tabs
- `AdminBadge.jsx` - Added status variants (pending/approved/published/rejected/draft/active/inactive/closed/on-hold)
- `AdminForm.jsx` - Added `FormRow`, `FormSection`, `AdminConfirmDialog`, all form fields

### 4. ✅ Data Conflicts Resolved
**FIXED** - Created `mycampus/src/data/placements.js` with renamed exports:
- `placementJobs` (not `jobs`) - avoids conflict with `jobs.js`
- `placementCompanies` (not `companies`) - avoids conflict
- `placementStats` - admin-specific stats
- Selector functions: `getPlacementJobsByUniversity`, `getPlacementCompaniesByUniversity`, `getVerifiedPlacementJobs`, `getOpenPlacementJobs`, `getActivePlacementCompanies`

---

## 🟢 WHAT'S WORKING (Aug 18, 2026)

| Feature | Status |
|---------|--------|
| Dev server starts | ✅ |
| **Production build** | ✅ **PASSING** (mycampus & admin-page) |
| All 11 student pages load | ✅ |
| All 5 admin pages load | ✅ |
| Dark mode toggle | ✅ |
| Toast notifications | ✅ |
| Sidebar collapse/expand | ✅ |
| Campus Map SVG pan/zoom | ✅ |
| Filter/search on directory pages | ✅ |
| Admin Dashboard page | ✅ |
| Notices & Events admin page | ✅ |
| Exams & Results admin page | ✅ (tabs working with TabPanel) |
| Placements admin page | ✅ |
| Settings admin page | ✅ |

---

## 📦 Data Overview

### Student App (`mycampus/src/data/`)
| File | Exports | Count |
|------|---------|-------|
| `universities.js` | `universities`, `getUniversity` | 6 |
| `students.js` | `students`, `currentUser`, selectors | 10 |
| `faculty.js` | `faculty`, selectors | 6 |
| `events.js` | `events`, selectors | 8 |
| `jobs.js` | `jobs`, `companies`, selectors | 8 |
| `research.js` | `research`, selectors | 6 |
| `projects.js` | `projects`, selectors | 6 |
| `startups.js` | `startups`, selectors | 5 |
| `notes.js` | `notes`, selectors | 8 |
| `exams.js` | `exams`, `results`, selectors | — |
| `campusMap.js` | `buildings`, `landmarks` | 14 |
| `notices.js` | `notices`, selectors | — |
| `admin.js` | `adminUser`, `getAdminStats`, selectors | — |
| `placements.js` | `placementJobs`, `placementCompanies`, `placementStats`, selectors | 8 |
| `index.js` | Barrel export of all above | — |

### Admin App (`admin-page/src/data/`)
| File | Exports |
|------|---------|
| `universities.js` | 4 universities (different IDs!) |
| `admin.js` | `currentAdmin`, `adminUsers`, `roles`, `permissions` |
| `notices.js` | `notices`, selectors |
| `events.js` | `events`, selectors |
| `exams.js` | `exams`, `results`, selectors |
| `placements.js` | `jobs`, `companies`, `placementStats`, selectors |

---

## 🚀 NEXT PRIORITIES (Per Chnagestomake.md)

### Phase 1: Login System (High Priority)
> "Login - There will be three types of login Individual and Login by your University (if exist) AND Login as admin."
> "People who log in with uni don't get access to other uni students or prof and faculties."

**Needed:**
- Auth context/provider with 3 login modes: Individual / University / Admin
- Login page with mode selection
- University-scoped data access (filter by university ID)
- Protected routes (admin routes require `isAdmin` or admin role)
- JWT/session management

### Phase 2: Mobile/Responsive Design
> "Improve design for phone version"
- Sidebar: Off-canvas drawer works but needs testing on real mobile
- Tables: Need horizontal scroll or card layout on mobile
- Modals: Need full-screen on mobile
- Touch targets: Ensure 44px minimum

### Phase 3: Broken Features & Backends
> "fix the broken features and backends"
- Search in Header: Currently mock only, needs real search across all data
- Notifications dropdown: Mock data, no real actions
- Save/bookmark buttons: No persistence (localStorage or backend)
- Campus Map: Building selection needs integration with building info
- Filter combinations: Need testing on all directory pages

### Phase 4: Admin-page Enhancements
- University management (add/edit universities)
- Role-based access control (superadmin vs placement officer vs exam controller)
- Audit logging for admin actions
- Export functionality (CSV/PDF for reports)

---

## 📝 Notes for Next Session

**Run dev servers:**
```bash
# Student app (mycampus)
cd mycampus && npm run dev        # Port 5173

# Admin app (standalone)
cd admin-page && npm run dev      # Port 5174
```

**Build check:**
```bash
cd mycampus && npm run build      # ✅ PASSING
cd admin-page && npm run build    # ✅ PASSING
```

**Key files for next work:**
- `mycampus/src/context/AuthContext.jsx` (create - new)
- `mycampus/src/pages/LoginPage.jsx` (create - new)
- `mycampus/src/App.jsx` (add login route, protect admin routes)
- `admin-page/src/components/layout/AdminHeader.jsx` (add logout handler)
- `Chnagestomake.md` (reference for feature priorities)