import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { HubTile } from '../../components/profile'
import { tokens as t, themed } from '../../theme'

// Everything tied to your own campus.
const ENTRIES = [
  { href: '/notices', icon: 'newspaper-outline', title: 'Notices', body: 'Announcements from your college', tone: 'blue' },
  { href: '/exams', icon: 'calendar-outline', title: 'Exams & results', body: 'Timetable and published results', tone: 'yellow' },
  { href: '/map', icon: 'map-outline', title: 'Campus map', body: 'Buildings, labs and routes', tone: 'green' },
  { href: '/notes', icon: 'book-outline', title: 'Study notes', body: 'Shared notes by subject', tone: 'violet' },
  { href: '/my-events', icon: 'ticket-outline', title: 'My events', body: 'Events you’ve registered for', tone: 'green' },
  { href: '/career', icon: 'trail-sign-outline', title: 'Career paths', body: 'Skills to build for the work you want', tone: 'yellow' },
]

export default function Campus() {
  const router = useRouter()
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={15} color={t.greenText} />
        <Text style={styles.noteText}>Verified campus information, visible only to your college.</Text>
      </View>

      <HubTile wide icon="shield-checkmark-outline" tone="blue" label="Safety alerts" body={'Emergency notices and your “I’m safe” check-in'} onPress={() => router.push('/alerts')} />

      <View style={styles.grid}>
        {ENTRIES.map((e) => <HubTile key={e.href} icon={e.icon} tone={e.tone} label={e.title} body={e.body} onPress={() => router.push(e.href)} />)}
      </View>
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.greenSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  noteText: { flex: 1, color: t.greenText, fontSize: 12.5, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
}))
