import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Async, Card, Chip, SectionHeader } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { ReadinessBar } from '../career'
import { tokens as t, themed } from '../../theme'

export default function CareerDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { data: p, loading, error, reload } = useApi(`/career/paths/${id}`)

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Async loading={loading} error={error} onRetry={reload} skeletons={2}>
        {p && (
          <>
            <Text style={styles.icon}>{p.icon}</Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.summary}>{p.summary}</Text>

            <Card style={{ gap: 8 }}>
              <Text style={styles.cardTitle}>You have {p.readiness}% of the core skills</Text>
              <ReadinessBar value={p.readiness} />
              <Text style={styles.hint}>Only you can see this. It compares your profile to the path, not to other students.</Text>
            </Card>

            <SectionHeader title="Core skills" />
            <View style={styles.wrap}>
              {p.core.have.map((s) => <Chip key={s} label={p.core.via[s] ? `${s} ✓ via ${p.core.via[s]}` : `${s} ✓`} tone="green" />)}
              {p.core.missing.map((s) => <Chip key={s} label={s} tone="yellow" />)}
            </View>

            <SectionHeader title="To stand out" />
            <View style={styles.wrap}>
              {p.advanced.have.map((s) => <Chip key={s} label={`${s} ✓`} tone="green" />)}
              {p.advanced.missing.map((s) => <Chip key={s} label={s} />)}
            </View>

            <SectionHeader title="Roadmap" />
            <View style={{ gap: 10 }}>
              {p.roadmap.map((step, i) => (
                <Card key={step.stage} style={{ gap: 6 }}>
                  <Text style={styles.stage}>{i + 1}. {step.stage}</Text>
                  <Text style={styles.cardTitle}>{step.focus}</Text>
                  {step.actions.map((a) => <Text key={a} style={styles.action}>• {a}</Text>)}
                </Card>
              ))}
            </View>

            {p.jobs.length > 0 && (
              <>
                <SectionHeader title="Hiring now for this path" />
                <View style={{ gap: 10 }}>
                  {p.jobs.map((j) => (
                    <Card key={j.id} onPress={() => router.push(`/discover/jobs/${j.id}`)}>
                      <Text style={styles.cardTitle}>{j.title}</Text>
                      <Text style={styles.hint}>{j.company}</Text>
                      {j.youHave.length > 0 && <Text style={styles.have}>You have: {j.youHave.join(', ')}</Text>}
                      {j.youNeed.length > 0 && <Text style={styles.need}>To learn: {j.youNeed.join(', ')}</Text>}
                    </Card>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </Async>
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 6 },
  icon: { fontSize: 36 },
  title: { color: t.ink, fontSize: 24, fontWeight: '800', marginTop: 6 },
  summary: { color: t.inkSoft, fontSize: 14, lineHeight: 21, marginVertical: 8 },
  cardTitle: { color: t.ink, fontSize: 15, fontWeight: '700' },
  hint: { color: t.inkFaint, fontSize: 12, lineHeight: 17 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stage: { color: t.violetText, fontSize: 12, fontWeight: '700' },
  action: { color: t.inkSoft, fontSize: 13, lineHeight: 19 },
  have: { color: t.greenText, fontSize: 12, marginTop: 6 },
  need: { color: t.yellowText, fontSize: 12, marginTop: 2 },
}))
