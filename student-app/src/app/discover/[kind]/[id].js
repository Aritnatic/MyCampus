import { useLocalSearchParams } from 'expo-router'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Async, Card, Chip, RichText } from '../../../components/ui'
import { useApi } from '../../../hooks/useApi'
import { DetailActions } from '../../../components/DetailActions'
import { KINDS } from '../../../discovery'
import { tokens as t, radius } from '../../../theme'

export default function DiscoverDetail() {
  const { kind, id } = useLocalSearchParams()
  const { data: item, loading, error, reload } = useApi(`/discover/${kind}/${id}`)
  if (!item) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Async loading={loading} error={error} onRetry={reload} />
      </ScrollView>
    )
  }
  const d = KINDS[kind].detail(item)

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {d.badge ? <Chip label={d.badge} tone="green" /> : null}
      <Text style={styles.title}>{d.title}</Text>
      <Text style={styles.sub}>{d.subtitle}</Text>

      <View style={styles.facts}>
        {d.facts.map(([label, value]) => (
          <View key={label} style={styles.fact}>
            <Text style={styles.factValue} numberOfLines={1}>{String(value ?? '—')}</Text>
            <Text style={styles.factLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <DetailActions kind={kind} item={item} />

      {d.email ? (
        <Pressable onPress={() => Linking.openURL(`mailto:${d.email}`)} style={styles.cta}>
          <Text style={styles.ctaText}>Email {d.email}</Text>
        </Pressable>
      ) : null}

      <RichText text={d.body} />

      {d.groups.filter((g) => g.items?.length).map((g) => (
        <View key={g.title} style={{ gap: 8 }}>
          <Text style={styles.section}>{g.title}</Text>
          {g.list ? (
            <Card style={{ gap: 8 }}>{g.items.map((x) => <Text key={x} style={styles.li}>• {x}</Text>)}</Card>
          ) : (
            <View style={styles.wrap}>{g.items.map((x) => <Chip key={x} label={x} tone={g.tone} />)}</View>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },
  title: { color: t.ink, fontSize: 24, fontWeight: '800', lineHeight: 30 },
  sub: { color: t.inkSoft, fontSize: 14, marginTop: -8 },
  facts: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.hairline, borderRadius: 10, padding: 10, alignItems: 'center' },
  factValue: { color: t.ink, fontSize: 14, fontWeight: '700' },
  factLabel: { color: t.inkFaint, fontSize: 11, marginTop: 2 },
  cta: { backgroundColor: t.violet, borderRadius: radius.button, paddingVertical: 13, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
  section: { color: t.ink, fontSize: 16, fontWeight: '700', marginTop: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  li: { color: t.inkSoft, fontSize: 14, lineHeight: 20 },
})
