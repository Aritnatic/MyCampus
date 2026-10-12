import { canView } from './access.js'
import { canSeePerson, isMentor } from './directory.js'
import { docs, users } from './db.js'

// Natural-language search: BM25 ranking over title/tags/body with light stemming and a small
// synonym map, so "ml projects for beginners" finds "Machine Learning" listings.
// This is lexical, not embedding-based: it won't connect unrelated words ("car" ~ "vehicle").
// Swap `buildIndex`/`rank` for an embeddings provider once one is chosen (see CLAUDE.md).

const STOP = new Set('a an and are as at be but by for from has have i in is it its me my of on or our that the their them this to want we what who will with you your looking find need help get any some can how where when about into new'.split(' '))

const SYNONYMS = {
  ml: ['machine', 'learn'], ai: ['artifici', 'intellig', 'machine', 'learn'], dl: ['deep', 'learn'], js: ['javascript'], ts: ['typescript'],
  iot: ['internet', 'thing', 'embed'], cv: ['comput', 'vision'], nlp: ['natur', 'languag'], db: ['databas'], dbms: ['databas'],
  dsa: ['data', 'structur', 'algorithm'], web: ['frontend', 'react'], app: ['mobil'], hackathon: ['compet', 'contest'],
  internship: ['intern'], intern: ['internship'], job: ['hire', 'recruit', 'placement'], hiring: ['job', 'recruit'],
  startup: ['founder', 'entrepreneur'], research: ['paper', 'publication', 'lab'], mentor: ['guid', 'senior'], notes: ['note', 'study'],
}

function stem(word) {
  let w = word.toLowerCase()
  if (w.length <= 3) return w
  for (const [suffix, repl] of [['ies', 'y'], ['ing', ''], ['ed', ''], ['ers', 'er'], ['es', ''], ['s', '']]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) { w = w.slice(0, -suffix.length) + repl; break }
  }
  return w.replace(/(.)\1$/, '$1').replace(/e$/, '')
}

