// npm run backup            — take a backup now, verify it, prune old ones
// npm run backup -- list    — show what's available
// npm run backup -- verify <folder>
// npm run backup -- restore <folder>   (stop the server first)
import { createBackup, listBackups, restoreBackup, verifyBackup } from '../src/backup.js'

const [cmd = 'create', arg] = process.argv.slice(2)
if (cmd === 'create') {
  const b = createBackup({ keep: Number(process.env.BACKUP_KEEP ?? 14) })
  console.log(`Backup saved to ${b.path}\n  ${b.users} users · ${b.docs} records · integrity ok`)
} else if (cmd === 'list') {
  for (const b of listBackups()) console.log(b.name, b.path)
} else if (cmd === 'verify' && arg) {
  const s = verifyBackup(arg)
  console.log(`OK — ${s.users} users, ${s.docs} records`)
} else if (cmd === 'restore' && arg) {
  const s = restoreBackup(arg)
  console.log(`Restored ${s.users} users and ${s.docs} records from ${arg}.\nThe previous data was kept alongside as *.before-restore-*.`)
} else {
  console.error('Usage: npm run backup [-- list | verify <folder> | restore <folder>]')
  process.exit(1)
}
