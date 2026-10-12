import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX = 'mycampus:admin:'

// One small helper to read/write JSON. We swallow errors and fall back to
// the initial value — a corrupt localStorage entry shouldn't crash the app.
function readJSON(key) {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw == null) return undefined
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function writeJSON(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* quota exceeded or disabled — ignore */
  }
}

function removeKey(key) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

// useStoredState — like useState but persisted to localStorage under a
// namespaced key. Optional `version` lets us bump and invalidate old shapes.
export function useStoredState(key, initialValue, { version } = {}) {
  const versionKey = `${key}::__v`
  const [value, setValue] = useState(() => {
    const storedVersion = readJSON(versionKey)
    if (version != null && storedVersion !== version) return initialValue
    const stored = readJSON(key)
    return stored === undefined ? initialValue : stored
  })

  // Keep a ref so the cross-tab `storage` listener can read the latest value.
  const ref = useRef(value)
  useEffect(() => { ref.current = value }, [value])

  // Persist on every change.
  useEffect(() => { writeJSON(key, value) }, [key, value])
  useEffect(() => { if (version != null) writeJSON(versionKey, version) }, [versionKey, version])

  // Sync across tabs.
  useEffect(() => {
    if (typeof window === 'undefined') return
    function onStorage(e) {
      if (e.key !== PREFIX + key) return
      try {
        const next = e.newValue == null ? initialValue : JSON.parse(e.newValue)
        setValue(next)
        ref.current = next
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, initialValue])

  const set = useCallback((updater) => {
    setValue((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  return [value, set]
}

// Store helpers — for code that needs to read/write outside React.
export const store = {
  get: readJSON,
  set: writeJSON,
  remove: removeKey,
  reset() {
    if (typeof window === 'undefined') return
    try {
      const toRemove = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(PREFIX)) toRemove.push(k)
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k))
    } catch { /* ignore */ }
  },
}
