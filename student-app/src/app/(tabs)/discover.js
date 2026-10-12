import { useEffect, useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Async, Button, Card, Chip, Segmented } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { KINDS, KIND_ORDER } from '../../discovery'
import { tokens as t, radius } from '../../theme'

export default function Discover() {
  const router = useRouter()
  const { user } = useAuth()
  const [kind, setKind] = useState('people')
  const [scope, setScope] = useState('campus')
  const [q, setQ] = useState('')
  const [mentorsOnly, setMentorsOnly] = useState(false)
  const [debounced, setDebounced] = useState('')
  const k = KINDS[kind]

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(id)
  }, [q])

  const { data, loading, error, reload } = useApi(
    `/discover/${kind}?scope=${kind === 'faculty' ? 'campus' : scope}&q=${encodeURIComponent(debounced)}${kind === 'people' && mentorsOnly ? '&mentors=1' : ''}`,
  )
  const items = data ?? []

  return (
    <FlatList
      data={items}
      keyExtractor={({ item }) => item.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {KIND_ORDER.map((key) => {
              const on = key === kind
              return (
                <Pressable key={key} onPress={() => setKind(key)} style={[styles.pill, on && styles.pillOn]}>
                  <Ionicons name={KINDS[key].icon} size={15} color={on ? t.violetText : t.inkSoft} />
                  <Text style={[styles.pillText, on && { color: t.violetText }]}>{KINDS[key].label}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={t.inkFaint} />
            <TextInput
              style={styles.input}
              placeholder={`Search ${k.label.toLowerCase()} by name, skill or interest`}
              placeholderTextColor={t.inkFaint}
              value={q}
              onChangeText={setQ}
              autoCorrect={false}
            />
          </View>
          {kind === 'people' && (
            <Pressable onPress={() => setMentorsOnly((m) => !m)} accessibilityRole="switch" accessibilityState={{ checked: mentorsOnly }} accessibilityLabel="Show only mentors" style={[styles.pill, mentorsOnly && styles.pillOn, { alignSelf: 'flex-start' }]}>
              <Ionicons name={mentorsOnly ? 'checkmark-circle' : 'school-outline'} size={15} color={mentorsOnly ? t.violetText : t.inkSoft} />
              <Text style={[styles.pillText, mentorsOnly && { color: t.violetText }]}>Mentors only</Text>
            </Pressable>
          )}
          {kind === 'projects' && user.role === 'student' && (
            <Button label="Start a project" icon="add-circle-outline" variant="secondary" compact onPress={() => router.push('/project-new')} />
          )}
          {kind !== 'faculty' && (
            <Segmented
              value={scope}
              onChange={setScope}
              options={[{ value: 'campus', label: 'My campus' }, { value: 'all', label: 'All universities' }]}
            />
          )}
        </View>
      }
      ListEmptyComponent={
        <Async
          loading={loading}
          error={error}
          onRetry={reload}
          empty={`Nothing found${debounced ? ` for “${debounced}”` : ''}. Try “All universities”.`}
        />
      }
      renderItem={({ item: { item, score } }) => {
        const s = k.summary(item)
        return (
          <Card onPress={() => router.push(`/discover/${kind}/${item.id}`)}>
            {score > 0 && <Chip label={`${score} match${score > 1 ? 'es' : ''} with you`} tone="green" />}
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.sub}>{s.subtitle}</Text>
            <Text style={styles.blurb} numberOfLines={2}>{s.blurb}</Text>
            <View style={styles.chips}>{s.chips.map((c) => <Chip key={c} label={c} tone="violet" />)}</View>
          </Card>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: t.sunken },
  pillOn: { backgroundColor: t.violetSoft },
  pillText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.sunken, borderRadius: radius.button, paddingHorizontal: 12 },
  input: { flex: 1, color: t.ink, paddingVertical: 12, fontSize: 14 },
  title: { color: t.ink, fontSize: 16, fontWeight: '700', marginTop: 8 },
  sub: { color: t.violetText, fontSize: 12, marginTop: 3 },
  blurb: { color: t.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  empty: { color: t.inkFaint, textAlign: 'center', marginTop: 32 },
})