const words = (text) => String(text ?? '').toLowerCase().match(/[a-z0-9+#.]+/g)?.map((w) => w.replace(/^\.+|\.+$/g, '')).filter(Boolean) ?? []
const tokenize = (text) => words(text).filter((w) => !STOP.has(w)).map(stem)

// Words that say *what kind of thing* you want ("projects", "internships", "mentors"), not what it's about.
// They boost results of that kind instead of being matched as text, which would otherwise favour any
// record that happens to mention the word "project" in its description.
const KIND_WORDS = {
  project: 'project', projects: 'project', startup: 'startup', startups: 'startup',
  job: 'job', jobs: 'job', internship: 'job', internships: 'job', hiring: 'job', placement: 'job', placements: 'job', vacancy: 'job', vacancies: 'job',
  note: 'note', notes: 'note', event: 'event', events: 'event', hackathon: 'event', hackathons: 'event', workshop: 'event', workshops: 'event',
  research: 'research', faculty: 'faculty', professor: 'faculty', professors: 'faculty', teacher: 'faculty', teachers: 'faculty',
  people: 'people', student: 'people', students: 'people', mentor: 'people', mentors: 'people', peer: 'people', peers: 'people',
  notice: 'notice', notices: 'notice', announcement: 'notice', announcements: 'notice',
}
const KIND_BOOST = 1.8

function parseQuery(q) {
  const all = words(q).filter((w) => !STOP.has(w))
  const kinds = new Set(all.map((w) => KIND_WORDS[w]).filter(Boolean))
  // If the query is *only* kind words ("projects"), there's no topic to match, so keep them as text and browse that kind.
  const topical = all.filter((w) => !KIND_WORDS[w])
  const base = topical.length ? topical : all
  const out = new Set(base.map(stem))
  for (const w of base) for (const syn of SYNONYMS[w] ?? []) out.add(syn)
  return { terms: [...out], kinds, browse: topical.length === 0 && kinds.size > 0 }
}

const join = (...parts) => parts.flat().filter(Boolean).join(' ')

// What gets indexed, per record kind: [weighted text], plus how to show a hit.
const SPECS = {
  notice: { title: (d) => d.title, sub: (d) => `Notice · ${d.category}`, text: (d) => [[d.title, 3], [d.category, 2], [d.body, 1]] },
  event: { title: (d) => d.title, sub: (d) => `Event · ${d.type}`, text: (d) => [[d.title, 3], [join(d.tags, d.type, d.category), 2], [d.description, 1]] },
  note: { title: (d) => d.title, sub: (d) => `Notes · ${d.subject}`, text: (d) => [[d.title, 3], [join(d.tags, d.subject), 2], [d.description, 1]] },
  project: { title: (d) => d.title, sub: (d) => `Project · ${d.category}`, text: (d) => [[d.title, 3], [join(d.skills, d.tags, d.lookingFor, d.category), 2], [d.description, 1]] },
  startup: { title: (d) => d.name, sub: (d) => `Startup · ${d.sector}`, text: (d) => [[d.name, 3], [join(d.skills, d.sector, d.rolesOpen?.map((r) => r.role)), 2], [join(d.tagline, d.description), 1]] },
  research: { title: (d) => d.title, sub: (d) => `Research · ${d.supervisor}`, text: (d) => [[d.title, 3], [join(d.requiredSkills, d.preferredSkills, d.tags), 2], [d.description, 1]] },
  job: { title: (d) => d.title, sub: (d) => `Job · ${d.company}`, text: (d) => [[join(d.title, d.company), 3], [join(d.skills, d.type), 2], [d.description, 1]] },
  faculty: { title: (d) => d.name, sub: (d) => `Faculty · ${d.department}`, text: (d) => [[d.name, 3], [join(d.researchInterests, d.department), 2], [d.bio, 1]] },
}
const PEOPLE = { title: (p) => p.name, sub: (p) => `Student · ${p.branch ?? ''}`, text: (p) => [[p.name, 3], [join(p.skills, p.interests, p.lookingFor), 2], [p.bio, 1]] }

let cache = { key: null, builtAt: 0, entries: [], df: new Map(), avgLen: 1 }

function buildIndex() {
  const stamp = docs.stamp()
  const key = `${stamp.n}|${stamp.t}`
  // Docs changes are detected by stamp; profile edits (users table) are picked up by the TTL.
  if (cache.key === key && Date.now() - cache.builtAt < 30_000) return cache

  const entries = []
  const add = (kind, id, record, spec, meta) => {
    const tf = new Map()
    let len = 0
    for (const [text, weight] of spec.text(record)) {
      for (const tok of tokenize(text)) {
        tf.set(tok, (tf.get(tok) ?? 0) + weight)
        len += weight
      }
    }
    entries.push({ kind, id, record, title: spec.title(record), subtitle: spec.sub(record), tf, len, ...meta })
  }
  for (const [kind, spec] of Object.entries(SPECS)) for (const d of docs.list(kind)) add(kind, d.id, d, spec)
  for (const row of users.students()) add('people', row.id, { ...JSON.parse(row.data), id: row.id }, PEOPLE, { row })

  const df = new Map()
  for (const e of entries) for (const tok of e.tf.keys()) df.set(tok, (df.get(tok) ?? 0) + 1)
  cache = { key, builtAt: Date.now(), entries, df, avgLen: entries.reduce((s, e) => s + e.len, 0) / Math.max(entries.length, 1) || 1 }
  return cache
}

const K1 = 1.4
const B = 0.75

export function search(user, q, { limit = 20, kinds } = {}) {
  const { terms, kinds: wanted, browse } = parseQuery(q)
  if (!terms.length) return []
  const { entries, df, avgLen } = buildIndex()
  const N = entries.length

  const hits = []
  for (const e of entries) {
    if (kinds && !kinds.includes(e.kind)) continue
    // "projects" on its own means "show me projects": list that kind rather than text-matching the word.
    if (browse) { if (wanted.has(e.kind)) hits.push({ e, score: 1 }); continue }
    let score = 0
    for (const t of terms) {
      const f = e.tf.get(t)
      if (!f) continue
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5))
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * e.len) / avgLen)))
    }
    if (score > 0) hits.push({ e, score: wanted.size && wanted.has(e.kind) ? score * KIND_BOOST : score })
  }
  hits.sort((a, b) => b.score - a.score)

  // Visibility is applied after ranking, so a hidden record can never appear (or influence what you see).
  const out = []
  for (const { e, score } of hits) {
    const visible = e.kind === 'people' ? canSeePerson(user, e.row) && (e.row.id !== user.id) : canView(user, e.kind, e.record)
    if (!visible) continue
    out.push({ kind: e.kind, id: e.id, title: e.title, subtitle: e.subtitle, score: Math.round(score * 100) / 100 })
    if (out.length >= limit) break
  }
  return out
}

export { isMentor }
