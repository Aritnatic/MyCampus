import { useLocalSearchParams } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { request } from '../../api'
import { Async, Button, Card, Chip, RichText, formatDate, useToast } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { tokens as t, themed } from '../../theme'

export default function EventDetail() {
  const { id } = useLocalSearchParams()
  const toast = useToast()
  const { data: e, loading, error, reload } = useApi(`/content/events/${id}`)
  const reg = useApi(e ? `/events/${id}/registration` : null)
  const r = reg.data

  const act = async (method, done) => {
    try {
      await request(`/events/${id}/register`, { method })
      toast.show(done, 'success')
    } catch (err) {
      toast.show(err.message, 'error')
    }
    reg.reload()
    reload()
  }

  const closed = e && e.registrationDeadline && new Date(e.registrationDeadline) < new Date()
  const over = e?.status === 'past'

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Async loading={loading} error={error} onRetry={reload}>
        {e && (
          <>
            <View style={styles.chips}>
              <Chip label={e.type} tone="blue" />
              {over ? <Chip label="Finished" /> : null}
            </View>
            <Text style={styles.title}>{e.title}</Text>
            <Card style={{ gap: 6 }}>
              <Text style={styles.meta}>📅 {formatDate(e.startDate)}{e.endDate && e.endDate.slice(0, 10) !== e.startDate.slice(0, 10) ? ` – ${formatDate(e.endDate)}` : ''}</Text>
              {e.location ? <Text style={styles.meta}>📍 {e.location}</Text> : null}
              {e.maxParticipants ? <Text style={styles.meta}>👥 {e.registeredCount ?? 0} of {e.maxParticipants} places taken</Text> : e.registeredCount ? <Text style={styles.meta}>👥 {e.registeredCount} registered</Text> : null}
              {e.registrationDeadline ? <Text style={styles.meta}>⏰ Register by {formatDate(e.registrationDeadline)}</Text> : null}
            </Card>

            {!over && (
              <View style={{ gap: 8 }}>
                {r?.status === 'registered' ? (
                  <>
                    <Chip label="You're registered" tone="green" />
                    <Button label="Cancel registration" variant="secondary" onPress={() => act('DELETE', 'Registration cancelled')} />
                  </>
                ) : r?.status === 'waitlist' ? (
                  <>
                    <Chip label="You're on the waitlist" tone="yellow" />
                    <Text style={styles.hint}>We’ll let you know if a place opens up.</Text>
                    <Button label="Leave waitlist" variant="secondary" onPress={() => act('DELETE', 'Left the waitlist')} />
                  </>
                ) : closed ? (
                  <Text style={styles.hint}>Registration for this event has closed.</Text>
                ) : (
                  <Button label={r?.full ? 'Join waitlist' : 'Register'} icon="ticket-outline" loading={reg.loading && !r} onPress={() => act('POST', r?.full ? 'Added to the waitlist' : 'You’re registered')} />
                )}
              </View>
            )}

            <RichText text={e.longDescription ?? e.description} />
            {e.tags?.length ? <View style={styles.tags}>{e.tags.map((tag) => <Chip key={tag} label={tag} />)}</View> : null}
          </>
        )}
      </Async>
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  chips: { flexDirection: 'row', gap: 6 },
  title: { color: t.ink, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  meta: { color: t.inkSoft, fontSize: 14 },
  hint: { color: t.inkFaint, fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
}))
