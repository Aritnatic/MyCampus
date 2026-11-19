import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { request } from '../api'
import { Button, Field, FormError, SkeletonCards, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { tokens as t, radius, themed } from '../theme'

// Join your college without a college email: pick the college, give your roll number, and an admin who manages
// students checks it against the college's records. Approval makes this account a verified student at once.
const BRANCHES = [
  ['CSE', 'Computer Science & Engineering'], ['IT', 'Information Technology'], ['ECE', 'Electronics & Communication'],
  ['EE', 'Electrical Engineering'], ['ME', 'Mechanical Engineering'], ['CE', 'Civil Engineering'],
]

function Choices({ label, options, value, onChange, error }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map(([key, text]) => {
          const on = key === value
          return (
            <Pressable key={String(key)} onPress={() => onChange(key)} accessibilityRole="radio" accessibilityLabel={`${label}: ${text}`} accessibilityState={{ checked: on }} style={[styles.choice, on && styles.choiceOn]}>
              <Text style={[styles.choiceText, on && { color: t.violetText }]}>{text}</Text>
            </Pressable>
          )
        })}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>
  )
}

export default function Join() {
  const router = useRouter()
  const toast = useToast()
  const { user, refresh } = useAuth()
  const latest = useApi('/me/join-request')
  const colleges = useApi('/join/colleges')
  const [f, setF] = useState({ university: '', rollNumber: '', branch: '', year: null, semester: null, note: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const set = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: null })); setFormError('') }

  // One college in the list (the pilot): choose it for them. After a rejection, start from what they sent.
  useEffect(() => {
    if (colleges.data?.length === 1) setF((x) => ({ ...x, university: x.university || colleges.data[0].id }))
  }, [colleges.data])
  useEffect(() => {
    const r = latest.data
    if (r?.status === 'rejected') setF((x) => ({ ...x, university: r.university, rollNumber: r.rollNumber, branch: BRANCHES.find(([, n]) => n === r.branch)?.[0] ?? '', year: r.year, semester: r.semester }))
  }, [latest.data])

  if (user?.role === 'student') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={44} color={t.green} />
        <Text style={styles.title}>You’re a verified student</Text>
        <Text style={styles.body}>Your college’s notices, exams, results and safety alerts are in the app.</Text>
        <Button label="Go to Home" onPress={() => router.replace('/')} />
      </View>
    )
  }
  if (latest.loading || colleges.loading) return <View style={styles.scroll}><SkeletonCards count={2} /></View>

  const req = latest.data
  const collegeName = (id) => colleges.data?.find((c) => c.id === id)?.short ?? 'your college'

  if (req?.status === 'pending' && !editing) {
    const withdraw = async () => {
      setBusy(true)
      try { await request('/me/join-request', { method: 'DELETE' }); setEditing(true); latest.reload() } catch (e) { toast.show(e.message, 'error') }
      setBusy(false)
    }
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusCard}>
          <Ionicons name="time-outline" size={28} color={t.yellow} />
          <Text style={styles.title}>Waiting for {collegeName(req.university)}</Text>
          <Text style={styles.body}>An admin will check roll number {req.rollNumber} against the college records. You’ll get a notification as soon as they decide, and the app unlocks your campus by itself.</Text>
        </View>
        <View style={styles.detailRow}><Text style={styles.detailKey}>Roll number</Text><Text style={styles.detailVal}>{req.rollNumber}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailKey}>Branch</Text><Text style={styles.detailVal}>{req.branch}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailKey}>Year · Semester</Text><Text style={styles.detailVal}>{req.year} · {req.semester}</Text></View>
        <Button label="Withdraw and fix details" variant="secondary" onPress={withdraw} loading={busy} />
      </ScrollView>
    )
  }

  const submit = async () => {
    const e = {}
    if (!f.university) e.university = 'Choose your college.'
    if (f.rollNumber.trim().length < 2) e.rollNumber = 'Enter your roll number exactly as on your ID card.'
    if (!f.branch) e.branch = 'Choose your branch.'
    if (!f.year) e.year = 'Choose your year.'
    if (!f.semester) e.semester = 'Choose your semester.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await request('/me/join-request', { method: 'POST', body: { university: f.university, rollNumber: f.rollNumber.trim(), branch: BRANCHES.find(([c]) => c === f.branch)[1], year: f.year, semester: f.semester, note: f.note.trim() } })
      toast.show('Request sent. You’ll be notified when it’s approved.', 'success')
      setEditing(false)
      latest.reload()
      refresh()
    } catch (err) {
      setFormError(err.message)
    }
    setBusy(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {req?.status === 'rejected' ? (
          <View style={[styles.statusCard, { borderColor: t.red }]}>
            <Ionicons name="alert-circle-outline" size={26} color={t.red} />
            <Text style={styles.title}>{collegeName(req.university)} couldn’t confirm your last request</Text>
            <Text style={styles.body}>{req.reason || 'Check your roll number and details, then send it again.'}</Text>
          </View>
        ) : (
          <Text style={styles.intro}>No college email? Ask to join with your roll number. An admin checks it against the college records, and once approved you’ll see your campus notices, exams, results and safety alerts.</Text>
        )}

        {colleges.data?.length > 1 && (
          <Choices label="College" options={colleges.data.map((c) => [c.id, c.short])} value={f.university} onChange={set('university')} error={errors.university} />
        )}
        <Field label="Roll number" value={f.rollNumber} onChangeText={set('rollNumber')} autoCapitalize="characters" autoCorrect={false} placeholder="As printed on your ID card" error={errors.rollNumber} />
        <Choices label="Branch" options={BRANCHES.map(([c]) => [c, c])} value={f.branch} onChange={set('branch')} error={errors.branch} />
        <Choices label="Year" options={[1, 2, 3].map((n) => [n, `Year ${n}`])} value={f.year} onChange={set('year')} error={errors.year} />
        <Choices label="Semester" options={[1, 2, 3, 4, 5, 6].map((n) => [n, String(n)])} value={f.semester} onChange={set('semester')} error={errors.semester} />
        <Field label="Note for the admin (optional)" value={f.note} onChangeText={(v) => set('note')(v.slice(0, 300))} multiline placeholder="For example: I joined in the lateral entry batch." />
        <FormError message={formError} />
        <Button label={req?.status === 'rejected' ? 'Send again' : 'Ask to join'} onPress={submit} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  title: { color: t.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  body: { color: t.inkSoft, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  error: { color: t.red, fontSize: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  choiceOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  choiceText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  statusCard: { alignItems: 'center', gap: 8, padding: 20, borderRadius: radius.card ?? 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.hairline },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.hairline },
  detailKey: { color: t.inkSoft, fontSize: 14 },
  detailVal: { color: t.ink, fontSize: 14, fontWeight: '600' },
}))
