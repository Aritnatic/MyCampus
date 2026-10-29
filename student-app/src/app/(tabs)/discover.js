import { useRouter } from 'expo-router'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SectionHeader } from '../../components/ui'
import { HubTile, ListRow } from '../../components/profile'
import { useApi } from '../../hooks/useApi'
import { KINDS, KIND_ORDER } from '../../discovery'
import { hrefFor } from '../../links'
import { tokens as t, themed } from '../../theme'

const nameOf = (m) => m.item.title ?? m.item.name

// "Suggested for you": the best few matches across everything, with the reason each one fits.
function suggestions(matches) {
  if (!matches) return []
  const take = (list, kind, n) => (list ?? []).slice(0, n).map((m) => ({ ...m, kind }))
  return [...take(matches.people, 'people', 1), ...take(matches.projects, 'project', 1), ...take(matches.research, 'research', 1), ...take(matches.faculty, 'faculty', 1)]
}
const KIND_TO_ROUTE = { people: 'people', project: 'projects', research: 'research', faculty: 'faculty', startup: 'startups', job: 'jobs' }

export default function Discover() {
  const router = useRouter()
  const matches = useApi('/matches')
  const picks = suggestions(matches.data)

  return (
    <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={matches.refreshing} onRefresh={matches.reload} tintColor={t.violetText} />}>
      <Text style={styles.lead}>Find people, projects and opportunities that fit your skills.</Text>

      <Pressable onPress={() => router.push('/search')} accessibilityRole="search" accessibilityLabel="Search everything" style={styles.search}>
        <Ionicons name="search" size={18} color={t.inkFaint} />
        <Text style={styles.searchText}>Search anything in natural language…</Text>
      </Pressable>

      <View style={styles.grid}>
        {KIND_ORDER.map((key) => (
          <HubTile key={key} icon={KINDS[key].icon} tone={KINDS[key].tone} label={KINDS[key].label} body={KINDS[key].hint} onPress={() => router.push(`/discover/${key}`)} />
        ))}
      </View>

      <Pressable onPress={() => router.push('/discover/people?mentors=1')} accessibilityRole="button" accessibilityLabel="Find a mentor" style={styles.mentor}>
        <View style={styles.mentorIcon}><Ionicons name="school-outline" size={22} color={t.violetText} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mentorTitle}>Find a mentor</Text>
          <Text style={styles.mentorBody}>Seniors and experienced students open to guiding you, on any campus.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.inkFaint} />
      </Pressable>

      {picks.length > 0 && (
        <>
          <SectionHeader title="Suggested for you" />
          <View style={{ gap: 10 }}>
            {picks.map((m) => {
              const route = KIND_TO_ROUTE[m.kind]
              const k = KINDS[route]
              const s = k.summary(m.item)
              return (
                <ListRow
                  key={`${m.kind}:${m.item.id}`}
                  name={route === 'people' ? m.item.name : undefined}
                  icon={k.icon}
                  tone={k.tone}
                  title={nameOf(m)}
                  subtitle={s.subtitle}
                  blurb={m.reasons[0]}
                  onPress={() => router.push(hrefFor(m.kind, m.item.id))}
                />
              )
            })}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  lead: { color: t.inkSoft, fontSize: 14, lineHeight: 20 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.sunken, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, marginTop: 14, borderWidth: 1, borderColor: t.hairline },
  searchText: { color: t.inkFaint, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 18 },
  mentor: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, backgroundColor: t.violetSoft, borderRadius: 14, borderWidth: 1, borderColor: t.violet, padding: 14 },
  mentorIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
  mentorTitle: { color: t.ink, fontSize: 15.5, fontWeight: '800' },
  mentorBody: { color: t.inkSoft, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
}))
