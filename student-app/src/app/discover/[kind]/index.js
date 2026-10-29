import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Async, Button, Segmented } from '../../../components/ui'
import { ListRow } from '../../../components/profile'
import { useAuth } from '../../../context/AuthContext'
import { useApi } from '../../../hooks/useApi'
import { KINDS } from '../../../discovery'
import { tokens as t, radius, themed } from '../../../theme'

// One category of Discover (people, projects…): search, filters and the results as rows.
export default function DiscoverList() {
  const { kind, mentors } = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [scope, setScope] = useState('campus')
  const [q, setQ] = useState('')
  const [mentorsOnly, setMentorsOnly] = useState(mentors === '1')
  const [debounced, setDebounced] = useState('')
  const k = KINDS[kind]

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(id)
  }, [q])

  const { data, loading, error, reload } = useApi(
    k ? `/discover/${kind}?scope=${kind === 'faculty' ? 'campus' : scope}&q=${encodeURIComponent(debounced)}${kind === 'people' && mentorsOnly ? '&mentors=1' : ''}` : null,
  )
  if (!k) return <Text style={styles.missing}>That category doesn’t exist.</Text>
  const items = data ?? []

  return (
    <>
      <Stack.Screen options={{ title: mentorsOnly && kind === 'people' ? 'Mentors' : k.label }} />
      <FlatList
        data={items}
        keyExtractor={({ item }) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View style={styles.search}>
              <Ionicons name="search" size={16} color={t.inkFaint} />
              <TextInput
                style={styles.input}
                placeholder={`Search ${k.label.toLowerCase()} by name, skill or interest`}
                placeholderTextColor={t.inkFaint}
                value={q}
                onChangeText={setQ}
                autoCorrect={false}
                accessibilityLabel={`Search ${k.label}`}
              />
            </View>
            {kind === 'people' ? (
              <View style={styles.filters}>
                <Button label={mentorsOnly ? 'Mentors only ✓' : 'Mentors only'} variant={mentorsOnly ? 'primary' : 'secondary'} compact onPress={() => setMentorsOnly((m) => !m)} style={{ minHeight: 32, paddingHorizontal: 12 }} />
              </View>
            ) : null}
            {kind === 'projects' && user.role === 'student' ? <Button label="Start a project" icon="add-circle-outline" variant="secondary" compact onPress={() => router.push('/project-new')} /> : null}
            {kind !== 'faculty' ? (
              <Segmented value={scope} onChange={setScope} options={[{ value: 'campus', label: 'My campus' }, { value: 'all', label: 'All universities' }]} />
            ) : null}
            {!loading && items.length > 0 ? <Text style={styles.count}>{items.length} {items.length === 1 ? 'result' : 'results'}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <Async loading={loading} error={error} onRetry={reload} emptyIcon={k.icon} emptyTitle="Nothing found" empty={`${debounced ? `Nothing matches “${debounced}”. ` : ''}Try “All universities”.`} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item: { item, score } }) => {
          const s = k.summary(item)
          return (
            <ListRow
              name={kind === 'people' ? item.name : undefined}
              icon={k.icon}
              tone={k.tone}
              title={s.title}
              subtitle={s.subtitle}
              blurb={score > 0 ? `${score} match${score > 1 ? 'es' : ''} with your skills · ${s.blurb ?? ''}` : s.blurb}
              chips={s.chips}
              onPress={() => router.push(`/discover/${kind}/${item.id}`)}
            />
          )
        }}
      />
    </>
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  missing: { color: t.inkSoft, padding: 24, textAlign: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.sunken, borderRadius: radius.button, borderWidth: 1, borderColor: t.hairline, paddingHorizontal: 12 },
  input: { flex: 1, color: t.ink, paddingVertical: 12, fontSize: 14 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { color: t.inkFaint, fontSize: 12, fontWeight: '600' },
}))
