import { useLocalSearchParams } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { Async, Chip, RichText, formatDate } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { tokens as t, themed } from '../../theme'

export default function NoticeDetail() {
  const { id } = useLocalSearchParams()
  const { data: n, loading, error, reload } = useApi(`/content/notices/${id}`)

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Async loading={loading} error={error} onRetry={reload}>
        {n && (
          <>
            <Chip label={n.category} tone="violet" />
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.meta}>Published {formatDate(n.publishedAt)}</Text>
            <RichText text={n.body} />
          </>
        )}
      </Async>
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { color: t.ink, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  meta: { color: t.inkFaint, fontSize: 12 },
}))
