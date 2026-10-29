import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { respondToAlert, useAlerts } from '../alerts'
import { Button, Card, Chip, EmptyState, formatDate, timeAgo, useToast } from '../components/ui'
import { tokens as t, themed } from '../theme'

const TONE = { critical: 'red', warning: 'yellow', info: 'blue' }

export default function Alerts() {
  const alerts = useAlerts()
  const toast = useToast()
  const active = alerts.filter((a) => a.status === 'active')
  const past = alerts.filter((a) => a.status !== 'active')

  const respond = async (id, status) => {
    const err = await respondToAlert(id, status)
    if (err) toast.show(err, 'error')
  }

  const item = (a) => (
    <Card key={a.id} style={a.status === 'active' && { borderColor: a.severity === 'critical' ? '#b91c1c' : t.hairline }}>
      <View style={styles.top}>
        <Chip label={a.kind === 'evacuation' ? 'Evacuation' : a.kind} tone={TONE[a.severity]} />
        <Text style={styles.time}>{a.status === 'active' ? timeAgo(a.createdAt) : `Resolved ${formatDate(a.resolvedAt ?? a.createdAt, { day: 'numeric', month: 'short' })}`}</Text>
      </View>
      <Text style={styles.title}>{a.title}</Text>
      {a.location ? <Text style={styles.loc}><Ionicons name="location-outline" size={13} /> {a.location}</Text> : null}
      <Text style={styles.msg}>{a.message}</Text>
      {a.status === 'active' ? (
        a.myResponse ? (
          <Text style={styles.done}>{a.myResponse === 'safe' ? 'You marked yourself safe.' : 'You asked for help — someone will follow up.'}</Text>
        ) : (
          <View style={styles.actions}>
            <Button label="I'm safe" onPress={() => respond(a.id, 'safe')} style={{ flex: 1 }} compact />
            <Button label="I need help" variant="danger" onPress={() => respond(a.id, 'need_help')} style={{ flex: 1 }} compact />
          </View>
        )
      ) : null}
    </Card>
  )

  return (
    <FlatList
      data={[...active, ...past]}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.list}
      renderItem={({ item: a }) => item(a)}
      ListHeaderComponent={active.length === 0 && alerts.length > 0 ? <Text style={styles.calm}>No active alerts right now.</Text> : null}
      ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No alerts" body="Emergency and safety alerts from your campus will appear here, with a way to tell them you're safe." />}
    />
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  calm: { color: t.greenText, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: t.inkFaint, fontSize: 12 },
  title: { color: t.ink, fontSize: 17, fontWeight: '800', marginTop: 8 },
  loc: { color: t.violetText, fontSize: 13, marginTop: 4 },
  msg: { color: t.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  done: { color: t.greenText, fontSize: 13, fontWeight: '700', marginTop: 12 },
}))
