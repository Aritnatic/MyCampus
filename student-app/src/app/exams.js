import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Async, Card, Chip, Segmented, formatDate } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { tokens as t } from '../theme'

export default function Exams() {
  const [tab, setTab] = useState('timetable')
  // The server already limits these to your campus, branch and semester.
  const timetable = useApi('/content/exams')
  const grades = useApi('/content/grades')
  const batches = useApi('/content/results')
  const active = tab === 'timetable' ? timetable : grades
  const mine = [...(timetable.data ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const myResults = grades.data ?? []
  const announcements = batches.data ?? []

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[{ value: 'timetable', label: 'Timetable' }, { value: 'results', label: 'Results' }]}
      />
      <View style={{ gap: 10, marginTop: 16 }}>
        <Async
          loading={active.loading}
          error={active.error}
          onRetry={active.reload}
          empty={active.data?.length === 0 && (tab === 'timetable' ? 'No exams scheduled for your semester.' : announcements.length === 0 && 'No results published yet.')}
        >
        {tab === 'timetable' && (mine.length ? mine.map((e) => (
          <Card key={e.id}>
            <View style={styles.row}>
              <Text style={styles.code}>{e.subjectCode}</Text>
              <Chip label={e.type} tone="violet" />
            </View>
            <Text style={styles.title}>{e.subjectName}</Text>
            <Text style={styles.meta}>{e.day}, {formatDate(e.date)} · {e.startTime}–{e.endTime}</Text>
            <Text style={styles.meta}>{e.room}{e.seatNo ? ` · Seat ${e.seatNo}` : ''}</Text>
          </Card>
        ))  : null)}

        {tab === 'results' && announcements.map((b) => (
          <Card key={b.id}>
            <View style={styles.row}>
              <Text style={styles.code}>{b.branch} · Semester {b.semester}</Text>
              <Chip label="Published" tone="green" />
            </View>
            <Text style={styles.title}>Results are out{b.publishedAt ? ` · ${formatDate(b.publishedAt)}` : ''}</Text>
            <Text style={styles.meta}>{b.passed} of {b.totalStudents} passed · average {b.averagePercentage}%</Text>
          </Card>
        ))}
        {tab === 'results' && (myResults.length ? myResults.map((r) => (
          <Card key={r.id}>
            <Text style={styles.title}>{r.examName}</Text>
            <View style={styles.stats}>
              <Stat label="SGPA" value={r.sgpa} />
              <Stat label="CGPA" value={r.cgpa} />
              <Stat label="Rank" value={`${r.rank}/${r.totalStudents}`} />
            </View>
            {r.subjects.map((s) => (
              <View key={s.code} style={styles.subjectRow}>
                <Text style={styles.subjectName} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.grade}>{s.grade}</Text>
              </View>
            ))}
          </Card>
        ))  : null)}
        </Async>
      </View>
    </ScrollView>
  )
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: t.violetText, fontSize: 12, fontWeight: '700' },
  title: { color: t.ink, fontSize: 15, fontWeight: '600', marginTop: 6 },
  meta: { color: t.inkSoft, fontSize: 13, marginTop: 4 },
  empty: { color: t.inkFaint, textAlign: 'center', marginTop: 32 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  stat: { flex: 1, backgroundColor: t.sunken, borderRadius: 10, padding: 10, alignItems: 'center' },
  statValue: { color: t.ink, fontSize: 18, fontWeight: '700' },
  statLabel: { color: t.inkFaint, fontSize: 11, marginTop: 2 },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.hairline2 },
  subjectName: { color: t.inkSoft, fontSize: 13, flex: 1, marginRight: 8 },
  grade: { color: t.greenText, fontSize: 13, fontWeight: '700' },
})
