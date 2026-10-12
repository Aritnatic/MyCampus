import { createApp } from './app.js'
import { assertProductionReady, config } from './config.js'
import { users } from './db.js'
import { scheduleBackups } from './backup.js'
import { ensureSeeded } from './seed.js'

assertProductionReady()
if (config.seedDemo) await ensureSeeded()
else if (users.count() === 0) console.warn('The database has no accounts. Create the first admin with: npm run bootstrap -- --help')

// In production take a backup every 24h by default (BACKUP_EVERY_HOURS=0 turns it off).
scheduleBackups(Number(process.env.BACKUP_EVERY_HOURS ?? (config.production ? 24 : 0)))

const server = createApp().listen(config.port, '0.0.0.0', () => console.log(`MyCampus API listening on :${config.port}`))

// Stop cleanly on deploys / Ctrl-C: finish in-flight requests, but don't wait forever. Live-alert
// streams (SSE) never end on their own, so after a short grace period every connection is closed
// and phones simply reconnect to the new process.
const GRACE_MS = 3000
let stopping = false
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (stopping) process.exit(1) // second signal: stop now
    stopping = true
    server.close(() => process.exit(0))
    server.closeIdleConnections()
    setTimeout(() => server.closeAllConnections(), GRACE_MS).unref()
  })
}
