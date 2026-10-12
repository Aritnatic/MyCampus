# Deploying MyCampus for the pilot

One container runs everything: the API, the admin panel (served at `/`) and the legal pages. Phones talk to the same address under `/api`. Persistent data (database, uploaded notes, backups) lives in one folder, `/data`.

> Status: the pieces below were each run for real except the Docker build itself (no Docker on the development machine). Do the first deploy on a staging address and run the smoke check before pointing students at it.

## 1. Pick where it runs

Anything that runs a container **and gives it a persistent disk** works (Railway, Fly.io, a small VPS, a college server). Requirements:

- **One instance only.** Live alerts and rate limits are held in memory, and SQLite is a single file. Do not scale to two instances (see "Known limits" in README.md).
- A **persistent volume mounted at `/data`**. Without it every redeploy erases all accounts.
- **HTTPS** in front (the platform's proxy is fine). The server trusts one proxy hop so rate limits see real client IPs.
- Node 22.13+ if you run it without Docker.

## 2. Settings

Set these as the platform's secrets/environment (never commit them):

| Variable | Value |
|---|---|
| `JWT_SECRET` | 32+ random characters, e.g. `openssl rand -hex 32`. Changing it signs everyone out. |
| `CORS_ORIGIN` | Your public address, e.g. `https://mycampus.college.edu.in` (comma-separate several). Not `*`. |
| `MAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | From resend.com. Verify your sending domain there first (SPF/DKIM), or mail lands in spam. |
| `MAIL_FROM` | e.g. `MyCampus <no-reply@college.edu.in>` on the verified domain |
| `EXPO_PUSH` | `1` once the phone app has real push credentials |

Already set by the Docker image: `NODE_ENV=production`, `DATA_DIR=/data`, `ADMIN_DIR=/app/admin`, `PORT=4000`. Optional: `AUTH_IP_LIMIT` (default 600 per 15 min), `LOG_REQUESTS`, `BACKUP_EVERY_HOURS` (24), `BACKUP_KEEP` (14).

**The server refuses to start** if the secret is short, CORS is `*`, mail isn't configured, or demo accounts are enabled. The error names exactly what to fix. Production never creates demo accounts.

## 3. Build and run

```bash
docker build -t mycampus .
docker run -d --name mycampus -p 4000:4000 -v mycampus-data:/data --env-file .env mycampus
```

On a platform (Railway/Fly), point it at this repo's `Dockerfile`, mount the volume at `/data`, and set the variables above.

## 4. Create the college and the first admin (once)

```bash
docker exec -it mycampus node --disable-warning=ExperimentalWarning scripts/bootstrap.js \
  --id cvrp --name "C. V. Raman Polytechnic" --short CVRP \
  --domain cvrp.edu.in --domain students.cvrp.edu.in \
  --admin-name "Full Name" --admin-email name@cvrp.edu.in
```

The admin receives an emailed code, opens `https://<your-address>/` → "Forgot password or have a code?", and sets their own password. After that they create the other admins and set the verification domains from the admin panel — no terminal needed. The domains decide who counts as a verified student, so use only domains the college controls (never gmail.com).

## 5. Check it

```bash
cd backend && npm run smoke -- https://<your-address> --admin
```

It checks: server up, HTTPS and headers, the legal pages are public **and have no `[BRACKETED]` placeholders left**, anonymous callers are rejected, wrong passwords return a clean 401, and the admin panel is served. Add `SMOKE_EMAIL`/`SMOKE_PASSWORD` to also check a real sign-in. It exits non-zero on any failure — don't announce a deploy that fails it.

## 6. Backups and restore

The server takes a verified snapshot one minute after each start and then every 24 h into `/data/backups` and keeps the newest 14. **That folder sits on the same disk as the data**, so also copy it off the machine regularly (your platform's volume snapshots, or `docker cp mycampus:/data/backups ./offsite`).

```bash
docker exec mycampus node --disable-warning=ExperimentalWarning scripts/backup.js           # take one now
docker exec mycampus node --disable-warning=ExperimentalWarning scripts/backup.js list
docker exec mycampus node --disable-warning=ExperimentalWarning scripts/backup.js verify /data/backups/<folder>
# Restore: stop the container first, run restore on a one-off container with the same volume, start again.
```

Restore keeps what it replaced alongside as `*.before-restore-*`. **Rehearse a restore on staging before the pilot** — an untested backup is a hope, not a backup.

## 7. Rollback

Deploys that don't change the database format roll back by redeploying the previous image. Database changes are append-only migrations that run on start, so before any deploy that adds one: take a backup (step 6). To roll back across a migration, redeploy the old image **and** restore the pre-deploy backup.

## 8. Logs and monitoring

Each request is one JSON line on stdout (`method`, `path` without the query string, `status`, `ms`, `user` id, `id` matching the `X-Request-Id` response header); unexpected errors are `level":"error"` lines with a stack. Use your platform's log viewer and filter on `"level":"error"` or `"status":500`. Point an uptime monitor (UptimeRobot, Better Stack, the platform's own) at `/health` — it returns `{"ok":true}`. No error-tracking service is wired; add one if the pilot needs paging.

## 9. The phone app

Build with `EXPO_PUBLIC_API_URL=https://<your-address>/api`. Android internal testing and iOS TestFlight both need EAS builds and developer accounts (Google Play one-time fee; Apple Developer yearly fee) — those accounts are the college's/your decision. Push to a locked phone needs an EAS project id and a development/production build, not Expo Go; it has **not been tested on a real device yet**.

## Capacity

`npm run loadtest -- --users 500 --seconds 60 --think 15000` boots a throwaway server, signs in 500 students, keeps 500 live streams open and has each browse the Home/search/matches screens. On the development laptop: ~280 requests/s, 0 errors, slowest endpoint p95 ≈ 65 ms, and a safety alert reached all 500 phones in ≈ 75 ms. At three times that traffic: ~730 requests/s, still 0 errors. Re-run it on the real host — numbers depend on the machine.
