import { useState } from 'react'
import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Async, Card, Chip, Segmented, formatDate } from '../components/ui'
import { isToday, noticeEnded } from '../when'
import { useApi } from '../hooks/useApi'
import { tokens as t, themed } from '../theme'

const CATEGORY_TONE = { academic: 'violet', safety: 'yellow', placement: 'green', general: 'blue' }
const order = (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt)

export default function Notices() {
  const router = useRouter()
  const { data, loading, error, refreshing, reload } = useApi('/content/notices')
  const [when, setWhen] = useState('current')
  const all = data ?? []
  const groups = {
    today: all.filter((n) => isToday(n.publishedAt)),
    current: all.filter((n) => !noticeEnded(n)),
    older: all.filter(noticeEnded),
  }
  const empty = { today: ['Nothing new today', 'Notices published today show up here.'], current: ['No current notices', 'Notices from your college will appear here.'], older: ['No older notices', 'Notices move here once they expire.'] }[when]
  return (
    <FlatList
      data={[...groups[when]].sort(order)}
      ListHeaderComponent={<Segmented value={when} onChange={setWhen} options={[{ value: 'today', label: `Today${groups.today.length ? ` · ${groups.today.length}` : ''}` }, { value: 'current', label: 'Current' }, { value: 'older', label: 'Older' }]} />}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      onRefresh={reload}
      refreshing={refreshing}
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={reload} emptyIcon="newspaper-outline" emptyTitle={empty[0]} empty={empty[1]} />}
      renderItem={({ item: n }) => (
        <Card onPress={() => router.push(`/notice/${n.id}`)}>
          <View style={styles.row}>
            <Chip label={n.category} tone={CATEGORY_TONE[n.category]} />
            {n.pinned ? <Ionicons name="pin" size={14} color={t.violetText} /> : null}
          </View>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.meta}>{formatDate(n.publishedAt)}{n.expiresAt ? (noticeEnded(n) ? ` · expired ${formatDate(n.expiresAt)}` : ` · until ${formatDate(n.expiresAt)}`) : ''}</Text>
        </Card>
      )}
    />
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 8, lineHeight: 21 },
  meta: { color: t.inkFaint, fontSize: 12, marginTop: 6 },
}))
