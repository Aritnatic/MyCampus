import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { respondToAlert } from '../alerts'
import { useToast } from './ui'
import { tokens as t, themed } from '../theme'

const SEVERITY = {
  critical: { bg: '#7f1d1d', fg: '#fecaca', icon: 'warning' },
  warning: { bg: '#78350f', fg: '#fde68a', icon: 'alert-circle' },
  info: { bg: '#1e3a5f', fg: '#bfdbfe', icon: 'information-circle' },
}

// Pinned above everything while a campus alert is active. Always one tap from "I'm safe" / "I need help".
export function AlertBanner({ alert, count }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const s = SEVERITY[alert.severity] ?? SEVERITY.info
  const answered = alert.myResponse

  const respond = async (status) => {
    const err = await respondToAlert(alert.id, status)
    if (err) toast.show(err, 'error')
    else toast.show(status === 'safe' ? 'Marked safe. Stay alert for updates.' : 'Help has been requested. Stay where you are if you can.', 'success')
  }

  return (
    <View style={[styles.bar, { backgroundColor: s.bg, paddingTop: insets.top + 8 }]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Pressable onPress={() => router.push('/alerts')} accessibilityRole="button" accessibilityLabel={`${alert.title}. ${alert.message}. Open details`} style={styles.row}>
        <Ionicons name={s.icon} size={22} color={s.fg} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: s.fg }]} numberOfLines={1}>{alert.title}{count > 1 ? `  (+${count - 1} more)` : ''}</Text>
          <Text style={[styles.msg, { color: s.fg }]} numberOfLines={2}>{alert.location ? `${alert.location}: ` : ''}{alert.message}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={s.fg} />
      </Pressable>
      {answered ? (
        <Text style={[styles.done, { color: s.fg }]}>{answered === 'safe' ? 'You marked yourself safe.' : 'You asked for help.'}</Text>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => respond('safe')} accessibilityRole="button" accessibilityLabel="I'm safe" style={[styles.btn, { backgroundColor: '#14532d' }]}>
            <Text style={styles.btnText}>I'm safe</Text>
          </Pressable>
          <Pressable onPress={() => respond('need_help')} accessibilityRole="button" accessibilityLabel="I need help" style={[styles.btn, { backgroundColor: '#fff' }]}>
            <Text style={[styles.btnText, { color: '#7f1d1d' }]}>I need help</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = themed(() => StyleSheet.create({
  bar: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  title: { fontSize: 15, fontWeight: '800' },
  msg: { fontSize: 13, lineHeight: 18, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  done: { fontSize: 13, fontWeight: '700' },
}))
