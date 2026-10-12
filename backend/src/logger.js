import { randomUUID } from 'node:crypto'
import { config } from './config.js'

// One JSON object per line on stdout/stderr, so a host's log viewer can filter on fields.
// `output.write` is swappable so tests can capture lines without touching process streams.
export const output = {
  write: (level, line) => (level === 'error' ? process.stderr : process.stdout).write(`${line}\n`),
}

export function log(level, msg, fields = {}) {
  output.write(level, JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }))
}

// Logs every request when it finishes. Never logs the query string (the live stream's one-time ticket
// travels there), headers or bodies (passwords, tokens). /health is skipped so uptime pings don't drown the log.
export function requestLogger(req, res, next) {
  req.id = req.get('x-request-id')?.slice(0, 64) || randomUUID()
  res.set('X-Request-Id', req.id)
  if (!config.logRequests || req.path === '/health') return next()
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    log(res.statusCode >= 500 ? 'error' : 'info', 'request', {
      id: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms: Math.round(Number(process.hrtime.bigint() - start) / 1e5) / 10,
      user: req.user?.id,
    })
  })
  next()
}
