// Thin localStorage-backed layer over the static mock data files.
// Each entity type has a key; reads return the persisted array if present,
// otherwise the mock fallback. Writes replace the whole array for that key.
//
// We intentionally keep the mock files as the source of truth at boot so the
// first run (no localStorage entry) still shows the demo data.

import { useSyncExternalStore } from 'react'
import { store } from '../hooks/useStoredState'
import { ApiError, request } from '../api'

export function getStoredCollection(key, fallback) {
  const stored = store.get(key)
  if (Array.isArray(stored)) return stored
  return fallback
}

export function setStoredCollection(key, items) {
  store.set(key, items)
}

export function appendToCollection(key, fallback, item) {
  const list = getStoredCollection(key, fallback)
  const next = [item, ...list.filter((x) => x.id !== item.id)]
  setStoredCollection(key, next)
  return next
}

export function updateInCollection(key, fallback, id, patch) {
  const list = getStoredCollection(key, fallback)
  const next = list.map((x) => (x.id === id ? { ...x, ...patch } : x))
  setStoredCollection(key, next)
  return next
}

export function removeFromCollection(key, fallback, id) {
  const list = getStoredCollection(key, fallback)
  const next = list.filter((x) => x.id !== id)
  setStoredCollection(key, next)
  return next
}

// Reset everything back to the demo data. Called by Settings → "Reset demo data".
export function resetAllStoredCollections(keys) {
  keys.forEach((k) => store.remove(k))
}

// Builds an array-like Proxy over whatever list `getList()` currently returns, plus the
// mutation helpers. The helpers live in a closure rather than being assigned onto the
// proxy: the traps below describe the *current* list, which never actually holds them, so
// an assignment would be rejected by the proxy invariants.
// `import { x } from ...` then `x.add(item)` still reads the same as a plain array.
function makeListProxy(getList, helpers) {
  const isHelper = (prop) => Object.prototype.hasOwnProperty.call(helpers, prop)

  return new Proxy([], {
    get(_t, prop) {
      if (isHelper(prop)) return helpers[prop]
      const list = getList()
      const value = list[prop]
      // Array methods (find/filter/map/...) must run against the live list, not
      // the empty proxy target.
      return typeof value === 'function' ? value.bind(list) : value
    },
    has(_t, prop) {
      if (isHelper(prop)) return true
      return prop in getList()
    },
    ownKeys() {
      // Includes 'length', which the invariants require since the target has it
      // as a non-configurable own property.
      return Reflect.ownKeys(getList())
    },
    getOwnPropertyDescriptor(target, prop) {
      // 'length' exists on the target as non-configurable; reporting it as
      // configurable would throw, so hand back the target's own descriptor.
      if (prop === 'length') return Reflect.getOwnPropertyDescriptor(target, prop)
      const desc = Reflect.getOwnPropertyDescriptor(getList(), prop)
      // Must be configurable: these indices don't exist on the empty target.
      return desc ? { ...desc, configurable: true } : undefined
    },
  })
}

// Local-only list: persisted in localStorage, seeded from a demo array. Used for data the
// API doesn't cover yet (companies, admin users, the student roster).
export function makeLiveList(key, demoArray, name) {
  return makeListProxy(() => getStoredCollection(key, demoArray), {
    add: (item) => appendToCollection(key, demoArray, item),
    update: (id, patch) => updateInCollection(key, demoArray, id, patch),
    remove: (id) => removeFromCollection(key, demoArray, id),
    setAll: (list) => setStoredCollection(key, list),
    __name: name,
  })
}

// ---------------------------------------------------------------------------
// API-backed lists
//
// Reads stay synchronous (pages call `notices.filter(...)` during render) by serving an
// in-memory cache that `syncRemoteLists()` fills from `GET /admin/:plural` after login.
// Writes are optimistic: the cache changes immediately, the request follows, and a
// failure rolls the cache back and reports through `onStoreError`. Writes to one list
// are queued so an edit made right after a create can't overtake it.
// ---------------------------------------------------------------------------

const remoteLists = new Map() // plural -> { items, queue, aliases }
let revision = 0
const subscribers = new Set()
const errorListeners = new Set()

function bump() {
  revision += 1
  subscribers.forEach((fn) => fn())
}

// Re-render hook: pages that read a remote list include this value in their memo deps.
export function useStoreRevision() {
  return useSyncExternalStore(
    (fn) => { subscribers.add(fn); return () => subscribers.delete(fn) },
    () => revision,
  )
}

export function onStoreError(fn) {
  errorListeners.add(fn)
  return () => errorListeners.delete(fn)
}
const reportError = (message) => errorListeners.forEach((fn) => fn(message))

export function makeRemoteList(plural, name) {
  const entry = { items: [], queue: Promise.resolve(), aliases: new Map(), pending: 0 }
  remoteLists.set(plural, entry)

  // Ids the page knows (client-generated) vs the ones the server assigned.
  const real = (id) => entry.aliases.get(id) ?? id
  const swap = (id, doc) => { entry.items = entry.items.map((x) => (x.id === id ? doc : x)) }

  // Runs `send` after earlier writes finish; on failure undoes the optimistic change.
  const enqueue = (send, rollback, failure) => {
    entry.pending += 1
    entry.queue = entry.queue.then(send).catch((err) => {
      rollback()
      bump()
      reportError(err instanceof ApiError && err.status === 403 ? "You don't have permission to do that." : `${failure} ${err.message}`)
    }).finally(() => { entry.pending -= 1 })
  }

  return makeListProxy(() => entry.items, {
    add(item) {
      entry.items = [item, ...entry.items.filter((x) => x.id !== item.id)]
      bump()
      enqueue(
        async () => {
          const saved = await request(`/admin/${plural}`, { method: 'POST', body: item })
          entry.aliases.set(item.id, saved.id)
          swap(item.id, saved)
          bump()
        },
        () => { entry.items = entry.items.filter((x) => x.id !== item.id) },
        "Couldn't save the new record.",
      )
      return entry.items
    },
    update(id, patch) {
      const before = entry.items.find((x) => x.id === id)
      entry.items = entry.items.map((x) => (x.id === id ? { ...x, ...patch } : x))
      bump()
      enqueue(
        async () => {
          const saved = await request(`/admin/${plural}/${real(id)}`, { method: 'PUT', body: patch })
          swap(real(id), saved)
          bump()
        },
        () => { if (before) swap(id, before) },
        "Couldn't save your changes.",
      )
      return entry.items
    },
    remove(id) {
      const index = entry.items.findIndex((x) => x.id === id)
      const before = entry.items[index]
      entry.items = entry.items.filter((x) => x.id !== id)
      bump()
      enqueue(
        async () => { await request(`/admin/${plural}/${real(id)}`, { method: 'DELETE' }) },
        () => { if (before) entry.items = [...entry.items.slice(0, index), before, ...entry.items.slice(index)] },
        "Couldn't delete the record.",
      )
      return entry.items
    },
    __name: name,
  })
}

// Loads every remote list. A 403 just means this admin has no access to that module, so
// the list stays empty; anything else is a real failure the caller should surface.
export async function syncRemoteLists() {
  await Promise.all([...remoteLists].map(async ([plural, entry]) => {
    if (entry.pending > 0) return // don't clobber unsent optimistic changes
    try {
      entry.items = await request(`/admin/${plural}`)
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 403)) throw err
      entry.items = []
    }
  }))
  bump()
}

// Drops all cached server data (on sign-out, so the next admin never sees the last one's records).
export function clearRemoteLists() {
  remoteLists.forEach((entry) => { entry.items = []; entry.aliases.clear() })
  bump()
}
