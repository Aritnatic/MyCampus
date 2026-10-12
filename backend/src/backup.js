import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from './config.js'
import { db } from './db.js'

// Backups are folders named by timestamp, each holding a consistent copy of the database
// (VACUUM INTO — safe to run while the server is serving requests) and the uploaded note files.
//
// These live on the same disk as the live data, so on their own they protect against mistakes and bad
// deploys, NOT against losing the disk. Copy the backup folder off the machine too (see DEPLOY.md).

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')

export function createBackup({ dir = config.backupDir, keep = 14 } = {}) {
  mkdirSync(dir, { recursive: true })
  const target = join(dir, stamp())
  mkdirSync(target)
  // VACUUM INTO writes a transactionally-consistent snapshot, unlike copying the file while it's being written.
  db.exec(`VACUUM INTO '${join(target, 'mycampus.db').replace(/'/g, "''")}'`)
  if (existsSync(config.uploadDir)) cpSync(config.uploadDir, join(target, 'uploads'), { recursive: true })

  const all = listBackups(dir)
  for (const old of all.slice(keep)) rmSync(old.path, { recursive: true, force: true })
  return { path: target, ...verifyBackup(target) }
}

export function listBackups(dir = config.backupDir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => existsSync(join(dir, n, 'mycampus.db')))
    .sort().reverse()
    .map((name) => ({ name, path: join(dir, name) }))
}

// Opens a backup read-only and checks it's a healthy database, returning what's inside it.
export function verifyBackup(path) {
  const snap = new DatabaseSync(join(path, 'mycampus.db'), { readOnly: true })
  try {
    const integrity = snap.prepare('PRAGMA integrity_check').get().integrity_check
    if (integrity !== 'ok') throw new Error(`Backup is corrupt: ${integrity}`)
    const count = (table) => snap.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n
    return { users: count('users'), docs: count('docs'), notifications: count('notifications') }
  } finally {
    snap.close()
  }
}

// Replaces the live data with a backup. The server must be stopped first (the live database file is swapped).
// Whatever was there is kept next to it as `*.before-restore-<time>`, so a restore can itself be undone.
export function restoreBackup(path, { dataDir = config.dataDir, dbFile = config.dbFile, uploadDir = config.uploadDir } = {}) {
  const summary = verifyBackup(path) // refuse to restore something unhealthy
  const t = stamp()
  for (const f of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) if (existsSync(f)) renameSync(f, `${f}.before-restore-${t}`)
  if (existsSync(uploadDir)) renameSync(uploadDir, `${uploadDir}.before-restore-${t}`)
  mkdirSync(dataDir, { recursive: true })
  cpSync(join(path, 'mycampus.db'), dbFile)
  if (existsSync(join(path, 'uploads'))) cpSync(join(path, 'uploads'), uploadDir, { recursive: true })
  return summary
}

// Runs a backup every `hours` for as long as the server is up. Errors are logged, never fatal.
export function scheduleBackups(hours) {
  if (!hours) return null
  const run = () => {
    try {
      const b = createBackup()
      console.log(`[backup] saved ${b.path} (${b.users} users, ${b.docs} records)`)
    } catch (err) {
      console.error('[backup] FAILED:', err.message)
    }
  }
  const timer = setInterval(run, hours * 3600_000)
  timer.unref()
  // The interval restarts on every deploy, so frequent deploys could otherwise mean no backup ever runs.
  setTimeout(run, 60_000).unref()
  return timer
}

export const sizeOf = (path) => (existsSync(path) ? statSync(path).size : 0)
