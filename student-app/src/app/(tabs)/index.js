import { JoinCollegeCard } from '../../components/JoinCollegeCard'
import { noticeEnded } from '../../when'
import { useDismissed } from '../../dismissed'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Async, Card, Chip, SectionHeader, formatDate , useToast} from '../../components/ui'
import { BannerCarousel, FilterChips, ShortcutGrid } from '../../components/home'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { KIND_ICON, hrefFor } from '../../links'
import { missingProfile } from '../../profileCompleteness'
import { tokens as t, themed } from '../../theme'

const CATEGORY_TONE = { academic: 'violet', safety: 'yellow', placement: 'green', general: 'blue' }
const byPinnedThenNewest = (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt)
const today = () => new Date().toISOString().slice(0, 10)

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'notice', label: 'Notices' },
  { value: 'event', label: 'Events' },
  { value: 'foryou', label: 'For you' },
]

// "For you": the best few matches from each list, flattened into one short feed.
function picks(matches) {
  if (!matches) return []
  const take = (list, kind, n) => list.slice(0, n).map((m) => ({ ...m, kind }))
  return [...take(matches.projects, 'project', 2), ...take(matches.research, 'research', 1), ...take(matches.startups, 'startup', 1), ...take(matches.people, 'people', 1), ...take(matches.faculty ?? [], 'faculty', 1)]
}

