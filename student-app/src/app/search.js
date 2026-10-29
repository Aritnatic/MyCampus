import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Async, Card, Field } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { KIND_ICON, hrefFor } from '../links'
import { tokens as t, themed } from '../theme'

const IDEAS = ['machine learning projects', 'hardware co-founder', 'internships for CSE', 'IoT research', 'data structures notes']

export default function Search() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(id)
  }, [q])

  const ready = debounced.length >= 2
  const { data, loading, error, reload } = useApi(ready ? `/search?q=${encodeURIComponent(debounced)}` : null)

  return (
    <FlatList
      data={ready ? data ?? [] : []}
      keyExtractor={(h) => `${h.kind}:${h.id}`}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Field value={q} onChangeText={setQ} placeholder="Search projects, people, notices, notes…" autoFocus returnKeyType="search" autoCorrect={false} accessibilityLabel="Search" />}
      ListEmptyComponent={
        ready ? (
          <Async loading={loading} error={error} onRetry={reload} emptyIcon="search-outline" emptyTitle={`Nothing found for “${debounced}”`} empty="Try different words — search understands things like “ml” and “internship”." skeletons={4} />
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text style={styles.tryTitle}>Try searching for</Text>
            {IDEAS.map((idea) => (
              <Pressable key={idea} onPress={() => setQ(idea)} accessibilityRole="button" accessibilityLabel={`Search for ${idea}`} style={styles.idea}>
                <Ionicons name="search-outline" size={16} color={t.inkFaint} />
                <Text style={styles.ideaText}>{idea}</Text>
              </Pressable>
            ))}
          </View>
        )
      }
      renderItem={({ item: h }) => {
        const href = hrefFor(h.kind, h.id)
        return (
          <Card onPress={href ? () => router.push(href) : undefined} accessibilityLabel={`${h.title}. ${h.subtitle}`}>
            <View style={styles.hit}>
              <View style={styles.icon}><Ionicons name={KIND_ICON[h.kind] ?? 'ellipse-outline'} size={18} color={t.violetText} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{h.title}</Text>
                <Text style={styles.sub}>{h.subtitle}</Text>
              </View>
            </View>
          </Card>
        )
      }}
    />
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  tryTitle: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  idea: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  ideaText: { color: t.ink, fontSize: 15 },
  hit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: t.ink, fontSize: 15, fontWeight: '600' },
  sub: { color: t.inkFaint, fontSize: 12, marginTop: 2 },
}))
