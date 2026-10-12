import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Async, Card, Chip, formatDate } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { tokens as t } from '../theme'

export default function MyEvents() {
  const router = useRouter()
  const { data, loading, error, refreshing, reload } = useApi('/me/events')
  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(x) => x.event.id}
      contentContainerStyle={styles.list}
      onRefresh={reload}
      refreshing={refreshing}
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={reload} emptyIcon="ticket-outline" emptyTitle="No events yet" empty="Events you register for will be listed here." />}
      renderItem={({ item: x }) => (
        <Card onPress={() => router.push(`/event/${x.event.id}`)}>
          <View style={styles.row}>
            <Chip label={x.event.type} tone="blue" />
            <Chip label={x.status === 'registered' ? 'registered' : 'waitlist'} tone={x.status === 'registered' ? 'green' : 'yellow'} />
          </View>
          <Text style={styles.title}>{x.event.title}</Text>
          <Text style={styles.meta}>{formatDate(x.event.startDate)}{x.event.venue ? ` · ${x.event.venue}` : ''}</Text>
        </Card>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: t.ink, fontSize: 15, fontWeight: '700', marginTop: 8 },
  meta: { color: t.inkFaint, fontSize: 12, marginTop: 4 },
})