function daysUntil(isoDate) {
  const days = Math.round((new Date(`${isoDate}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86_400_000)
  return days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
}

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const dismissed = useDismissed(user.id)
  const [filter, setFilter] = useState('all')
  const notices = useApi('/content/notices')
  const events = useApi('/content/events')
  const exams = useApi(user.role === 'student' ? '/content/exams' : null)
  const matches = useApi('/matches')
  const all = [notices, events, exams, matches]
  const refreshing = all.some((q) => q.refreshing)
  const refresh = () => all.forEach((q) => q.reload?.())

  const nextExam = (exams.data ?? []).filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0]
  const upcomingEvents = (events.data ?? []).filter((e) => e.status === 'upcoming')
  const sortedNotices = (notices.data ?? []).filter((n) => !noticeEnded(n)).sort(byPinnedThenNewest) // expired notices live under Notices → Older
  const forYou = picks(matches.data)
  const gaps = missingProfile(user)

  // Big sliding cards. Each can be hidden with its ✕; the next item of the same kind then takes its place.
  const nextNotice = sortedNotices.find((n) => !dismissed.isHidden(`notice:${n.id}`))
  const nextEvent = upcomingEvents.find((e) => !dismissed.isHidden(`event:${e.id}`))
  const examKey = nextExam && `exam:${nextExam.id ?? `${nextExam.subjectCode}-${nextExam.date}`}`
  const banners = !dismissed.ready ? [] : [
    gaps.length > 0 && !dismissed.isHidden('profile') && { key: 'profile', dismissId: 'profile', tone: 'violet', icon: 'person-circle-outline', eyebrow: 'Get matched', title: 'Finish your profile', body: 'Add skills and goals to see people, projects and mentors.', cta: 'Set up profile', onPress: () => router.push('/profile-edit?onboarding=1') },
    nextExam && !dismissed.isHidden(examKey) && { key: 'exam', dismissId: examKey, tone: 'yellow', icon: 'calendar-outline', eyebrow: `Next exam ${daysUntil(nextExam.date)}`, title: nextExam.subjectName, body: `${nextExam.day} · ${nextExam.startTime}–${nextExam.endTime}${nextExam.room ? ` · ${nextExam.room}` : ''}`, cta: 'Timetable', onPress: () => router.push('/exams') },
    nextNotice && { key: 'notice', dismissId: `notice:${nextNotice.id}`, tone: 'blue', icon: 'newspaper-outline', eyebrow: nextNotice.pinned ? 'Pinned notice' : nextNotice === sortedNotices[0] ? 'Latest notice' : 'Notice', title: nextNotice.title, body: formatDate(nextNotice.publishedAt), cta: 'Read', onPress: () => router.push(`/notice/${nextNotice.id}`) },
    nextEvent && { key: 'event', dismissId: `event:${nextEvent.id}`, tone: 'green', icon: 'ticket-outline', eyebrow: 'Happening soon', title: nextEvent.title, body: `${formatDate(nextEvent.startDate, { day: 'numeric', month: 'short' })}${nextEvent.location ? ` · ${nextEvent.location}` : ''}`, cta: 'View event', onPress: () => router.push(`/event/${nextEvent.id}`) },
  ].filter(Boolean)
  const hideBanner = (b) => {
    dismissed.dismiss(b.dismissId)
    toast.show(b.key === 'notice' ? 'Hidden. It’s still in Notices.' : b.key === 'event' ? 'Hidden. It’s still in Events.' : 'Hidden from Home.')
  }

  const go = (href) => () => router.push(href)
  const shortcuts = [
    { key: 'notices', icon: 'newspaper-outline', label: 'Notices', tone: 'blue', onPress: go('/notices') },
    { key: 'exams', icon: 'calendar-outline', label: 'Exams & results', tone: 'yellow', onPress: go('/exams') },
    { key: 'events', icon: 'ticket-outline', label: 'My events', tone: 'green', onPress: go('/my-events') },
    { key: 'notes', icon: 'book-outline', label: 'Notes', tone: 'violet', onPress: go('/notes') },
    { key: 'mentors', icon: 'people-outline', label: 'Mentors & peers', tone: 'violet', onPress: go('/discover') },
    { key: 'career', icon: 'trail-sign-outline', label: 'Career', tone: 'yellow', onPress: go('/career') },
    { key: 'safety', icon: 'shield-checkmark-outline', label: 'Safety', tone: 'blue', onPress: go('/alerts') },
  ]

  // One feed, filtered by chip. "All" mixes notices and events newest first, pinned notices on top.
  const noticeItems = sortedNotices.map((n) => ({ key: `n${n.id}`, kind: 'notice', pinned: n.pinned, at: n.publishedAt, chip: n.category, tone: CATEGORY_TONE[n.category], title: n.title, meta: formatDate(n.publishedAt), href: `/notice/${n.id}` }))
  const eventItems = upcomingEvents.map((e) => ({ key: `e${e.id}`, kind: 'event', at: e.startDate, chip: e.type, tone: 'green', title: e.title, meta: `${formatDate(e.startDate, { day: 'numeric', month: 'short' })}${e.location ? ` · ${e.location}` : ''}`, href: `/event/${e.id}` }))
  const forYouItems = forYou.map((m) => ({ key: `${m.kind}:${m.item.id}`, kind: m.kind, chip: m.kind, tone: 'violet', title: m.item.title ?? m.item.name, meta: m.reasons[0], metaTone: 'green', href: hrefFor(m.kind, m.item.id) }))
  const mixed = [...noticeItems, ...eventItems].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || new Date(b.at) - new Date(a.at))
  const feed = { all: mixed, notice: noticeItems, event: eventItems, foryou: forYouItems }[filter].slice(0, 12)
  const loading = filter === 'foryou' ? matches.loading && !matches.data : (notices.loading && !notices.data) || (events.loading && !events.data)
  const error = filter === 'foryou' ? matches.error : notices.error

  return (
    <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.violetText} />}>
      <View style={styles.pad}>
        <Text style={styles.hello}>Hi, {user.name.split(' ')[0]} 👋</Text>
        {user.branch ? <Text style={styles.sub}>{user.branch} · Semester {user.semester}</Text> : <Text style={styles.sub}>{user.role === 'student' ? 'Welcome to your campus' : 'Welcome to MyCampus'}</Text>}

        <Pressable onPress={() => router.push('/search')} accessibilityRole="search" accessibilityLabel="Search projects, people, notices and notes" style={styles.search}>
          <Ionicons name="search" size={18} color={t.inkFaint} />
          <Text style={styles.searchText}>Search projects, people, notices…</Text>
        </Pressable>
        <JoinCollegeCard style={{ marginTop: 12 }} />
      </View>

      <View style={{ marginTop: 16 }}>
        <BannerCarousel banners={banners} onDismiss={hideBanner} />
      </View>

      <View style={styles.pad}>
        <SectionHeader title="What would you like to do?" />
        <ShortcutGrid items={shortcuts} />

        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        </View>

        <Async
          loading={loading}
          error={error}
          onRetry={refresh}
          emptyIcon={KIND_ICON[filter] ?? 'file-tray-outline'}
          emptyTitle="Nothing here yet"
          empty={feed.length === 0 && (filter === 'foryou' ? 'Finish your profile and we’ll suggest people, projects and mentors.' : 'New posts from your college will appear here.')}
        >
          <View style={{ gap: 10 }}>
            {feed.map((item) => (
              <Card key={item.key} onPress={item.href ? () => router.push(item.href) : undefined}>
                <View style={styles.rowBetween}>
                  <Chip label={item.chip} tone={item.tone} />
                  {item.pinned ? <Ionicons name="pin" size={14} color={t.violetText} /> : <Ionicons name={KIND_ICON[item.kind] ?? 'ellipse-outline'} size={14} color={t.inkFaint} />}
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.meta ? <Text style={[styles.meta, item.metaTone === 'green' && { color: t.greenText }]}>{item.meta}</Text> : null}
              </Card>
            ))}
          </View>
        </Async>
      </View>
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 40 },
  pad: { paddingHorizontal: 16 },
  hello: { color: t.ink, fontSize: 26, fontWeight: '800' },
  sub: { color: t.inkSoft, fontSize: 14, marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.sunken, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, marginTop: 16, borderWidth: 1, borderColor: t.hairline },
  searchText: { color: t.inkFaint, fontSize: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 8, lineHeight: 21 },
  meta: { color: t.inkFaint, fontSize: 12, marginTop: 4 },
}))
