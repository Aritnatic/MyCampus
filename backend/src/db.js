import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { config } from './config.js'

export const db = new DatabaseSync(config.dbFile)
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

// Schema is versioned with PRAGMA user_version. Append new migrations; never edit old ones.
const MIGRATIONS = [
  // 1 — core tables. Content is stored as JSON documents with the few columns we filter on
  // promoted to real, indexed columns; promote more as queries demand.
  `
  CREATE TABLE IF NOT EXISTS universities (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'individual')),
    university TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS docs (
    kind TEXT NOT NULL, id TEXT NOT NULL, university TEXT, status TEXT, visibility TEXT,
    data TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (kind, id)
  );
  CREATE INDEX IF NOT EXISTS docs_kind_uni ON docs (kind, university);
  `,
  // 2 — accounts, social graph, notifications, alerts, notes, audit
  `
  ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN created_at TEXT;
  ALTER TABLE users ADD COLUMN last_login_at TEXT;

  CREATE TABLE email_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE,
    purpose TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX email_codes_lookup ON email_codes (email, purpose);

  CREATE TABLE connections (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('peer', 'mentor')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (from_id, to_id, kind)
  );

  CREATE TABLE collab_requests (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_kind TEXT NOT NULL CHECK (target_kind IN ('project', 'startup', 'research')),
    target_id TEXT NOT NULL,
    role TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    created_at TEXT NOT NULL,
    decided_at TEXT,
    UNIQUE (from_id, target_kind, target_id)
  );

  CREATE TABLE registrations (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('registered', 'waitlist')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );

  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data TEXT,
    created_at TEXT NOT NULL,
    read_at TEXT
  );
  CREATE INDEX notifications_user ON notifications (user_id, created_at DESC);

  CREATE TABLE push_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE alerts (
    id TEXT PRIMARY KEY,
    university TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('evacuation', 'safety', 'info')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_by TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT
  );
  CREATE INDEX alerts_uni ON alerts (university, status);

  CREATE TABLE alert_acks (
    alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('safe', 'need_help')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (alert_id, user_id)
  );

  CREATE TABLE note_ratings (
    note_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TEXT NOT NULL,
    PRIMARY KEY (note_id, user_id)
  );

  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id TEXT,
    university TEXT,
    action TEXT NOT NULL,
    target TEXT,
    data TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX audit_uni ON audit_log (university, id DESC);
  `,
  // 3 — pilot feedback from inside the app
  `
  CREATE TABLE feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    university TEXT,
    category TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'other')),
    message TEXT NOT NULL,
    screen TEXT,
    app_version TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'done')),
    created_at TEXT NOT NULL
  );
  CREATE INDEX feedback_uni ON feedback (university, created_at DESC);
  `,
  // 4 — students asking faculty for project guidance. Faculty are directory records, not accounts,
  // so requests are emailed to them and a campus admin records their answer.
  `
  CREATE TABLE guidance_requests (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    faculty_id TEXT NOT NULL,
    university TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    note TEXT,
    created_at TEXT NOT NULL,
    decided_at TEXT
  );
  CREATE UNIQUE INDEX guidance_open ON guidance_requests (from_id, faculty_id) WHERE status = 'pending';
  CREATE INDEX guidance_uni ON guidance_requests (university, status, created_at DESC);
  `,
  // 5 — change counters, so in-memory caches can tell when the data they were built from has changed.
  // Triggers (not app code) bump them, so every write path counts, including scripts and tests. Only
  // columns that affect discovery fire the users trigger: logging in or changing a password does not.
  `
  CREATE TABLE change_marks (name TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
  INSERT INTO change_marks (name, n) VALUES ('students', 0);
  CREATE TRIGGER students_insert AFTER INSERT ON users BEGIN UPDATE change_marks SET n = n + 1 WHERE name = 'students'; END;
  CREATE TRIGGER students_delete AFTER DELETE ON users BEGIN UPDATE change_marks SET n = n + 1 WHERE name = 'students'; END;
  CREATE TRIGGER students_update AFTER UPDATE OF data, role, status, university, email_verified ON users
    BEGIN UPDATE change_marks SET n = n + 1 WHERE name = 'students'; END;
  `,
]

const version = db.prepare('PRAGMA user_version').get().user_version
for (let v = version; v < MIGRATIONS.length; v++) {
  db.exec('BEGIN')
  try {
    db.exec(MIGRATIONS[v])
    db.exec(`PRAGMA user_version = ${v + 1}`)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export const now = () => new Date().toISOString()
export const newId = (prefix) => `${prefix}-${randomUUID().slice(0, 8)}`

const parse = (row) => (row ? { ...JSON.parse(row.data), id: row.id } : null)

export const universities = {
  all: () => db.prepare('SELECT * FROM universities').all().map(parse),
  get: (id) => parse(db.prepare('SELECT * FROM universities WHERE id = ?').get(id)),
  put: (u) => db.prepare('INSERT INTO universities (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data').run(u.id, JSON.stringify(u)),
}

export const docs = {
  list: (kind) => db.prepare('SELECT * FROM docs WHERE kind = ?').all(kind).map(parse),
  get: (kind, id) => parse(db.prepare('SELECT * FROM docs WHERE kind = ? AND id = ?').get(kind, id)),
  put(kind, doc) {
    db.prepare(
      `INSERT INTO docs (kind, id, university, status, visibility, data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (kind, id) DO UPDATE SET university = excluded.university, status = excluded.status,
         visibility = excluded.visibility, data = excluded.data, updated_at = excluded.updated_at`,
    ).run(kind, doc.id, doc.university ?? null, doc.status ?? null, doc.visibility ?? null, JSON.stringify(doc), now())
    return doc
  },
  remove: (kind, id) => db.prepare('DELETE FROM docs WHERE kind = ? AND id = ?').run(kind, id).changes > 0,
  // Cheap change marker used to invalidate the search index.
  stamp: () => db.prepare('SELECT COUNT(*) AS n, MAX(updated_at) AS t FROM docs').get(),
}

// Cheap marker that changes whenever a student account is added, removed or edited (see migration 5).
export const studentsVersion = () => db.prepare("SELECT n FROM change_marks WHERE name = 'students'").get().n

export const users = {
  byEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  byId: (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id),
  students: () => db.prepare("SELECT * FROM users WHERE role = 'student' AND status = 'active'").all(),
  count: () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
  profile: (row) => JSON.parse(row.data),
  setProfile: (id, profile) => db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify(profile), id),
}

// Public shape of a user row — never includes the password hash or internal counters.
export function publicUser(row) {
  return {
    ...JSON.parse(row.data),
    id: row.id, email: row.email, role: row.role, university: row.university,
    status: row.status, emailVerified: !!row.email_verified,
  }
}

export function audit(actor, action, target, data) {
  db.prepare('INSERT INTO audit_log (actor_id, university, action, target, data, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(actor?.id ?? null, actor?.university ?? null, action, target ?? null, data ? JSON.stringify(data) : null, now())
}
