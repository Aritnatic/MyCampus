import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Async, Card, Chip } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { tokens as t } from '../theme'

export function ReadinessBar({ value }) {
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} accessibilityLabel={`${value}% of the core skills`} style={styles.track}>
      <View style={[styles.fill, { width: `${value}%` }]} />
    </View>
  )
}

export default function Careers() {
  const router = useRouter()
  const { data, loading, error, reload } = useApi('/career/paths')
  const paths = [...(data ?? [])].sort((a, b) => Number(b.forYourBranch) - Number(a.forYourBranch))
  return (
    <FlatList
      data={paths}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.intro}>Pick a direction to see which skills you already have and what to learn next. Only you can see this.</Text>}
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={reload} emptyIcon="trail-sign-outline" emptyTitle="No career paths yet" empty="Check back soon." />}
      renderItem={({ item: p }) => (
        <Card onPress={() => router.push(`/career/${p.id}`)} accessibilityLabel={`${p.title}. You have ${p.readiness}% of the core skills.`}>
          <View style={styles.top}>
            <Text style={styles.icon}>{p.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{p.title}</Text>
              {p.forYourBranch ? <Chip label="Fits your branch" tone="green" /> : null}
            </View>
          </View>
          <Text style={styles.summary}>{p.summary}</Text>
          <ReadinessBar value={p.readiness} />
          <Text style={styles.hint}>{p.readiness}% of core skills</Text>
        </Card>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21, marginBottom: 6 },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { fontSize: 28 },
  title: { color: t.ink, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  summary: { color: t.inkSoft, fontSize: 13, lineHeight: 19, marginVertical: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: t.sunken, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: t.violet },
  hint: { color: t.inkFaint, fontSize: 12, marginTop: 6 },
})
