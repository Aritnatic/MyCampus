import { useSyncExternalStore } from 'react'

// A shared "something may have changed" signal. Anything fetched with useApi refetches quietly when it
// fires, so lists update when new content is published, when the live connection comes back, and when
// the app returns to the foreground, without anyone pulling down to refresh.
let tick = 0
let timer = null
const listeners = new Set()

export const useAutoRefreshTick = () => useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => tick)

// Debounced: a burst of events (several notices published together) causes one refetch, not many.
export function requestRefresh(delayMs = 600) {
  clearTimeout(timer)
  timer = setTimeout(() => { tick += 1; listeners.forEach((fn) => fn()) }, delayMs)
}
