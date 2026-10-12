import { EventEmitter } from 'node:events'

// In-process pub/sub that feeds the real-time stream (SSE). Single-process only: moving to
// multiple API instances means replacing this with Redis pub/sub or Postgres LISTEN/NOTIFY.
export const bus = new EventEmitter()
bus.setMaxListeners(0)

export const toUser = (userId, event) => bus.emit(`user:${userId}`, event)
export const toUniversity = (uniId, event) => bus.emit(`uni:${uniId}`, event)
