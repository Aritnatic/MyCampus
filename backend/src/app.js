import { join } from 'node:path'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { config } from './config.js'
import { errorMiddleware } from './http.js'
import { requestLogger } from './logger.js'
import { adminRoutes } from './routes/admin.js'
import { alertAdminRoutes, alertRoutes } from './routes/alerts.js'
import { authRoutes } from './routes/auth.js'
import { campusRoutes } from './routes/campus.js'
import { careerRoutes } from './routes/career.js'
import { contentRoutes } from './routes/content.js'
import { discoverRoutes } from './routes/discover.js'
import { eventRoutes } from './routes/events.js'
import { feedbackRoutes } from './routes/feedback.js'
import { meRoutes, streamHandler } from './routes/me.js'
import { noteRoutes } from './routes/notes.js'
import { privacyRoutes } from './routes/privacy.js'
import { socialRoutes } from './routes/social.js'

// Built separately from listening so tests can run the real app on an ephemeral port.
export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  // Behind a reverse proxy in production, so rate limiting sees the real client IP.
  if (config.production) app.set('trust proxy', 1)
  app.use(requestLogger)
  app.use(helmet())
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }))
  // File uploads use their own raw parser; everything else is small JSON.
  app.use((req, res, next) => (req.path.endsWith('/file') && req.method === 'PUT' ? next() : express.json({ limit: '100kb' })(req, res, next)))

  app.get('/health', (req, res) => res.json({ ok: true }))

  // Public pages the apps link to (no sign-in needed to read what you're agreeing to).
  const LEGAL = new Set(['privacy', 'terms'])
  app.get('/legal/:page', (req, res, next) => (LEGAL.has(req.params.page)
    ? res.sendFile(join(config.root, 'legal', `${req.params.page}.html`))
    : next()))

  // The stream authenticates with a one-time ticket in the query string, not a bearer token.
  app.get('/api/stream', streamHandler)

  const api = express.Router()
  // Public routes first; every router after these requires a signed-in user.
  api.use(authRoutes)
  api.use(meRoutes, privacyRoutes, contentRoutes, discoverRoutes, socialRoutes, eventRoutes, noteRoutes, alertRoutes, campusRoutes, careerRoutes, feedbackRoutes)
  api.use(alertAdminRoutes, adminRoutes)
  api.use((req, res) => res.status(404).json({ error: 'Not found.' }))
  app.use('/api', api)

  // One URL for the pilot: the built admin panel is served here too. Unknown paths get index.html so the
  // panel's own routes (/admin/students…) survive a refresh. /api, /health and /legal are matched above.
  if (config.adminDir) {
    app.use(express.static(config.adminDir, { index: false, maxAge: '1h' }))
    app.get('/{*splat}', (req, res) => res.sendFile(join(config.adminDir, 'index.html')))
  }

  app.use(errorMiddleware)
  return app
}
