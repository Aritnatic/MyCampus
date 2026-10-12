import { config } from './config.js'
import { db, newId, now } from './db.js'
import { toUser } from './bus.js'

// Creates in-app notifications, pushes them to any connected real-time streams, and
// (when EXPO_PUSH=1) delivers them to registered phones through Expo's push service.
export function notify(userIds, { type, title, body = null, data = null }) {
  const ids = [...new Set(userIds)]
  if (!ids.length) return
  const insert = db.prepare('INSERT INTO notifications (id, user_id, type, title, body, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const created = now()
  for (const userId of ids) {
    const id = newId('ntf')
    insert.run(id, userId, type, title, body, data ? JSON.stringify(data) : null, created)
    toUser(userId, { type: 'notification', data: { id, type, title, body, data, createdAt: created } })
  }
  if (config.expoPush) pushToPhones(ids, { title, body, data: { type, ...data } })
}

// Everyone with an active student account at a university (optionally narrowed by a predicate on their profile).
export function studentsOf(university, predicate = () => true) {
  return db.prepare("SELECT id, data FROM users WHERE role = 'student' AND university = ? AND status = 'active'")
    .all(university)
    .filter((r) => predicate(JSON.parse(r.data)))
    .map((r) => r.id)
}

function pushToPhones(userIds, message) {
  const marks = userIds.map(() => '?').join(',')
  const tokens = db.prepare(`SELECT token FROM push_tokens WHERE user_id IN (${marks})`).all(...userIds).map((r) => r.token)
  // Fire and forget: a push outage must never fail the request that triggered it.
  for (let i = 0; i < tokens.length; i += 100) {
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(tokens.slice(i, i + 100).map((to) => ({ to, sound: 'default', ...message }))),
    }).catch((err) => console.warn('[push] failed:', err.message))
  }
}
