import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { request } from '../api'
import { Async, Avatar, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { branchCode } from '../utils'
import { tokens as t, radius, themed } from '../theme'

// Everyone verified at your college, A–Z. Search by name, MyCampus ID or skill; filter by branch and year.
const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE']
const PAGE = 40

export default function Students() {
  const router = useRouter()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState(0)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { const h = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(h) }, [q])

  // New search or filter: start again from page 1. Scrolling to the end loads the next page.
  const load = async (p) => {
    if (!user.university) return
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE), ...(debounced && { q: debounced }), ...(branch && { branch }), ...(year && { year: String(year) }) })
      const res = await request(`/directory/students?${params}`)
      setItems((cur) => (p === 1 ? res.items : [...cur, ...res.items]))
      setTotal(res.total); setPage(p)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }
  useEffect(() => { load(1) }, [debounced, branch, year]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user.university) {
    return (
      <View style={styles.center}>
        <Ionicons name="school-outline" size={40} color={t.violetText} />
        <Text style={styles.title}>Join your college to see its students</Text>
        <Button label="Join your college" onPress={() => router.push('/join')} />
      </View>
    )
  }

  const chip = (on, label, onPress) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && { color: t.violetText }]}>{label}</Text>
    </Pressable>
  )

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (!loading && items.length < total) load(page + 1) }}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 6 }}>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={t.inkFaint} />
            <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Name, skill or MyCampus ID" placeholderTextColor={t.inkFaint} autoCorrect={false} accessibilityLabel="Search students" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {chip(!branch, 'All branches', () => setBranch(''))}
            {BRANCHES.map((b) => chip(branch === b, b, () => setBranch(branch === b ? '' : b)))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {chip(!year, 'All years', () => setYear(0))}
            {[1, 2, 3, 4].map((y) => chip(year === y, `Year ${y}`, () => setYear(year === y ? 0 : y)))}
          </ScrollView>
          {!loading || items.length ? <Text style={styles.count}>{total} student{total === 1 ? '' : 's'}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={() => load(1)} emptyIcon="people-outline" emptyTitle="No one found" empty="Try another name, or clear the filters." />}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item: p }) => (
        <Pressable onPress={() => router.push(p.isMe ? '/me' : `/discover/people/${p.id}`)} accessibilityRole="button" accessibilityLabel={p.name} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
          <Avatar name={p.name} size={42} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{p.name}{p.isMe ? '  (you)' : ''}</Text>
            <Text style={styles.meta} numberOfLines={1}>{[branchCode(p.branch), p.year && `Year ${p.year}`, (p.skills ?? []).slice(0, 3).join(', ')].filter(Boolean).join(' · ')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={t.inkFaint} />
        </Pressable>
      )}
    />
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  title: { color: t.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.sunken, borderRadius: radius.button, borderWidth: 1, borderColor: t.hairline, paddingHorizontal: 12 },
  input: { flex: 1, color: t.ink, paddingVertical: 12, fontSize: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  chipOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  chipText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  count: { color: t.inkFaint, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline },
  name: { color: t.ink, fontSize: 15, fontWeight: '700' },
  meta: { color: t.inkSoft, fontSize: 12, marginTop: 2 },
}))
