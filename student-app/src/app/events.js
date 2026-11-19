import { useState } from 'react'
import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Async, Card, Chip, Segmented, formatDate } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { eventEnded, eventIsToday } from '../when'
import { tokens as t, themed } from '../theme'

// Every event your college has approved: what's on today, what's coming, and what already happened.
export default function Events() {
  const router = useRouter()
  const { data, loading, error, refreshing, reload } = useApi('/content/events')
  const [when, setWhen] = useState('upcoming')
  const all = data ?? []
  const groups = {
    today: all.filter(eventIsToday),
    upcoming: all.filter((e) => !eventEnded(e)).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    past: all.filter(eventEnded).sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
  }
  const empty = { today: ['Nothing on today', 'Events happening today show up here.'], upcoming: ['No upcoming events', 'Approved events from your college appear here.'], past: ['No past events', 'Events move here once they’re over.'] }[when]
  return (
    <FlatList
      data={groups[when]}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.list}
      onRefresh={reload}
      refreshing={refreshing}
      ListHeaderComponent={<Segmented value={when} onChange={setWhen} options={[{ value: 'today', label: `Today${groups.today.length ? ` · ${groups.today.length}` : ''}` }, { value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />}
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={reload} emptyIcon="ticket-outline" emptyTitle={empty[0]} empty={empty[1]} />}
      renderItem={({ item: e }) => (
        <Card onPress={() => router.push(`/event/${e.id}`)}>
          <View style={styles.row}>
            <Chip label={e.type ?? e.category ?? 'event'} tone={eventEnded(e) ? 'neutral' : 'green'} />
            {eventIsToday(e) ? <Chip label="today" tone="violet" /> : null}
          </View>
          <Text style={[styles.title, eventEnded(e) && { color: t.inkSoft }]}>{e.title}</Text>
          <Text style={styles.meta}>{formatDate(e.startDate, { day: 'numeric', month: 'short' })}{e.endDate && formatDate(e.endDate, { day: 'numeric', month: 'short' }) !== formatDate(e.startDate, { day: 'numeric', month: 'short' }) ? ` – ${formatDate(e.endDate, { day: 'numeric', month: 'short' })}` : ''}{e.location ? ` · ${e.location}` : ''}</Text>
        </Card>
      )}
    />
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  title: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 8, lineHeight: 21 },
  meta: { color: t.inkFaint, fontSize: 12, marginTop: 6 },
}))
