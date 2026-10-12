import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { canView, KINDS } from '../access.js'
import { docs } from '../db.js'
import { HttpError, wrap } from '../http.js'
import { uniCache, withUni } from '../directory.js'
import { viewDocs } from '../views.js'

export const contentRoutes = Router()
contentRoutes.use(requireAuth)

export const visibleDocs = (user, kind) => viewDocs(kind, docs.list(kind).filter((d) => canView(user, kind, d)), user)

contentRoutes.get('/content/:plural', wrap(async (req, res) => {
  const kind = KINDS[req.params.plural]
  if (!kind) throw new HttpError(404, 'Unknown content type.')
  const unis = uniCache()
  res.json(visibleDocs(req.user, kind).map((d) => withUni(unis, d)))
}))

contentRoutes.get('/content/:plural/:id', wrap(async (req, res) => {
  const kind = KINDS[req.params.plural]
  const doc = kind && docs.get(kind, req.params.id)
  const [view] = doc && canView(req.user, kind, doc) ? viewDocs(kind, [doc], req.user) : []
  // 404 (not 403) for hidden items so their existence isn't revealed. Exam series have no detail view of their own.
  if (!view || kind === 'exam') throw new HttpError(404, 'Not found.')
  res.json(withUni(uniCache(), view))
}))
