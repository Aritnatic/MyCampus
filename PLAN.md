# MyCampus — Plan to make it usable

*Drafted 2026-10-08. Edit freely; I work from this file.*

## What "usable" means

A pilot: **~50 real CVRP students and 2–3 real admins use it for a week** without us hand-holding.
That requires every one of these to be true:

1. A student can **sign up with a college email, verify it, and sign in** on their own phone.
2. They get **notified** (notice, result, exam, alert) without opening the app.
3. They can **find and contact** peers, mentors, projects, startups and research — and the other side can answer.
4. An admin can **run the campus** from the admin panel — no mock data left.
5. It runs on a **real server** with backups, a real mail provider, and push notifications.

## Where we are (2026-10-08)

| Area | State |
|---|---|
| Backend | ~90% of the project description. 58 tests. Not deployed. |
| Phone app | Core read-only screens (home, exams, notes, discover, profile). Can't sign up, edit profile, connect, RSVP, upload, search, see the map, career, alerts or notifications. |
| Admin panel | Notices/events/exams/results/jobs are real. Dashboard, students, users, settings, alerts, audit are not. |
| Deployment | None. |

## Phases

### Phase 0 — Backend polish *(small, do first)*
Problems found when viewing real output:
- [x] Match reasons read badly ("Requires machine, learning"). Show the original phrases ("Needs Machine Learning — you list it").
- [x] Career skill check is too literal (PostgreSQL ≠ SQL). Add skill aliases.
- [x] Landmark coordinates in the map seed overlap buildings. Fix the seed data.
- [ ] *(moved to Phase 4)* a post-deploy smoke-check script.

**Done when:** tests cover the fixes; `/matches` reasons are readable. ✅ *(2026-10-08, 62 tests passing)*

### Phase 1 — Phone app foundation *(makes everything after it faster)*
- [x] **UI kit**: Button, Field (with per-field errors), TagInput, Card, Chip, Skeleton loaders, EmptyState, Toast, Avatar. *(Bottom sheet still to do — add when a feature needs it.)*
- [x] **Navigation**: 5 tabs — Home · Discover · Campus · Inbox (unread badge) · Me. Campus lists exams/results and notes now; map and career are added in Phase 2.
- [x] **Auth flow**: sign up → verify code (resend cooldown) → sign in → forgot/reset password. Tested end to end against the live API.
- [x] **Profile**: edit branch/year/semester, bio, skills, interests, "looking for", mentor toggle; "finish your profile" nudges on Home and Me.
- [~] Accessibility pass: labels and roles added on all new screens; **still to verify on a real device**: screen reader order, dynamic text sizes, tap targets. Pull-to-refresh is on Home and Inbox only; other lists to follow.

**Done when:** a brand-new student can go from install to a filled-in profile with no help. ✅ *(2026-10-08 — verified in a phone-size browser; not yet on a physical phone.)*

### Phase 2 — Phone features, in the order students will feel them
1. [x] **Inbox + push**: notifications with unread badge; Requests tab (connection, mentor and join requests with accept/decline); live updates over the event stream. ⚠️ *Push to a locked phone is written but **untested**: it needs an EAS project id and, on Android, a development build (Expo Go can't receive remote push).*
2. [x] **Safety**: live alert banner pinned above every screen, "I'm safe / I need help", alerts history; admins see the roll call. Verified live: alert raised by an admin appeared without a reload, and resolving it removed the banner.
3. [x] **Home feed**: upcoming exams → notices → events → "For you" matches, plus search; pull to refresh.
4. [x] **Discover that works**: ranked natural-language search with kind intent, Connect / Ask to mentor / Ask to join, mentors-only filter, create a project. *(Creating a startup is API-only for now.)*
5. [x] **Events**: RSVP with capacity and waitlist (auto-promotion), My events.
6. [~] **Notes**: list, download, rate, delete verified. **Sharing form (file picker + upload) bundles for iOS/Android but could not be exercised here** — the OS file picker can't be driven from this environment; the upload API is covered by backend tests.
7. [x] **Campus map**: SVG map, tap a building, facility search, walking route from any place.
8. [x] **Career**: paths, private skill gap, roadmap, matching jobs.

**Done when:** every endpoint in `backend/README.md` that a student would use has a screen. ✅ *(2026-10-08; remaining gaps: startup creation, push on a real device, the notes upload form on a real device.)*

### Phase 3 — Admin panel completion
- [x] **Safety alerts console**: raise (with a confirm step), live roll call (safe / need help by name / not responded), resolve, history; a live-alert strip on the dashboard.
- [x] **Real student roster** (search, branch/semester filters, pagination, suspend/reactivate, CSV export), **admin users** (create, edit permissions, suspend), **audit log**, **verification domains**.
- [x] **Faculty & research** page (new): faculty directory CRUD, research CRUD, and the student-interest inbox with accept/decline.
- [x] **Event registrations** roster and a **broadcast announcement** (all students or by branch/semester).
- [x] Sidebar and pages are gated by permission; the server enforces it independently (tested).
- [~] Remove remaining mock data: the Settings page's fake security/audit rows and the generated roster are gone. *Still local demo data:* the Placements company list. *Dead files nobody imports (safe to delete, left because they're your untracked files):* `admin-page/src/data/students.js`, `data/users.js`, `utils/token.js`.
- [~] UX pass: every new page has loading, empty, error and confirm states, with errors beside their fields. The older Notices, Exams and Placements pages were not audited beyond removing a dead "Filters" button. Dashboard numbers are still computed in the browser, not from `/admin/stats`.

