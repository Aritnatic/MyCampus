# Updates Log

> Change log for MyCampus project — tracks updates, features, fixes, and contributors.

---

## Format

Each entry follows:
```
## [YYYY-MM-DD] Version/Tag
**Author:** @username
**Type:** feat | fix | chore | docs | refactor | style | test

### Changes
- Description of changes

### Files Modified
- `path/to/file.ext`
```

---

## [2026-08-18] Initial Documentation & Fixes
**Author:** @imaadmercer
**Type:** docs, fix

### Changes
- Added comprehensive `README.md` with project overview, tech stack, structure, setup guide, design system, mock data scale, navigation, and contribution guide
- Created `UPDATES.md` for tracking project changes and contributors
- Fixed missing UI component exports:
  - Added `Textarea` component to `Input.jsx`
  - Added `DropdownTrigger` component to `Dropdown.jsx`
- Fixed permission issues from `sudo npm install`

### Files Modified
- `README.md` (new)
- `UPDATES.md` (new)
- `mycampus/src/components/ui/Input.jsx`
- `mycampus/src/components/ui/Dropdown.jsx`
- `mycampus/src/components/ui/index.js` (verified exports)

---

## [2026-08-18] Production Build Fixes
**Author:** @imaadmercer
**Type:** fix

### Changes
- Fixed `DropdownLabel` export from `Dropdown.jsx` and re-export in barrel
- Fixed duplicate `className` attribute in `CampusMap.jsx:207`
- Wrapped `ToastProvider` around App in `main.jsx` (fixed Students page white screen)
- Added Badge `pink` variant for Dashboard cross-university highlights
- Created UI barrel export (`src/components/ui/index.js`) resolving import errors

### Files Modified
- `mycampus/src/components/ui/Dropdown.jsx`
- `mycampus/src/components/ui/index.js`
- `mycampus/src/pages/CampusMap.jsx`
- `mycampus/src/main.jsx`
- `mycampus/src/components/ui/Badge.jsx`

---

## [2026-08-18] Initial Project Setup
**Author:** @Aritnatic
**Type:** feat, chore

### Changes
- Initial React 18 + Vite 5 project setup
- Tailwind CSS 3 with custom design system (primary/campus palettes, animations, shadows)
- Framer Motion for transitions
- Lucide React for icons
- React Router v6 for SPA routing
- Centralized mock data pattern (11 data files)
- 11 page components (Dashboard, CampusMap, Students, Faculty, Events, Jobs, Research, Projects, Startups, Notes, Timetable)
- 3 layout components (Layout, Sidebar, Header)
- 9 reusable UI components (Button, Card, Badge, Avatar, Input, Tabs, Dropdown, Modal, Toast)
- GitHub Actions workflow for deployment

### Files Modified
- All initial project files

---