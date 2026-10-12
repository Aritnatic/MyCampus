# Running the MyCampus pilot

Goal: a small, real group uses MyCampus for a few weeks and nobody needs a developer in the room. This is the checklist and the plan for when things go wrong.

## Before the pilot starts (owner: whoever deploys)

- [ ] **Decisions made** — hosting, mail provider account, who the pilot admins are, whether students self-register or get a roster (see PLAN.md "Decisions I need from you").
- [ ] **Deployed on staging** and `npm run smoke -- <url> --admin` passes (DEPLOY.md §5).
- [ ] **Legal pages reviewed by the college** and the `[BRACKETED]` placeholders in `backend/legal/privacy.html` and `terms.html` filled in — the smoke check fails until they are. Includes a named privacy contact and the campus emergency number.
- [ ] **Backups rehearsed**: take one, restore it on staging, confirm accounts and notes are there (DEPLOY.md §6). Copy of backups stored off the server.
- [ ] **Real email works**: register a brand-new test student with a real mailbox on a college domain, receive the code, sign in. Check the spam folder; fix SPF/DKIM if it landed there.
- [ ] **Admins trained** (30 minutes): publish a notice, create an event, raise and resolve a **test** safety alert (tell students first), import the roster, read feedback.
- [ ] **Roster imported** (if using one): Students → Import. Always run the preview first and read the skipped list.
- [ ] **Real content loaded**: the current notices, this term's exam timetable, faculty directory, and map. Seed data is 2024 demo content — an empty or stale app is the biggest adoption risk.
- [ ] **Phone builds installed** on at least one Android and one iPhone you can hold, and these were tried on the device: sign-up, push notification to a locked phone, share a note (file picker), the safety banner, "Download my data".
- [ ] **Safety alert drill** with the real admins and a handful of real phones before announcing to everyone.

## Day 1

1. Announce with the install link and the one-line pitch: "college notices, results, exams and safety alerts in one place".
2. Watch the logs and `/admin/feedback` for the first hours. Sign-up codes not arriving is the most likely first problem.
3. Run the smoke check again after any change.

## While it runs

- **Daily (5 min):** Feedback page (triage New → Seen → Done); error lines in the log (`"level":"error"`); confirm last night's backup exists (`backup.js list`).
- **Weekly:** reply to the feedback you acted on; look at how many students signed up vs. the roster; copy backups off-site.
- **Support:** the Me tab has *Send feedback*, *Privacy policy*, *Download my data* and *Delete my account*. People who delete their accounts are gone for good — that is the point.

## If something goes wrong

| Symptom | First move |
|---|---|
| Nobody can sign up / no codes | Check the mail provider dashboard and the log for mail errors. Students already registered can still sign in. |
| The app can't reach the server | `/health` from a browser. Restart the container. The data is on the volume; a restart loses nothing. |
| Many students "Too many requests" on campus Wi-Fi | They share one public IP. Raise `AUTH_IP_LIMIT` and restart. |
| A bad deploy | Roll back (DEPLOY.md §7). Restore the pre-deploy backup only if the database changed. |
| Data looks wrong or lost | Stop the server, restore the latest verified backup (DEPLOY.md §6), tell students what time the data goes back to. |
| A real emergency | The in-app alert is a supplement, **not** a replacement for the college's existing alarm and phone tree. Raise it from Safety alerts; resolve it when over. |
| A student reports misuse or a privacy request | Admin → Students: suspend. Deletion requests: the student can self-delete in the app; for anything else follow the college's process named in the privacy policy. |

## Measuring whether the pilot worked

Decide the numbers **before** day 1, for example: share of the roster who signed in at least once in week 1; weekly active students; notices read; feedback items closed; any safety-alert drill response time. The API log has per-request data; add dashboards only when a question needs one.

## End of the pilot

Export the feedback, take a final backup, and decide: continue, extend to more departments, or stop (then delete the data per the privacy policy's retention promise).
