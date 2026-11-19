import { useEffect, useRef, useState } from 'react'
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Updates from 'expo-updates'
import { tokens as t, radius, themed } from '../theme'

// Live updates download in the background; without this the new version only appears on the second fresh
// start. This checks when the app opens and whenever it comes back to the foreground, downloads anything
// new, and offers a one-tap restart. Off in development (Expo Go / dev server), where updates don't apply.
export function UpdatePrompt() {
  const [ready, setReady] = useState(false)
  const checking = useRef(false)

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return undefined
    const check = async () => {
      if (checking.current) return
      checking.current = true
      try {
        const found = await Updates.checkForUpdateAsync()
        if (found.isAvailable) {
          await Updates.fetchUpdateAsync()
          setReady(true)
        }
      } catch {
        // Offline or the update server is unreachable: try again next time the app comes forward.
      } finally {
        checking.current = false
      }
    }
    check()
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check() })
    return () => sub.remove()
  }, [])

  if (!ready) return null
  return (
    <View style={styles.bar} accessibilityLiveRegion="polite">
      <Ionicons name="sparkles-outline" size={18} color={t.violetText} />
      <Text style={styles.text}>A new version of MyCampus is ready.</Text>
      <Pressable onPress={() => Updates.reloadAsync()} accessibilityRole="button" accessibilityLabel="Restart to update" style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}>
        <Text style={styles.btnText}>Restart</Text>
      </Pressable>
      <Pressable onPress={() => setReady(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Later">
        <Ionicons name="close" size={18} color={t.inkFaint} />
      </Pressable>
    </View>
  )
}

const styles = themed(() => StyleSheet.create({
  bar: { position: 'absolute', left: 12, right: 12, bottom: 96, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.container, backgroundColor: t.surface, borderWidth: 1, borderColor: t.violet, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  text: { flex: 1, color: t.ink, fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: t.violet, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.button },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
}))