**Done when:** an admin never needs the database or a terminal. ✅ *(2026-10-08)* — for everything except bulk-loading a real student roster (Phase 4).

### Phase 4 — Pilot readiness
- [ ] Hosting + domain + HTTPS · Postgres (or SQLite on a persistent disk with backups) · secrets management
- [ ] Real mail provider (sign-up codes, resets) · Expo push credentials · EAS builds (TestFlight / Android internal)
- [ ] Import real data: CVRP students (CSV), faculty, timetable, map
- [ ] Privacy policy + terms, data retention, a way to delete an account
- [~] Monitoring (errors, uptime): logs + `/health` are ready to point an uptime monitor at; no error-tracking service wired. Daily backups with a tested restore: tested locally, rehearse on the host.
- [x] **Feedback form** *(2026-10-12)*: Me → Send feedback in the app; admins triage it (New / Seen / Done) on a new Feedback page; included in "Download my data"; 10 per person per day.
- [x] **Structured request logging** *(2026-10-12)*: one JSON line per request (no query strings, bodies or tokens), `X-Request-Id`, unhandled errors logged with stacks.
- [x] **Load test** *(2026-10-12)*: `npm run loadtest` — 500 students, 500 live streams. Found and fixed a hot spot (`/matches` built every student's card per request: p95 1.9 s → 64 ms) and a pilot risk (60 sign-ins per 15 min per IP would lock out a whole campus on shared Wi-Fi: now `AUTH_IP_LIMIT`, default 600). Result: ~280 req/s, 0 errors, alert reaches all 500 phones in ~75 ms; 3× the traffic also clean. Re-run on the real host.
- [x] **Roster import confirmed in the admin UI** *(2026-10-12)*: preview → import → list refreshed, new students shown as "Email not confirmed".
- [~] **Deployment files**: `Dockerfile` (API + admin panel on one port), `ADMIN_DIR` serving (tested), `npm run smoke` post-deploy check, `backend/DEPLOY.md` and `PILOT.md` (checklist + what-to-do-when-it-breaks), backup now also runs 1 min after start. **The Docker build itself is untested (no Docker here)**; its steps were replayed by hand (production-only install, same-origin admin build, production boot, bootstrap, smoke check).
- [ ] Still needs a person: hosting choice, mail account + verified domain, the college's legal review (smoke check fails until the `[BRACKETED]` placeholders are filled), restore rehearsal on the real host, real-phone test of push and the notes upload form.

**Done when:** the pilot starts and nobody on it needs a developer in the room.

## Decisions I need from you (none block Phase 0–1)

| # | Decision | My default if you don't choose |
|---|---|---|
| 1 | **Where to host** (Railway / Fly / a college server / a VPS) | Railway or Fly — cheapest to start, easy backups |
| 2 | **Mail provider** (Resend / SES / college SMTP) | Resend (free tier covers a pilot) |
| 3 | **Apple/Google developer accounts** for real installs | Android first via EAS; iOS needs a paid Apple account |
| 4 | **Who are the pilot admins** and do they have `cvrp.edu.in` emails? | Use the 3 seeded roles as templates |
| 5 | **Real student data**: do we get a roster from the college, or do students self-register? | Self-register with college email + code |
| 6 | **Semantic search**: stay with keyword ranking, or add an embeddings provider? | Stay for the pilot; revisit with real queries |

## Known risks
- No mail provider ⇒ no sign-ups for anyone outside this machine.
- Single-process realtime + SQLite is fine for one server, not for scaling out.
- Seed data is 2024-dated and CVRP-only; the product will feel empty until real content exists.
- Push and map need real-device testing; I can only verify in a browser here.
