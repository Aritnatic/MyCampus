import { z } from 'zod'
import { log } from './logger.js'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Wraps async handlers so thrown HttpErrors / rejected promises reach the error middleware.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Validates `data` against a zod schema; throws a 400 whose message is the first problem found.
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {})
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue.path.join('.')
    throw new HttpError(400, field ? `${field}: ${issue.message}` : issue.message)
  }
  return result.data
}

export const errorMiddleware = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'That upload is too large.' })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' })
  log('error', 'unhandled', { id: req.id, method: req.method, path: req.originalUrl?.split('?')[0], error: err?.message, stack: err?.stack })
  res.status(500).json({ error: 'Something went wrong.' })
}

export { z }
