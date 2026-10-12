import { useRouter } from 'expo-router'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Async, Button, Card, Chip, SectionHeader, formatDate } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { hrefFor } from '../../links'
import { missingProfile } from '../../profileCompleteness'
import { tokens as t } from '../../theme'

const CATEGORY_TONE = { academic: 'violet', safety: 'yellow', placement: 'green', general: 'blue' }
const byPinnedThenNewest = (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt)
const today = () => new Date().toISOString().slice(0, 10)

// "For you": the best few matches from each list, flattened into one short feed.
function picks(matches) {
  if (!matches) return []
  const take = (list, kind, n) => list.slice(0, n).map((m) => ({ ...m, kind }))
  return [...take(matches.projects, 'project', 2), ...take(matches.research, 'research', 1), ...take(matches.startups, 'startup', 1), ...take(matches.people, 'people', 1)]
}

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const notices = useApi('/content/notices')
  const events = useApi('/content/events')
  const exams = useApi(user.role === 'student' ? '/content/exams' : null)
  const matches = useApi('/matches')
  const all = [notices, events, exams, matches]
  const refreshing = all.some((q) => q.refreshing)
  const refresh = () => all.forEach((q) => q.reload?.())

  const upcomingExams = (exams.data ?? []).filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const upcomingEvents = (events.data ?? []).filter((e) => e.status === 'upcoming')
  const forYou = picks(matches.data)
  const gaps = missingProfile(user)

  return (
    <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.violetText} />}>
      <Text style={styles.hello}>Hi, {user.name.split(' ')[0]} 👋</Text>
      {user.branch ? <Text style={styles.sub}>{user.branch} · Semester {user.semester}</Text> : <Text style={styles.sub}>{user.role === 'student' ? 'Welcome to your campus' : 'Welcome to MyCampus'}</Text>}

      <Pressable onPress={() => router.push('/search')} accessibilityRole="search" accessibilityLabel="Search projects, people, notices and notes" style={styles.search}>
        <Ionicons name="search" size={18} color={t.inkFaint} />
        <Text style={styles.searchText}>Search projects, people, notices…</Text>
      </Pressable>

      {gaps.length > 0 && (
        <Card style={{ borderColor: t.violet, gap: 8, marginTop: 16 }}>
          <Text style={styles.cardTitle}>Finish your profile to get matches</Text>
          <Text style={{ color: t.inkSoft, fontSize: 13, lineHeight: 19 }}>Add your skills and what you’re looking for so we can suggest people, projects and mentors.</Text>
          <Button label="Set up profile" compact onPress={() => router.push('/profile-edit?onboarding=1')} />
        </Card>
      )}

      {upcomingExams.length > 0 && (
        <>
          <SectionHeader title="Coming up" action="Timetable" onAction={() => router.push('/exams')} />
          <View style={{ gap: 10 }}>
            {upcomingExams.map((e) => (
              <Card key={e.id} onPress={() => router.push('/exams')}>
                <View style={styles.row}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{new Date(`${e.date}T00:00:00`).getDate()}</Text>
                    <Text style={styles.dateMon}>{new Date(`${e.date}T00:00:00`).toLocaleString('en-IN', { month: 'short' })}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{e.subjectName}</Text>
                    <Text style={styles.meta}>{e.day} · {e.startTime}–{e.endTime}{e.room ? ` · ${e.room}` : ''}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      <SectionHeader title="Notices" action="See all" onAction={() => router.push('/notices')} />
      <Async loading={notices.loading && !notices.data} error={notices.error} onRetry={notices.reload} emptyIcon="newspaper-outline" emptyTitle="No notices yet" empty={notices.data?.length === 0 && 'Notices from your college will appear here.'}>
        <View style={{ gap: 10 }}>
          {[...(notices.data ?? [])].sort(byPinnedThenNewest).slice(0, 4).map((n) => (
            <Card key={n.id} onPress={() => router.push(`/notice/${n.id}`)}>
              <View style={styles.rowBetween}>
                <Chip label={n.category} tone={CATEGORY_TONE[n.category]} />
                {n.pinned ? <Ionicons name="pin" size={14} color={t.violetText} /> : null}
              </View>
              <Text style={styles.noticeTitle}>{n.title}</Text>
              <Text style={styles.meta}>{formatDate(n.publishedAt)}</Text>
            </Card>
          ))}
        </View>
      </Async>

      {upcomingEvents.length > 0 && (
        <>
          <SectionHeader title="Upcoming events" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {upcomingEvents.map((e) => (
              <Card key={e.id} style={{ width: 240 }} onPress={() => router.push(`/event/${e.id}`)}>
                <Chip label={e.type} tone="blue" />
                <Text style={styles.noticeTitle} numberOfLines={2}>{e.title}</Text>
                <Text style={styles.meta}>{formatDate(e.startDate, { day: 'numeric', month: 'short' })}{e.location ? ` · ${e.location}` : ''}</Text>
              </Card>
            ))}
          </ScrollView>
        </>
      )}

      {forYou.length > 0 && (
        <>
          <SectionHeader title="For you" action="Discover" onAction={() => router.push('/discover')} />
          <View style={{ gap: 10 }}>
            {forYou.map((m) => (
              <Card key={`${m.kind}:${m.item.id}`} onPress={() => router.push(hrefFor(m.kind, m.item.id))}>
                <Text style={styles.cardTitle}>{m.item.title ?? m.item.name}</Text>
                <Text style={styles.reason}>{m.reasons[0]}</Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  hello: { color: t.ink, fontSize: 26, fontWeight: '800' },
  sub: { color: t.inkSoft, fontSize: 14, marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.sunken, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, marginTop: 16, borderWidth: 1, borderColor: t.hairline },
  searchText: { color: t.inkFaint, fontSize: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBox: { width: 48, height: 52, borderRadius: 10, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: t.violetText, fontSize: 18, fontWeight: '800' },
  dateMon: { color: t.violetText, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardTitle: { color: t.ink, fontSize: 15, fontWeight: '700' },
  noticeTitle: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 8, lineHeight: 21 },
  meta: { color: t.inkFaint, fontSize: 12, marginTop: 4 },
  reason: { color: t.greenText, fontSize: 12, marginTop: 4 },
})
