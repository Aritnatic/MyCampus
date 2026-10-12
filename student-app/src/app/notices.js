import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Async, Card, Chip, formatDate } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { tokens as t } from '../theme'

const CATEGORY_TONE = { academic: 'violet', safety: 'yellow', placement: 'green', general: 'blue' }
const order = (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt)

export default function Notices() {
  const router = useRouter()
  const { data, loading, error, refreshing, reload } = useApi('/content/notices')
  return (
    <FlatList
      data={[...(data ?? [])].sort(order)}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      onRefresh={reload}
      refreshing={refreshing}
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={reload} emptyIcon="newspaper-outline" emptyTitle="No notices yet" empty="Notices from your college will appear here." />}
      renderItem={({ item: n }) => (
        <Card onPress={() => router.push(`/notice/${n.id}`)}>
          <View style={styles.row}>
            <Chip label={n.category} tone={CATEGORY_TONE[n.category]} />
            {n.pinned ? <Ionicons name="pin" size={14} color={t.violetText} /> : null}
          </View>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.meta}>{formatDate(n.publishedAt)}</Text>
        </Card>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 8, lineHeight: 21 },
  meta: { color: t.inkFaint, fontSize: 12, marginTop: 6 },
})
