import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { request } from '../api'
import { Async, Button, Card, Chip, Field, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { openNoteFile } from '../files'
import { useApi } from '../hooks/useApi'
import { tokens as t } from '../theme'

function Stars({ value, onPick, disabled }) {
  return (
    <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating ${value || 'none'} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onPick(n)} disabled={disabled} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Rate ${n} out of 5`}>
          <Ionicons name={n <= Math.round(value) ? 'star' : 'star-outline'} size={18} color={n <= Math.round(value) ? t.yellowText : t.inkFaint} />
        </Pressable>
      ))}
    </View>
  )
}

export default function Notes() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const { data, loading, error, refreshing, reload } = useApi('/content/notes')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data ?? []).filter((n) => !needle || [n.title, n.subject, ...(n.tags ?? [])].some((s) => String(s).toLowerCase().includes(needle)))
  }, [q, data])

  const download = async (n) => {
    setBusy(n.id)
    try {
      await openNoteFile(n)
      reload()
    } catch (e) {
      toast.show(e.message, 'error')
    }
    setBusy(null)
  }
  const rate = async (n, rating) => {
    try {
      await request(`/notes/${n.id}/rate`, { method: 'POST', body: { rating } })
      toast.show('Thanks for rating', 'success')
      reload()
    } catch (e) {
      toast.show(e.message, 'error')
    }
  }
  const remove = (n) => {
    const doIt = async () => {
      try {
        await request(`/notes/${n.id}`, { method: 'DELETE' })
        toast.show('Note deleted', 'success')
        reload()
      } catch (e) {
        toast.show(e.message, 'error')
      }
    }
    if (Platform.OS === 'web') { if (globalThis.confirm?.('Delete this note?')) doIt() } else Alert.alert('Delete this note?', 'It will be removed for everyone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: doIt }])
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      onRefresh={reload}
      refreshing={refreshing}
      ListHeaderComponent={(
        <View style={{ gap: 10 }}>
          <Field value={q} onChangeText={setQ} placeholder="Search notes, subjects, tags" autoCorrect={false} accessibilityLabel="Search notes" />
          {user.role === 'student' ? <Button label="Share your notes" icon="cloud-upload-outline" variant="secondary" compact onPress={() => router.push('/note-new')} /> : null}
        </View>
      )}
      ListEmptyComponent={<Async loading={loading} error={error} onRetry={reload} emptyIcon="book-outline" emptyTitle={q ? 'No notes match' : 'No notes yet'} empty={q ? `Nothing matches “${q}”.` : 'Be the first to share notes for a subject.'} />}
      renderItem={({ item: n }) => {
        const mine = n.uploadedById === user.id
        return (
          <Card>
            <View style={styles.row}>
              <Text style={styles.code}>{n.subject}</Text>
              {n.hasFile ? <Chip label={n.fileType} tone="blue" /> : <Chip label="no file" />}
            </View>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.meta}>by {n.uploadedBy}{n.pages ? ` · ${n.pages} pages` : ''}{n.fileSize ? ` · ${n.fileSize}` : ''}</Text>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Stars value={n.rating} onPick={(v) => rate(n, v)} disabled={mine} />
              <Text style={styles.meta}>{n.reviews ? `${n.rating} (${n.reviews})` : 'Not rated yet'} · {n.downloads ?? 0} downloads</Text>
            </View>
            <View style={styles.actions}>
              {n.hasFile ? <Button label="Download" icon="download-outline" compact loading={busy === n.id} onPress={() => download(n)} style={{ flex: 1 }} /> : null}
              {mine ? <Button label="Delete" variant="danger" compact onPress={() => remove(n)} /> : null}
            </View>
          </Card>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { color: t.violetText, fontSize: 12, fontWeight: '700' },
  title: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 6 },
  meta: { color: t.inkSoft, fontSize: 12, marginTop: 4 },
  stars: { flexDirection: 'row', gap: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
})
