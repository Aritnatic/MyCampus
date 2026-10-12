# MyCampus API

Node + Express + SQLite (Node's built-in `node:sqlite`, so Node 22.13+). No external services.

```bash
cd backend
npm install
npm run dev        # http://localhost:4000, seeds the database on first run
npm run seed       # wipe and reseed demo data + accounts (dev only). Demo dates are shifted so "today" lines up with the data.
npm test           # 66 tests against an in-memory database
```

Configuration is via env vars — see `.env.example`. Production refuses to start unless `JWT_SECRET`, `CORS_ORIGIN` and a mail provider are set. Deploying: see [DEPLOY.md](DEPLOY.md); running the pilot: [PILOT.md](PILOT.md). Useful scripts: `npm test`, `npm run bootstrap`, `npm run backup`, `npm run loadtest`, `npm run smoke`.

## Demo accounts

Every seeded account uses `SEED_PASSWORD` (default `campus123`) — **dev only; never seed production**. `npm run seed` lists them.

| Mode | Example | Sees |
|------|---------|------|
| Student (verified campus) | `aritra.das@students.cvrp.edu.in` | own campus layer + cross-university content |
| Admin | `rajesh.kumar@cvrp.edu.in` (superadmin), `anita.sharma@cvrp.edu.in` (notices/events/placements), `vikram.singh@cvrp.edu.in` (exams/results) | manages their own university |
| Individual | `priya.sharma@gmail.com` | cross-university content only |

## How "verified" works

A university owns a list of **email domains** (`cvrp.edu.in`, `students.cvrp.edu.in`; editable by admins with `settings`). Signing up with an address on one of them, and confirming the 6-digit emailed code, makes you a verified student of that campus. Any other address becomes an *individual* that only ever sees cross-university content. Public mail domains (gmail.com…) can never be registered as a campus domain.

## Access rules (`src/access.js`)

- **Campus layer** — notices, exams, results, grades, faculty, campus map, safety alerts: verified members of that university only. Hidden items return 404, not 403.
- **Shared** — events, notes, projects, research: own campus, or anything marked `visibility: "cross-university"`.
- **Open** — startups, open jobs, career paths: any signed-in user.
- **People** — your own campus; other campuses only if the student is open to mentoring. No emails are ever exposed.
- **No ranking of students** — class ranks, star ratings and topper lists are stripped from every student-facing response (and tested). Results are ordered by relevance to *you*, never as a leaderboard.

## Endpoints (all under `/api`; Bearer token unless noted)

**Auth & account** — `POST /auth/login|register|verify|resend|forgot|reset` (public, rate limited), `GET|PATCH /me`, `POST /me/password`, `POST /me/logout-all`, `POST|DELETE /me/push-token`

**Campus content** — `GET /content/{notices,events,exams,results,grades,notes,projects,startups,research,jobs,faculty}[/:id]` (students get *derived views* of admin records: exam series → per-subject timetable, only approved events and open jobs)

**Discovery** — `GET /discover/:kind?scope=campus|all&q=&mentors=1` (`people projects startups research jobs faculty`), `GET /discover/:kind/:id`, `GET /search?q=` (BM25 + stemming + synonyms across everything you can see), `GET /matches` (what you can offer vs what others need, with reasons)

**Collaboration** — `GET|POST /connections`, `POST /connections/:id/accept|decline`, `DELETE /connections/:id` (peer on your campus, mentor anywhere); `POST|PUT|DELETE /projects[/:id]`, `/startups[/:id]` (students own what they create); `GET|POST /collab`, `POST /collab/:id/accept|decline|withdraw` (ask to join a project, startup or research listing)

**Events** — `POST|DELETE /events/:id/register`, `GET /events/:id/registration`, `GET /me/events` (capacity + waitlist with automatic promotion)

**Notes** — `POST|PUT|DELETE /notes[/:id]`, `PUT|GET /notes/:id/file` (PDF/PNG/JPEG/DOCX/PPTX, ≤ 20 MB, magic-byte checked), `POST /notes/:id/rate`, `GET /notes/:id/reviews`

**Safety (real time)** — `GET /alerts`, `POST /alerts/:id/ack` (`safe` / `need_help`); `POST /stream/ticket` then `GET /stream?ticket=` for Server-Sent Events (`alert`, `alert_resolved`, `notification`); admins: `POST /admin/alerts`, `POST /admin/alerts/:id/resolve`, `GET /admin/alerts/:id/responses` (roll call)

**Notifications** — `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/:id/read`. Created automatically when admins publish notices/results/events/exams/jobs, and on connection/collab/alert activity. Phones receive them by push when `EXPO_PUSH=1`.

**Feedback** — `POST /feedback` (category `bug|idea|other`, message; 10/day per person); admins: `GET /admin/feedback?status=`, `PATCH /admin/feedback/:id` (`new|seen|done`)

**Campus map & career** — `GET /campus/map|route?from=&to=|search?q=`, `GET /career/paths[/:id]` (private skill-gap + matching jobs)

**Admin** (scoped to the admin's own university; permission per module, superadmin has all) — `GET|POST|PUT|DELETE /admin/{notices,events,exams,results,jobs,faculty,research}`, `GET /admin/events/:id/registrations`, `GET /admin/collab` + accept/decline (research interest), `GET|POST|PATCH /admin/users`, `GET /admin/students`, `GET /admin/stats`, `GET|PUT /admin/domains`, `GET /admin/audit`, `POST /admin/notify`, `PUT /admin/campus-map`

## Storage

SQLite at `data/mycampus.db` (gitignored), schema versioned with `PRAGMA user_version` (see `src/db.js`; append migrations, never edit old ones). Content is JSON documents with `kind`, `university`, `status`, `visibility` promoted to indexed columns; accounts, connections, requests, registrations, notifications, alerts and the audit log are real tables. Passwords are scrypt-hashed; changing/resetting a password revokes every older token.

## Known limits / not built

- **Search is lexical**, not embedding-based (it won't connect "car" with "vehicle"). Swap `src/search.js` for an embeddings provider when one is chosen.
- **Mail**: production needs `MAIL_PROVIDER=resend` (the only provider built); **push** needs `EXPO_PUSH=1` and real device tokens.
- The real-time bus and rate limiters are **in-process** — running multiple API instances needs Redis (or Postgres LISTEN/NOTIFY) behind `src/bus.js`, and a shared limiter store.
- SQLite is right for one server; move to Postgres before multi-instance deployment.
- Tokens last 7 days with server-side revocation; there are no refresh tokens yet.
- Faculty have no accounts (research interest is routed to admins); student grades have no admin upload screen yet.
