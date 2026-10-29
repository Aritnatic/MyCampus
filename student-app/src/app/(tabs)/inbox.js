import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { request } from '../../api'
import { Async, Avatar, Button, Card, Chip, Segmented, timeAgo, useToast } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { setUnread } from '../../unread'
import { tokens as t, themed } from '../../theme'

const ICONS = {
  notice: 'newspaper-outline', result: 'ribbon-outline', exam: 'calendar-outline', event: 'ticket-outline', job: 'briefcase-outline',
  alert: 'warning-outline', announcement: 'megaphone-outline', connection_request: 'person-add-outline', connection_accepted: 'checkmark-circle-outline',
  collab_request: 'people-outline', collab_accepted: 'checkmark-circle-outline', collab_declined: 'close-circle-outline', event_seat: 'ticket-outline',
  guidance_accepted: 'school-outline', guidance_declined: 'school-outline',
}

// Where tapping a notification should take you. Types without a screen yet just get marked read.
function routeFor(n) {
  const d = n.data ?? {}
  if (n.type === 'notice' && d.noticeId) return `/notice/${d.noticeId}`
  if ((n.type === 'event' || n.type === 'event_seat') && d.eventId) return `/event/${d.eventId}`
  if (n.type === 'exam' || n.type === 'result') return '/exams'
  if (n.type === 'job' && d.jobId) return `/discover/jobs/${d.jobId}`
  if ((n.type === 'collab_accepted' || n.type === 'collab_declined') && d.targetId) return `/discover/${d.targetKind === 'research' ? 'research' : `${d.targetKind}s`}/${d.targetId}`
  if (n.type === 'connection_accepted' && d.userId) return `/discover/people/${d.userId}`
  if ((n.type === 'guidance_accepted' || n.type === 'guidance_declined') && d.facultyId) return `/discover/faculty/${d.facultyId}`
  return null
}

