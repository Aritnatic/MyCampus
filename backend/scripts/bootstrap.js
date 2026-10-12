// Creates the first college and its first superadmin in a fresh database — the one thing the app can't do
// for itself. Run once per college:
//
//   npm run bootstrap -- --id cvrp --name "C. V. Raman Polytechnic" --short CVRP \
//     --domain cvrp.edu.in --domain students.cvrp.edu.in \
//     --admin-name "Dr. Rajesh Kumar" --admin-email rajesh.kumar@cvrp.edu.in
//
// The admin gets an emailed 6-digit code to set their own password (no password is ever generated or printed).
import { parseArgs } from 'node:util'
import { randomBytes } from 'node:crypto'
import { hashPassword, issueCode } from '../src/auth.js'
import { audit, db, newId, now, universities, users } from '../src/db.js'
import { exposeCodes, sendMail } from '../src/mailer.js'

const { values: v } = parseArgs({
  options: {
    id: { type: 'string' }, name: { type: 'string' }, short: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' },
    domain: { type: 'string', multiple: true }, 'admin-name': { type: 'string' }, 'admin-email': { type: 'string' }, help: { type: 'boolean' },
  },
})

const usage = `Usage: npm run bootstrap -- --id cvrp --name "College name" --short CVRP --domain cvrp.edu.in [--domain students.cvrp.edu.in] --admin-name "Name" --admin-email name@cvrp.edu.in [--city X --state Y]`
const fail = (msg) => { console.error(`\n${msg}\n\n${usage}`); process.exit(1) }

if (v.help) { console.log(usage); process.exit(0) }
for (const f of ['id', 'name', 'short', 'admin-name', 'admin-email']) if (!v[f]) fail(`Missing --${f}`)
if (!v.domain?.length) fail('Give at least one --domain: the email domain(s) that prove someone belongs to this college.')
if (!/^[a-z0-9-]{2,20}$/.test(v.id)) fail('--id must be 2–20 lowercase letters, digits or dashes.')

const PUBLIC_MAIL = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me']
const domains = [...new Set(v.domain.map((d) => d.trim().toLowerCase().replace(/^@/, '')))]
for (const d of domains) {
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d)) fail(`"${d}" isn't a valid domain.`)
  if (PUBLIC_MAIL.includes(d)) fail(`${d} is a public mail provider: anyone could sign up with it, so it can't prove college membership.`)
}
const email = v['admin-email'].trim().toLowerCase()
if (!email.includes('@') || !domains.includes(email.split('@')[1])) fail(`The admin's email must be on one of the college domains (${domains.join(', ')}).`)
if (users.byEmail(email)) fail(`${email} already has an account.`)
const clash = universities.all().find((u) => u.id !== v.id && (u.domains ?? []).some((d) => domains.includes(d)))
if (clash) fail(`${clash.short} already uses one of those domains.`)

const existing = universities.get(v.id)
universities.put({ ...(existing ?? {}), id: v.id, name: v.name, short: v.short, city: v.city ?? existing?.city ?? '', state: v.state ?? existing?.state ?? '', tier: 'campus', domains })

const id = newId('admin')
const everything = ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users', 'safety', 'faculty', 'research']
db.prepare("INSERT INTO users (id, email, password_hash, role, university, status, data, created_at) VALUES (?, ?, ?, 'admin', ?, 'active', ?, ?)")
  .run(id, email, await hashPassword(randomBytes(24).toString('hex')), v.id, JSON.stringify({ name: v['admin-name'], adminRole: 'superadmin', permissions: everything }), now())
audit({ id, university: v.id }, 'bootstrap', id, { name: v['admin-name'] })

const code = issueCode(email, 'reset')
const mail = await sendMail({ to: email, subject: 'Your MyCampus admin account', text: `You're the first admin of ${v.name} on MyCampus.\n\nSet your password with this code: ${code}\n(valid for 15 minutes)\n\nOpen the admin panel, choose "Have a code?" on the sign-in page, and enter your email, this code and a new password.` })

console.log(`\n${existing ? 'Updated' : 'Created'} ${v.name} (${v.id}) with domains: ${domains.join(', ')}`)
console.log(`Created superadmin ${v['admin-name']} <${email}>`)
console.log(mail.delivered ? `A code to set their password was emailed to ${email}.` : `Could not email the code. Run bootstrap again after fixing mail, or have them use "Forgot password" on the sign-in page.`)
if (exposeCodes()) console.log(`(development) the code is ${code}`)
