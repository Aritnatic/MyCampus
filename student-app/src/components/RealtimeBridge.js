import { useEffect } from 'react'
import { AppState } from 'react-native'
import { clearAlerts, loadAlerts, resolveAlert, upsertAlert } from '../alerts'
import { useAuth } from '../context/AuthContext'
import { registerForPush } from '../push'
import { connectStream } from '../realtime'
import { refreshUnread } from '../unread'
import { useToast } from './ui'

// Renders nothing. While signed in it keeps the app live: the event stream, alerts, the Inbox badge
// and push registration. Refetches whenever the app returns to the foreground, because a phone can
// miss stream events while it's asleep.
export function RealtimeBridge() {
  const { user } = useAuth()
  const toast = useToast()
  const userId = user?.id
  const hasCampus = !!user?.university

  useEffect(() => {
    if (!userId) return undefined
    refreshUnread()
    if (hasCampus) loadAlerts()
    registerForPush()

    const stop = connectStream({
      onEvent: (type, data) => {
        if (type === 'notification') {
          refreshUnread()
          if (data.data?.severity === undefined) toast.show(data.title) // alerts have their own banner
        } else if (type === 'alert') {
          upsertAlert(data)
          toast.show(`Safety alert: ${data.title}`, 'error')
        } else if (type === 'alert_resolved') {
          resolveAlert(data.id)
        }
      },
      onStatus: (status) => { if (status === 'open') { refreshUnread(); if (hasCampus) loadAlerts() } },
    })
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') { refreshUnread(); if (hasCampus) loadAlerts() }
    })
    return () => {
      stop()
      sub.remove()
      clearAlerts()
    }
  }, [userId, hasCampus, toast])

  return null
}
