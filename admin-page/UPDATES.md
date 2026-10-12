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

## [2026-08-30] — App Rail (Step 1)
**Author:** Imaad Mercer (imaadmercer)

### Added
- **Far-left application rail** (`AdminAppRail.jsx`) — narrow 56px vertical rail on the far left of the admin layout
  - Home / Dashboard icon at top (routes to existing `/admin/dashboard`, uses `NavLink` with active state)
  - Profile icon near bottom (compact, consistent styling)
  - Active Home state uses `bg-primary-100 text-primary-700` rounded rectangle background — clearly visible selected control
  - Rail uses existing MyCampus design tokens (`admin-*`, `primary-*`); no new colors, gradients, or effects

### Changed
- **`AdminLayout.jsx`** — Added `<AdminAppRail />` as first flex child; existing sidebar and content shift right automatically
- **`AdminSidebar.jsx`** — Updated left positioning to `lg:left-14` (accounts for rail width on desktop); mobile toggle button repositioned to `lg:left-[calc(3.5rem+1rem)]` to clear the rail on mobile
- **Layout structure** is now: `[App Rail (w-14)] [Sidebar (w-64/w-18)] [Main Content]` — matches spec exactly

### Design Decisions
- Rail width fixed at `w-14` (56px / 3.5rem) — stable, compact, production-ready
- Only two destinations in Step 1: Home (top) + Profile (bottom) — notifications, apps, settings intentionally deferred
- Active state is a compact rounded rectangle (`w-10 h-10 rounded-lg`) with primary token background — intentional, not oversized
- No refactoring of sidebar, dashboard, cards, tables, headers, routes, or mock data — strict scope adherence

---

## [2026-08-30] — Navigation Shell Redesign (Single Rail + Top Bar)
**Author:** Imaad Mercer (imaadmercer)

### Added
- **Single narrow application rail** (`AdminAppRail.jsx`) — 64px (`w-16`) fixed-width rail on far left
  - 5 icon-only nav items: Dashboard, Notices & Events, Exams & Results, Placements, Settings
  - Active item uses `bg-primary-100 text-primary-700 rounded-lg` — compact, deliberate selected state
  - Profile button at bottom links to Settings (icon-only)
  - No labels, no collapse toggle, no duplicate branding
- **Full-width top bar** (`AdminHeader.jsx` enhanced) — spans entire content area
  - MyCampus logo + university name on left
  - Search in middle (visible on md+)
  - Notifications bell + user menu on right
  - Subtle gradient tint at top edge (`from-transparent via-primary-400/40 to-transparent`) — MyCampus "chrome" inspired by Slack

### Changed
- **`AdminLayout.jsx`** — Simplified to two-column shell: `[Rail (w-16)] [Content Area (flex-1)]`
  - Content area = sticky header + main content, no sidebar gap
  - Removed all sidebar state (`sidebarCollapsed`, `mobileSidebarOpen`, toggle handlers, mobile overlay)
- **`AdminHeader.jsx`** — Removed mobile menu button, sidebar collapse button; added `sticky top-0 z-30`
- **Rail width** increased from `w-14` (56px) to `w-16` (64px) for better icon centering

### Removed
- **`AdminSidebar.jsx`** — Full wide sidebar with labels, branding, collapse toggle, user profile section (deleted)
- **`AdminNavRail.jsx`** — Untracked alternate rail implementation (deleted)
- All `CustomEvent('toggle-sidebar')` and `CustomEvent('toggle-mobile-sidebar')` dispatches

### Design Decisions
- Single source of navigation truth: the rail. No duplicate nav surfaces.
- Top bar is the only place for MyCampus branding + search + user actions — clean separation of concerns.
- Gradient tint on top bar only (1px) — subtle brand accent without overwhelming the UI.
- Dashboard content (cards, metrics, quick actions, recent activity) **unchanged** — layout-only change.
- All existing design tokens (`admin-*`, `primary-*`) reused; no new colors introduced.

---

