import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = process.env.DATA_DIR ?? join(root, 'data')
mkdirSync(dataDir, { recursive: true })

const production = process.env.NODE_ENV === 'production'

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (production) throw new Error('JWT_SECRET must be set in production')
  // Dev convenience: persist a random secret so tokens survive restarts.
  const file = join(dataDir, 'jwt.secret')
  if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString('hex'), { mode: 0o600 })
  return readFileSync(file, 'utf8')
}

export const config = {
  root,
  production,
  port: Number(process.env.PORT ?? 4000),
  dbFile: process.env.DB_FILE ?? join(dataDir, 'mycampus.db'), // ':memory:' works (tests)
  dataDir,
  uploadDir: process.env.UPLOAD_DIR ?? join(dataDir, 'uploads'),
  backupDir: process.env.BACKUP_DIR ?? join(dataDir, 'backups'),
  jwtSecret: jwtSecret(),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  seedPassword: process.env.SEED_PASSWORD ?? 'campus123',
  // Demo accounts (all sharing one well-known password) are for development only. Production never
  // seeds, unless someone deliberately sets SEED_DEMO=1 on a throwaway environment.
  seedDemo: process.env.SEED_DEMO === '1' || (!production && process.env.SEED_DEMO !== '0'),
  tokenTtl: '7d',
  // Where outgoing email goes: 'console' (dev: prints codes, and the API returns them), 'resend', or ''
  // (nothing configured). Production requires a real provider.
  mailProvider: process.env.MAIL_PROVIDER ?? (production ? '' : 'console'),
  mailFrom: process.env.MAIL_FROM ?? 'MyCampus <no-reply@localhost>',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  resendUrl: process.env.RESEND_API_URL ?? 'https://api.resend.com/emails', // overridable so tests never call the real service
  // Set EXPO_PUSH=1 to deliver push notifications through Expo's push service.
  expoPush: process.env.EXPO_PUSH === '1',
  // If set, the built admin panel in this folder is served by the API at "/" (one URL for the pilot).
  adminDir: process.env.ADMIN_DIR ?? '',
  // Blunt per-IP cap on /auth. A whole campus shares one public IP on its Wi-Fi, so this must be well above
  // one person's needs; guessing is limited per account elsewhere.
  authIpLimit: Number(process.env.AUTH_IP_LIMIT ?? 600),
  // One JSON line per request. On by default in production; LOG_REQUESTS=1/0 overrides.
  logRequests: process.env.LOG_REQUESTS ? process.env.LOG_REQUESTS === '1' : production,
  maxUploadBytes: 20 * 1024 * 1024,
}

// Refuse to start a production server that is missing something it can't safely run without.
// Called from server.js (not at import) so tests and scripts can still load config.
export function assertProductionReady() {
  if (!production) return
  const problems = []
  if (config.jwtSecret.length < 32) problems.push('JWT_SECRET must be at least 32 characters.')
  if (config.corsOrigin === '*') problems.push('CORS_ORIGIN must list your real origins (comma-separated), not *.')
  if (!['resend'].includes(config.mailProvider)) problems.push('MAIL_PROVIDER must be set (supported: resend) — without it nobody can sign up or reset a password.')
  if (config.mailProvider === 'resend' && !config.resendApiKey) problems.push('RESEND_API_KEY is required when MAIL_PROVIDER=resend.')
  if (config.seedDemo) problems.push('SEED_DEMO=1 would create demo accounts with a public password. Remove it.')
  if (problems.length) throw new Error(`Not safe to start in production:\n - ${problems.join('\n - ')}`)
}
