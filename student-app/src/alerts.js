import { useSyncExternalStore } from 'react'
import { request } from './api'

// Safety alerts for your campus. Kept in a tiny shared store so the banner, the alerts screen and the
// live stream always agree.
let alerts = []
let version = 0
const listeners = new Set()
const emit = () => { version += 1; listeners.forEach((fn) => fn()) }

export const useAlerts = () => {
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version)
  return alerts
}
export const activeAlerts = () => alerts.filter((a) => a.status === 'active')

export async function loadAlerts() {
  try {
    alerts = await request('/alerts')
    emit()
  } catch { /* offline: keep what we have */ }
}

export function clearAlerts() { alerts = []; emit() }

export function upsertAlert(alert) {
  const mine = alerts.find((a) => a.id === alert.id)?.myResponse ?? null
  alerts = [{ ...alert, myResponse: alert.myResponse ?? mine }, ...alerts.filter((a) => a.id !== alert.id)]
  emit()
}

export function resolveAlert(id) {
  alerts = alerts.map((a) => (a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a))
  emit()
}

// "I'm safe" / "I need help". Optimistic, and rolled back if the server refuses.
export async function respondToAlert(id, status) {
  const before = alerts
  alerts = alerts.map((a) => (a.id === id ? { ...a, myResponse: status } : a))
  emit()
  try {
    await request(`/alerts/${id}/ack`, { method: 'POST', body: { status } })
    return null
  } catch (e) {
    alerts = before
    emit()
    return e.message
  }
}