## [2026-08-30] — Navigation Shell Refinement (Slack-Style Rail + Clean Top Bar)
**Author:** Imaad Mercer (imaadmercer)

### Added
- **MyCampus "M" logo on rail** (`AdminAppRail.jsx`) — square `w-10 h-10` brand mark at very top, acts as workspace/app button
- **Subtle gradient tint on rail right edge** — `from-transparent via-primary-400/30 to-transparent` for continuous chrome feel with top bar

### Changed
- **`AdminAppRail.jsx`** — Rail now starts with "M" logo, then 5 nav icons (Dashboard, Notices & Events, Exams & Results, Placements, Settings), then Profile at bottom. Removed duplicate branding from top bar.
- **`AdminHeader.jsx`** — Top bar now contains **only global controls**: search (left/center), notifications, admin profile (right). No MyCampus branding. Height `h-14` matches rail logo section.
- **Continuous chrome** — Both rail (right edge) and top bar (top edge) share the same subtle indigo gradient tint (`primary-400/30-40`), visually joining them as one application shell.
- **Search input** — Changed to `w-full max-w-xs` for flexible centering in available space.

### Design Decisions
- Rail = navigation + brand identity (like Slack's workspace switcher at top). Top bar = global actions only (search, notifications, profile).
- Gradient tint on both surfaces creates the "one continuous chrome" effect without heavy visual weight.
- Dashboard content **completely unchanged** — cards, attention section, quick actions, recent activity all render identically.
- All tokens remain `admin-*` (slate) and `primary-*` (indigo). No new colors, no purple.

---

## [2026-09-02] — Top Bar Cleanup + Page Restyle Pass (Notices & Events)
**Author:** Imaad Mercer (imaadmercer)

### Added
- **`StudentListPage.jsx`** (`/admin/students`) — new page with total + semester-wise sections
  - 4 stat tiles (Total enrolled · Active · Avg CGPA · Branches) using the 4-color accent palette
  - Search input + branch filter dropdown
  - 8 collapsible semester sections, each containing per-section (A/B/C) student tables
  - CGPA color-coded (green ≥ 8.5, blue ≥ 7, yellow ≥ 6, orange < 6) and status pills
- **`theme.js`** — single source of truth for design tokens
  - Three-tier grayscale: canvas `#faf7f5`, surface `#ffffff`, sunken `#f5f5f5`
  - 4-color "pencil-box" accent palette: green `#00c978`, orange `#ff3e00`, yellow `#ffcd6c`, blue `#64c6ff`
  - Radius scale: 14 (container) / 10 (button) / 6 (chip)
- **`PageChrome.jsx`** — shared page-level components: `PageHeader`, `StatusPill`, `TagChip`, `PrimaryButton`, `SecondaryButton`, `TextButton`, `SectionCard`
- **`students.js`** — new data file with 1,500+ mock CVRP students across 6 branches × 8 semesters × 3 sections, with realistic CGPA distribution, status, roll numbers, and selectors

### Changed
- **`AdminHeader.jsx`** — Removed the global search box (input + ⌘K hint + dropdown results). The top bar now contains only the notifications bell and the user avatar. User menu rebuilt with Profile / Settings / Security / Sign out and a proper avatar circle in the brand orange.
- **`AdminAppRail.jsx`** — Removed the dead "Search ⌘K" shortcut button. Re-styled to a clean wordmark + email chip at the top, primary nav (Dashboard · Students · Notices · Exams · Placements) in the middle, system nav (Settings · Help · Sign out · Collapse) at the bottom. Brand accent switched from forest green to the reference's orange `#ff3e00`.
- **`AdminLayout.jsx`** — Canvas switched from neutral gray to warm cream `#faf7f5`. Removed the floating white card chrome; pages now sit directly on the cream surface with their own 14px-radius white surfaces.
- **`AdminPageLayout.jsx`** — Rewritten to use the new tokens. Pages that already wrapped in `AdminPageLayout` (Placements, Settings) automatically inherit the new chrome.
- **`AdminStatBar.jsx`** — Rewritten to match the new system: each stat card has a 1px colored band on top, 14px radius, 10px-radius icon tile, color-coded trend (green ↑, orange ↓, faint —).
- **`AdminDashboard.jsx`** — Full rewrite. The "By area" card is now a 2x2 grid of compact tiles (one per area) with a colored band, a live count, and a `pending` pill. The inbox is still the focus, sorted by count desc, with a status pill on every row. New right rail with the activity feed and a "This week" mini-stats card.
- **`NoticesEventsPage.jsx`** — Full rewrite. New page header (title + counts + Filters + New Notice buttons), redesigned tab row with active underline in orange, new "Needs attention" callout card, new `FilterBar` with search + status + category selects + clear button + result count, new `NoticesTable` and `EventsTable` with status pills, tag chips, per-row action icons, empty states, and redesigned modals (new + edit) for both notices and events, plus a clean `ConfirmDialog` for deletes.

### Removed
- **`hooks/useGlobalSearch.js`** — dead since the top-bar search was removed
- **All `AdminTabs`, `AdminTable`, `AdminBadge`, `AdminModal`, `AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminButton`, `FormRow`, `AdminConfirmDialog` imports** from `NoticesEventsPage` (the new page renders its own tabs, table, and form components inline using the new tokens)
- **Search shortcut** in the rail and all related ⌘K keyboard event dispatchers

### Design Decisions
- 4-color "pencil-box" palette (green / orange / yellow / blue) replaces the single-accent pattern. The reference set uses all four together at low saturation density — never more than ~10% of pixels.
- No shadows anywhere. Elevation = a 1px colored band or a 1px hairline border, never `box-shadow`. The reference set never uses drop shadows.
- 14 / 10 / 6 radius scale: container / button / chip. A 4px step between scales gives a tactile hierarchy.
- Warm cream canvas `#faf7f5` (not pure white) is the project's temperature signal. White is reserved for working surfaces inside the app.
- "By area" is now compact tiles with a colored top band rather than horizontal bars, because the dashboard's primary job is triage (the inbox), and tiles keep the secondary stat data visually subordinate.
- The "Needs attention" callout card on Notices/Events uses the same orange accent as the Inbox items on the dashboard, so the admin's eye learns the orange = "your move" rule across pages.
- Status pill taxonomy: `draft` (yellow) · `pending` (yellow) · `approved/published/open` (green) · `rejected/urgent` (orange) · `closed/archived` (gray) · `info` (blue). Used consistently across dashboard, activity log, notifications, and tables.
- The new `StudentListPage` uses the same status-pill + tag-chip + tabular-nums patterns as the dashboard, so cross-page reading is consistent.
- The top bar is now 48px with only two controls (bell, avatar). The earlier "search box at the top" was an AI-default — the reference set never has it, the rail already provides discoverability, and the global search returned 0 useful results anyway.

### Files Modified
- `admin-page/src/theme.js` (new)
- `admin-page/src/components/admin/PageChrome.jsx` (new)
- `admin-page/src/data/students.js` (new)
- `admin-page/src/pages/admin/StudentListPage.jsx` (new)
- `admin-page/src/pages/admin/AdminDashboard.jsx` (full rewrite)
- `admin-page/src/pages/admin/NoticesEventsPage.jsx` (full rewrite)
- `admin-page/src/components/admin/AdminPageLayout.jsx` (token update, propagates to Placements and Settings)
- `admin-page/src/components/admin/AdminStatBar.jsx` (token update, propagates to Placements and Settings)
- `admin-page/src/components/layout/AdminLayout.jsx` (cream canvas)
- `admin-page/src/components/layout/AdminHeader.jsx` (search removed, user menu rebuilt)
- `admin-page/src/components/layout/AdminAppRail.jsx` (search shortcut removed, Students nav added)
- `admin-page/src/App.jsx` (StudentListPage route)
- `admin-page/src/data/admin.js` (admin user permissions extended with `students`)
- `admin-page/src/hooks/useGlobalSearch.js` (deleted)
- `admin-page/src/data/users.js` (no change — individualUsers + universityUsers still exported)

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