import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import express, { Router } from 'express'
import { requireAuth, hasPermission } from '../auth.js'
import { canView } from '../access.js'
import { config } from '../config.js'
import { db, docs, newId, now, users } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'
import { uniCache, withUni } from '../directory.js'

export const noteRoutes = Router()
noteRoutes.use(requireAuth)
mkdirSync(config.uploadDir, { recursive: true })

const requireStudent = (req, res, next) =>
  req.user.role === 'student' ? next() : next(new HttpError(403, 'Only verified campus students can share notes.'))

const noteBody = z.object({
  title: z.string().trim().min(3).max(150),
  subject: z.string().trim().min(1).max(30),
  semester: z.number().int().min(1).max(12),
  description: z.string().trim().max(1000),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  visibility: z.enum(['campus', 'cross-university']),
}).partial().strict()

const isOwner = (user, note) => note.uploadedById === user.id
const loadNote = (user, id) => {
  const note = docs.get('note', id)
  if (!note || !canView(user, 'note', note)) throw new HttpError(404, 'Note not found.')
  return note
}

noteRoutes.post('/notes', requireStudent, wrap(async (req, res) => {
  const body = parse(noteBody, req.body)
  if (!body.title || !body.subject) throw new HttpError(400, 'Missing: title, subject')
  const profile = users.profile(req.user)
  const note = docs.put('note', {
    description: '', tags: [], visibility: 'campus', semester: profile.semester,
    ...body, id: newId('note'), university: req.user.university, branch: profile.branch,
    uploadedBy: profile.name, uploadedById: req.user.id, uploadDate: now().slice(0, 10),
    status: 'published', downloads: 0, rating: 0, reviews: 0, verified: false, featured: false, hasFile: false,
  })
  res.status(201).json(note)
}))

noteRoutes.put('/notes/:id', requireStudent, wrap(async (req, res) => {
  const note = loadNote(req.user, req.params.id)
  if (!isOwner(req.user, note)) throw new HttpError(404, 'Note not found.')
  res.json(docs.put('note', { ...note, ...parse(noteBody, req.body) }))
}))

noteRoutes.delete('/notes/:id', wrap(async (req, res) => {
  const note = loadNote(req.user, req.params.id)
  // Authors can remove their own notes; superadmins moderate their campus.
  if (!isOwner(req.user, note) && !(hasPermission(req.user, '*') && note.university === req.user.university)) throw new HttpError(404, 'Note not found.')
  docs.remove('note', note.id)
  db.prepare('DELETE FROM note_ratings WHERE note_id = ?').run(note.id)
  const file = join(config.uploadDir, note.id)
  if (existsSync(file)) unlinkSync(file)
  res.status(204).end()
}))

// ---- file upload / download ----
// What we accept, keyed by Content-Type, with the magic bytes each must start with.
// Checking the bytes (not just the header) stops an .exe being uploaded as "application/pdf".
const FILE_TYPES = {
  'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', magic: [0x50, 0x4b, 0x03, 0x04] },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', magic: [0x50, 0x4b, 0x03, 0x04] },
}
const readable = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

noteRoutes.put('/notes/:id/file', requireStudent, express.raw({ type: () => true, limit: config.maxUploadBytes }), wrap(async (req, res) => {
  const note = loadNote(req.user, req.params.id)
  if (!isOwner(req.user, note)) throw new HttpError(404, 'Note not found.')
  const type = FILE_TYPES[(req.get('content-type') ?? '').split(';')[0].trim()]
  if (!type) throw new HttpError(415, 'Upload a PDF, PNG, JPEG, DOCX or PPTX file.')
  const body = req.body
  if (!Buffer.isBuffer(body) || !body.length) throw new HttpError(400, 'The file is empty.')
  if (!type.magic.every((b, i) => body[i] === b)) throw new HttpError(400, "The file contents don't match its type.")

  writeFileSync(join(config.uploadDir, note.id), body)
  res.json(docs.put('note', { ...note, hasFile: true, fileType: type.ext, fileSize: readable(body.length), contentType: req.get('content-type').split(';')[0].trim() }))
}))

noteRoutes.get('/notes/:id/file', wrap(async (req, res) => {
  const note = loadNote(req.user, req.params.id)
  const file = join(config.uploadDir, note.id)
  if (!note.hasFile || !existsSync(file)) throw new HttpError(404, 'This note has no file attached.')
  docs.put('note', { ...note, downloads: (note.downloads ?? 0) + 1 })
  const safeName = `${note.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 80) || 'note'}.${note.fileType}`
  res.set({ 'Content-Type': note.contentType, 'Content-Disposition': `attachment; filename="${safeName}"`, 'X-Content-Type-Options': 'nosniff' })
  createReadStream(file).pipe(res)
}))

// ---- ratings ----
noteRoutes.post('/notes/:id/rate', wrap(async (req, res) => {
  const { rating, review } = parse(z.object({ rating: z.number().int().min(1).max(5), review: z.string().trim().max(500).optional() }), req.body)
  const note = loadNote(req.user, req.params.id)
  if (isOwner(req.user, note)) throw new HttpError(400, "You can't rate your own notes.")
  db.prepare('INSERT INTO note_ratings (note_id, user_id, rating, review, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (note_id, user_id) DO UPDATE SET rating = excluded.rating, review = excluded.review')
    .run(note.id, req.user.id, rating, review ?? null, now())
  const agg = db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS n FROM note_ratings WHERE note_id = ?').get(note.id)
  // Seeded notes carry made-up averages; the first real rating replaces them.
  res.json(withUni(uniCache(), docs.put('note', { ...note, rating: Math.round(agg.avg * 10) / 10, reviews: agg.n })))
}))

noteRoutes.get('/notes/:id/reviews', wrap(async (req, res) => {
  const note = loadNote(req.user, req.params.id)
  const rows = db.prepare('SELECT user_id, rating, review, created_at FROM note_ratings WHERE note_id = ? ORDER BY created_at DESC LIMIT 50').all(note.id)
  res.json(rows.map((r) => ({ rating: r.rating, review: r.review, createdAt: r.created_at, by: users.profile(users.byId(r.user_id)).name })))
}))
