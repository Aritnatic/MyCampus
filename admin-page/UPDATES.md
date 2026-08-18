# MyCampus Admin Dashboard — Updates Log

## [2026-08-18] — Initial Admin Dashboard v1.0.0
**Author:** Imaad Mercer (imaadmercer)

### Added
- **Project scaffolding**: Vite 5 + React 18 + Tailwind CSS 3 setup on port 5174
- **Admin design system** (`src/index.css`): Minimal white-background theme with admin-specific utility classes (`.admin-btn`, `.admin-input`, `.admin-badge`, `.admin-table`, `.admin-card`, `.admin-stat`, `.admin-section`, `.admin-page`)
- **Mock data layer** (`src/data/`):
  - `universities.js` — 4 universities (CVRP, JNTUH, IITD, BITS)
  - `admin.js` — 3 admin users, roles/permissions, university-scoped selectors, dashboard stats
  - `notices.js` — 6 notices with draft/published/archived status
  - `events.js` — 8 events with approval workflow (pending/approved/rejected)
  - `exams.js` — 5 exams + 4 results with scheduling
  - `placements.js` — 8 job postings + 8 companies
  - `index.js` — Barrel exports for all admin data
- **Admin UI primitives** (`src/components/admin/`):
  - `AdminTable.jsx` — Clean table with sorting, hover, striped rows, empty state
  - `AdminTabs.jsx` — Minimal underline/bordered tabs
  - `AdminBadge.jsx` — Status badges (pending/approved/published/rejected/draft/active/inactive)
  - `AdminForm.jsx` — Form fields, modal layout, button variants
- **Layout components** (`src/components/layout/`):
  - `AdminLayout.jsx` — Collapsible sidebar (72px/260px) with mobile drawer
  - `AdminSidebar.jsx` — Navigation with role-based items
  - `AdminHeader.jsx` — Search, notifications, user menu with profile/settings/security/signout
- **Admin pages** (`src/pages/admin/`):
  - `AdminDashboard.jsx` — 6 stat cards, quick actions, recent activity table, pending items alert
  - `NoticesEventsPage.jsx` — Dual tabs: Notices CRUD + Events approval table
  - `ExamsResultsPage.jsx` — Dual tabs: Exam schedule management + Results upload/publish
  - `PlacementsPage.jsx` — Jobs table with status filters, company management
  - `SettingsPage.jsx` — Admin users table, roles/permissions, verification rules, security alerts
- **Routing** (`src/App.jsx`): `/admin/*` routes with nested layout
- **Utilities** (`src/utils/format.js`): Date, number, relative time, truncate helpers

### Fixed
- **Missing ChevronLeft/ChevronRight icons** in AdminHeader.jsx (added to lucide-react import)
- **Nested BrowserRouter error** — Removed BrowserRouter from App.jsx (main.jsx already provides it)
- **Tailwind missing danger-800 color** — Added full 50-900 scales for danger, success, warning in tailwind.config.js
- **Dev server cache issues** — Cleared `.vite` cache and restarted
- **Excessive tab padding** — Removed `paddingRight: '1.5rem'` from AdminTabs.jsx tab buttons

### Design Decisions
- White background only — no dark mode for admin section
- Flat buttons, no shadows, no rounded-2xl "edge box" cards
- Clean tables with subtle borders instead of card-based layouts
- Lucide React outline icons only (16-18px max)
- Tight spacing: `p-4` page padding, `gap-4` grids, `px-4 py-3` table cells
- University-scoped data filtering on all selectors

---

## [Template for future updates]

## [YYYY-MM-DD] — Version X.Y.Z
**Author:** [Name] ([GitHub username])

### Added
- Feature description

### Changed
- Modification description

### Fixed
- Bug fix description

### Removed
- Removed feature description

### Design Decisions
- Rationale for design/architecture choices