# MyCampus Admin Dashboard

A minimal, white-background admin dashboard for college/university administrators. Built with React 18, Vite 5, Tailwind CSS 3, Framer Motion, and Lucide React.

## Features

- **University-scoped access**: Admins only see data for their own university
- **5 core modules**:
  1. **Dashboard** — Overview stats, quick actions, recent activity
  2. **Notices & Events** — Publish notices, approve/moderate events
  3. **Exams & Results** — Schedule exams, upload/publish results
  4. **Placements/Careers** — Manage job postings, track companies & applications
  4. **Settings/Security** — Admin accounts, roles/permissions, verification rules

## Tech Stack

- React 18 + Vite 5
- Tailwind CSS 3 (minimal design system)
- Framer Motion (animations)
- Lucide React (icons)
- React Router v6

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (runs on port 5174)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
admin-page/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific UI primitives
│   │   │   ├── AdminTable.jsx
│   │   │   ├── AdminTabs.jsx
│   │   │   ├── AdminBadge.jsx
│   │   │   └── AdminForm.jsx
│   │   └── layout/         # Layout components
│   │       ├── AdminLayout.jsx
│   │       ├── AdminSidebar.jsx
│   │       └── AdminHeader.jsx
│   ├── pages/
│   │   └── admin/          # Admin pages
│   │       ├── AdminDashboard.jsx
│   │       ├── NoticesEventsPage.jsx
│   │       ├── ExamsResultsPage.jsx
│   │       ├── PlacementsPage.jsx
│   │       └── SettingsPage.jsx
│   ├── data/               # Mock data & selectors
│   │   ├── universities.js
│   │   ├── admin.js
│   │   ├── notices.js
│   │   ├── events.js
│   │   ├── exams.js
│   │   ├── placements.js
│   │   └── index.js        # Barrel exports
│   ├── utils/
│   │   └── format.js       # Format utilities
│   ├── App.jsx             # Routes
│   ├── main.jsx            # Entry point
│   └── index.css           # Admin design system
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Design System

- **Background**: Pure white (`#ffffff`)
- **Borders**: Light gray (`admin-200` / `#e2e8f0`)
- **Typography**: Inter (body), Plus Jakarta Sans (display)
- **Components**: Flat buttons, clean tables, no shadows, no rounded cards
- **Colors**: Minimal palette — primary (blue), success (green), warning (amber), danger (red)

## University Scoping

All admin data is filtered by `universityId` from the current admin user:

```js
import { getNoticesByUniversity, currentAdmin } from '@/data'

const notices = getNoticesByUniversity(currentAdmin.university)
```

## Mock Admin User

For development, the mock admin is in `src/data/admin.js`:

```js
export const currentAdmin = {
  id: 'admin-001',
  name: 'Dr. Admin User',
  email: 'admin@cvrp.edu.in',
  university: 'cvrp',
  role: 'superadmin',
  permissions: ['notices', 'events', 'exams', 'results', 'placements', 'settings'],
  isAdmin: true,
}
```

## Available Universities

- `cvrp` — CVR College of Engineering
- `jntuh` — JNTU Hyderabad
- `iitd` — IIT Delhi
- `bits` — BITS Pilani

## License

Part of MyCampus project.