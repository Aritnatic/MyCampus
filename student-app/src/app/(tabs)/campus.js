import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../components/ui'
import { tokens as t } from '../../theme'

// Everything tied to your own campus. More entries (map, career) land here as they're built.
const ENTRIES = [
  { href: '/alerts', icon: 'shield-checkmark-outline', title: 'Safety alerts', body: 'Emergency notices and "I\'m safe" check-in' },
  { href: '/exams', icon: 'calendar-outline', title: 'Exams & results', body: 'Your timetable and published results' },
  { href: '/map', icon: 'map-outline', title: 'Campus map', body: 'Find buildings, labs and walking routes' },
  { href: '/career', icon: 'trail-sign-outline', title: 'Career paths', body: 'See which skills to build for the work you want' },
  { href: '/my-events', icon: 'ticket-outline', title: 'My events', body: 'Events you’ve registered for' },
  { href: '/notes', icon: 'book-outline', title: 'Study notes', body: 'Shared notes by subject' },
]

export default function Campus() {
  const router = useRouter()
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.sub}>Verified campus information, visible only to your college.</Text>
      <View style={{ gap: 10, marginTop: 16 }}>
        {ENTRIES.map((e) => (
          <Card key={e.href} onPress={() => router.push(e.href)} accessibilityLabel={`${e.title}. ${e.body}`}>
            <View style={styles.row}>
              <View style={styles.icon}><Ionicons name={e.icon} size={22} color={t.violetText} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{e.title}</Text>
                <Text style={styles.body}>{e.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.inkFaint} />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  sub: { color: t.inkSoft, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: t.ink, fontSize: 16, fontWeight: '700' },
  body: { color: t.inkSoft, fontSize: 13, marginTop: 2 },
})