// People asking to connect, and people asking to join what you started.
function Requests() {
  const toast = useToast()
  const router = useRouter()
  const connections = useApi('/connections')
  const collab = useApi('/collab')
  const loading = connections.loading || collab.loading
  const error = connections.error || collab.error
  const reload = () => { connections.reload(); collab.reload() }

  const incoming = connections.data?.incoming ?? []
  const joins = (collab.data?.received ?? []).filter((r) => r.status === 'pending')
  const sent = [
    ...(connections.data?.outgoing ?? []).map((c) => ({ key: c.id, text: `${c.kind === 'mentor' ? 'Mentor request to' : 'Connection request to'} ${c.person.name}`, status: 'pending' })),
    ...(collab.data?.sent ?? []).map((r) => ({ key: r.id, text: `Join request: ${r.target?.title ?? 'a listing'}`, status: r.status })),
  ].filter((x) => x.status !== 'withdrawn')

  const act = async (path, ok) => {
    try {
      await request(path, { method: 'POST' })
      toast.show(ok, 'success')
    } catch (e) {
      toast.show(e.message, 'error')
    }
    reload()
  }

  const nothing = !incoming.length && !joins.length && !sent.length
  return (
    <View style={{ gap: 10 }}>
      <Async loading={loading && nothing} error={error} onRetry={reload} emptyIcon="people-outline" emptyTitle="No requests yet" empty={nothing && 'When someone asks to connect, or to join your project, it shows up here. Find people in Discover.'}>
        {incoming.map((c) => (
          <Card key={c.id}>
            <View style={styles.row}>
              <Avatar name={c.person.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} onPress={() => router.push(`/discover/people/${c.person.id}`)}>{c.person.name}</Text>
                <Text style={styles.body}>{c.kind === 'mentor' ? 'Wants you to mentor them' : 'Wants to connect'}{c.message ? `: “${c.message}”` : ''}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Button label="Accept" compact style={{ flex: 1 }} onPress={() => act(`/connections/${c.id}/accept`, 'Connected')} />
              <Button label="Decline" variant="secondary" compact style={{ flex: 1 }} onPress={() => act(`/connections/${c.id}/decline`, 'Request declined')} />
            </View>
          </Card>
        ))}
        {joins.map((r) => (
          <Card key={r.id}>
            <View style={styles.row}>
              <Avatar name={r.from?.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{r.from?.name} wants to join {r.target?.title}</Text>
                <Text style={styles.body}>{r.role ? `As: ${r.role}. ` : ''}“{r.message}”</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Button label="Accept" compact style={{ flex: 1 }} onPress={() => act(`/collab/${r.id}/accept`, 'Added to your team')} />
              <Button label="Decline" variant="secondary" compact style={{ flex: 1 }} onPress={() => act(`/collab/${r.id}/decline`, 'Request declined')} />
            </View>
          </Card>
        ))}
        {sent.length > 0 && <Text style={[styles.body, { marginTop: 8, fontWeight: '600' }]}>Sent by you</Text>}
        {sent.map((x) => (
          <Card key={x.key}>
            <View style={styles.row}>
              <Text style={[styles.body, { flex: 1 }]}>{x.text}</Text>
              <Chip label={x.status === 'accepted' ? 'accepted' : x.status === 'declined' ? 'declined' : 'waiting'} tone={x.status === 'accepted' ? 'green' : x.status === 'declined' ? 'red' : 'neutral'} />
            </View>
          </Card>
        ))}
      </Async>
    </View>
  )
}

export default function Inbox() {
  const [tab, setTab] = useState('updates')
  const router = useRouter()
  const { data, loading, error, refreshing, reload } = useApi('/notifications?limit=50')
  const items = data?.items ?? []
  useEffect(() => { if (data) setUnread(data.unread) }, [data])

  const open = useCallback(async (n) => {
    if (!n.read) {
      request(`/notifications/${n.id}/read`, { method: 'POST' }).then(reload).catch(() => {})
    }
    if (n.type === 'connection_request' || n.type === 'collab_request') return setTab('requests')
    const href = routeFor(n)
    if (href) router.push(href)
  }, [reload, router])

  const readAll = async () => {
    await request('/notifications/read-all', { method: 'POST' }).catch(() => {})
    reload()
  }

  if (tab === 'requests') {
    return (
      <FlatList
        data={[]}
        renderItem={null}
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <View style={{ gap: 14 }}>
            <Segmented value={tab} onChange={setTab} options={[{ value: 'updates', label: 'Updates' }, { value: 'requests', label: 'Requests' }]} />
            <Requests />
          </View>
        )}
      />
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={t.violetText} />}
      ListHeaderComponent={(
        <View style={{ gap: 10 }}>
          <Segmented value={tab} onChange={setTab} options={[{ value: 'updates', label: 'Updates' }, { value: 'requests', label: 'Requests' }]} />
          {data?.unread > 0 ? <Button label={`Mark ${data.unread} as read`} variant="ghost" compact onPress={readAll} style={{ alignSelf: 'flex-end' }} /> : null}
        </View>
      )}
      ListEmptyComponent={
        <Async
          loading={loading}
          error={error}
          onRetry={reload}
          emptyIcon="notifications-off-outline"
          emptyTitle="You're all caught up"
          empty="Notices, results, exam changes and replies will show up here."
        />
      }
      renderItem={({ item: n }) => (
        <Card onPress={() => open(n)} accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}`} style={!n.read && { borderColor: t.violet }}>
          <View style={styles.row}>
            <View style={[styles.iconTile, n.read && { backgroundColor: t.sunken }]}>
              <Ionicons name={ICONS[n.type] ?? 'notifications-outline'} size={20} color={n.read ? t.inkFaint : t.violetText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, n.read && { color: t.inkSoft, fontWeight: '500' }]}>{n.title}</Text>
              {n.body ? <Text style={styles.body} numberOfLines={2}>{n.body}</Text> : null}
              <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
            </View>
            {!n.read ? <View style={styles.dot} /> : null}
          </View>
        </Card>
      )}
    />
  )
}

const styles = themed(() => StyleSheet.create({
  iconTile: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { color: t.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  body: { color: t.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 2 },
  time: { color: t.inkFaint, fontSize: 11, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.violet, marginTop: 6 },
}))
