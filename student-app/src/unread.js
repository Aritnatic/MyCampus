import { useSyncExternalStore } from 'react'
import { request } from './api'

// Tiny shared store for the Inbox badge, so the tab bar and the inbox screen agree.
let count = 0
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export const useUnread = () => useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => count)
export function setUnread(n) {
  if (n === count) return
  count = n
  emit()
}
export async function refreshUnread() {
  try {
    setUnread((await request('/notifications?limit=1')).unread)
  } catch { /* the badge is a nicety; stay quiet when offline */ }
}
