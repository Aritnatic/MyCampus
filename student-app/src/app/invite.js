import { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { request } from '../api'
import { Async, Avatar, Button, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { branchCode } from '../utils'
import { tokens as t, radius, themed } from '../theme'

// Invite people to a project or startup you started: search your college's students, or invite anyone by the
// MyCampus ID they share with you. They accept or decline from their Inbox.
export default function Invite() {
  const { kind, id, title } = useLocalSearchParams()
  const { user } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [byId, setById] = useState('')
  const [busy, setBusy] = useState(null)
  useEffect(() => { const h = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(h) }, [q])

  const people = useApi(user.university ? `/directory/students?limit=60&q=${encodeURIComponent(debounced)}` : null)
  const sent = useApi(`/invites/for/${kind}/${id}`)
  const statusOf = (personId) => (sent.data ?? []).find((r) => r.to?.id === personId && r.status !== 'cancelled' && r.status !== 'declined')?.status

  const invite = async (to, name) => {
    setBusy(to)
    try {
      await request('/invites', { method: 'POST', body: { targetKind: kind, targetId: id, to } })
      toast.show(`Invite sent${name ? ` to ${name.split(' ')[0]}` : ''}`, 'success')
      setById('')
      sent.reload()
    } catch (e) {
      toast.show(e.message, 'error')
    }
    setBusy(null)
  }
  const cancel = async (inviteId) => {
    try { await request(`/invites/${inviteId}/cancel`, { method: 'POST' }); sent.reload() } catch (e) { toast.show(e.message, 'error') }
  }

  const waiting = (sent.data ?? []).filter((r) => r.status === 'pending')
  const list = (people.data?.items ?? []).filter((p) => !p.isMe)

  return (
    <>
      <Stack.Screen options={{ title: 'Invite people' }} />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 6 }}>
            <Text style={styles.intro}>Invite people to <Text style={{ fontWeight: '800', color: t.ink }}>{title || 'your listing'}</Text>. They get a notification and choose to join.</Text>

            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Invite by MyCampus ID</Text>
              <View style={styles.idRow}>
                <TextInput style={[styles.input, { flex: 1 }]} value={byId} onChangeText={setById} placeholder="MC-XXXX-XXXX" placeholderTextColor={t.inkFaint} autoCapitalize="characters" autoCorrect={false} accessibilityLabel="MyCampus ID" />
                <Button label="Invite" compact onPress={() => invite(byId.trim())} disabled={!/^MC-[0-9A-F]{4}-[0-9A-F]{4}$/i.test(byId.trim())} loading={busy === byId.trim()} />
              </View>
              <Text style={styles.hint}>Anyone can find theirs on the Me tab. Works for students at other colleges too.</Text>
            </View>

            {waiting.length ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Waiting for an answer</Text>
                {waiting.map((r) => (
                  <View key={r.id} style={styles.row}>
                    <Avatar name={r.to?.name} size={32} />
                    <Text style={[styles.name, { flex: 1 }]}>{r.to?.name}</Text>
                    <Pressable onPress={() => cancel(r.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Cancel invite to ${r.to?.name}`}><Text style={styles.cancel}>Cancel</Text></Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {user.university ? (
              <View style={styles.search}>
                <Ionicons name="search" size={16} color={t.inkFaint} />
                <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Search your college by name or skill" placeholderTextColor={t.inkFaint} autoCorrect={false} accessibilityLabel="Search students" />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={user.university ? <Async loading={people.loading} error={people.error} onRetry={people.reload} emptyIcon="people-outline" emptyTitle="No one found" empty="Try another name or skill." /> : null}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: p }) => {
          const st = statusOf(p.id)
          return (
            <View style={styles.row}>
              <Avatar name={p.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{[branchCode(p.branch), p.year && `Year ${p.year}`, (p.skills ?? []).slice(0, 3).join(', ')].filter(Boolean).join(' · ')}</Text>
              </View>
              {st === 'accepted' ? <Text style={styles.done}>Joined</Text> : st === 'pending' ? <Text style={styles.done}>Invited</Text> : (
                <Button label="Invite" compact onPress={() => invite(p.id, p.name)} loading={busy === p.id} />
              )}
            </View>
          )
        }}
      />
    </>
  )
}

const styles = themed(() => StyleSheet.create({
  list: { padding: 16, paddingBottom: 48 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '700' },
  hint: { color: t.inkFaint, fontSize: 12 },
  idRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.sunken, borderRadius: radius.button, borderWidth: 1, borderColor: t.hairline, paddingHorizontal: 12 },
  input: { flex: 1, color: t.ink, paddingVertical: 12, paddingHorizontal: 4, fontSize: 14, backgroundColor: t.sunken, borderRadius: radius.button },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline },
  name: { color: t.ink, fontSize: 15, fontWeight: '700' },
  meta: { color: t.inkSoft, fontSize: 12, marginTop: 2 },
  cancel: { color: t.red, fontSize: 13, fontWeight: '700' },
  done: { color: t.greenText ?? t.green, fontSize: 13, fontWeight: '700' },
}))
