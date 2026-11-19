import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Home cards someone has hidden, remembered on this phone per account. Each card is keyed by what it shows
// ("notice:not-123"), so hiding one notice never hides the next one that's published.
const MAX = 300 // keep the newest few hundred; old keys are for content long gone anyway

export function useDismissed(userId) {
  const key = `mycampus.home.dismissed.${userId}`
  const [hidden, setHidden] = useState(() => new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let live = true
    AsyncStorage.getItem(key)
      .then((raw) => { if (live) setHidden(new Set(raw ? JSON.parse(raw) : [])) })
      .catch(() => {})
      .finally(() => live && setReady(true))
    return () => { live = false }
  }, [key])

  const dismiss = useCallback((id) => {
    setHidden((prev) => {
      const next = new Set(prev)
      next.add(id)
      AsyncStorage.setItem(key, JSON.stringify([...next].slice(-MAX))).catch(() => {})
      return next
    })
  }, [key])

  const restoreAll = useCallback(() => {
    setHidden(new Set())
    AsyncStorage.removeItem(key).catch(() => {})
  }, [key])

  return { isHidden: (id) => hidden.has(id), dismiss, restoreAll, hiddenCount: hidden.size, ready }
}
