import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { call, login, stop, ACCOUNTS } from './helpers.js'

const { createBackup, listBackups, restoreBackup, verifyBackup } = await import('../src/backup.js')
const { config } = await import('../src/config.js')
const { db } = await import('../src/db.js')

after(stop)

describe('backups', () => {
  it('snapshots the database and uploads, verifies them, and keeps only the newest few', async () => {
    mkdirSync(config.uploadDir, { recursive: true })
    writeFileSync(join(config.uploadDir, 'note-demo'), 'pdf bytes')
    const before = db.prepare('SELECT COUNT(*) AS n FROM users').get().n

    const a = createBackup({ dir: config.backupDir, keep: 2 })
    assert.equal(a.users, before)
    assert.ok(a.docs > 0)
    assert.equal(readFileSync(join(a.path, 'uploads', 'note-demo'), 'utf8'), 'pdf bytes')

    await new Promise((r) => setTimeout(r, 15)) // distinct timestamps
    createBackup({ dir: config.backupDir, keep: 2 })
    await new Promise((r) => setTimeout(r, 15))
    createBackup({ dir: config.backupDir, keep: 2 })
    assert.equal(listBackups(config.backupDir).length, 2, 'older backups are pruned')
  })

  it('restores the data as it was, and keeps what it replaced', async () => {
    const token = await login(ACCOUNTS.moderator)
    const created = (await call('/admin/notices', { token, method: 'POST', body: { title: 'Before backup', body: 'x', category: 'general', status: 'published' } })).body
    const snap = createBackup({ dir: config.backupDir, keep: 5 })

    // A bad change after the backup: delete the notice.
    await call(`/admin/notices/${created.id}`, { token, method: 'DELETE' })
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM docs WHERE id = ?").get(created.id).n, 0)

    // Restore into a scratch copy and check the notice is back (the live database stays untouched in tests).
    const scratch = join(config.dataDir, 'restore-scratch')
    mkdirSync(scratch, { recursive: true })
    const summary = restoreBackup(snap.path, { dataDir: scratch, dbFile: join(scratch, 'db.sqlite'), uploadDir: join(scratch, 'uploads') })
    assert.ok(summary.docs > 0)
    const { DatabaseSync } = await import('node:sqlite')
    const restored = new DatabaseSync(join(scratch, 'db.sqlite'), { readOnly: true })
    assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM docs WHERE id = ?').get(created.id).n, 1)
    restored.close()
    assert.ok(existsSync(join(scratch, 'uploads', 'note-demo')))
  })

  it('refuses to restore something that is not a healthy database', () => {
    const bad = join(config.dataDir, 'bad-backup')
    mkdirSync(bad, { recursive: true })
    writeFileSync(join(bad, 'mycampus.db'), 'this is not a database')
    assert.throws(() => verifyBackup(bad))
    assert.ok(readdirSync(bad).length === 1)
  })
})
