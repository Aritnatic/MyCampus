import { useLayoutEffect, useMemo, useState } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Button, Field, FormError, TagInput, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { tokens as t, radius } from '../theme'

const BRANCHES = [
  ['CSE', 'Computer Science & Engineering'], ['IT', 'Information Technology'], ['ECE', 'Electronics & Communication'],
  ['EE', 'Electrical Engineering'], ['ME', 'Mechanical Engineering'], ['CE', 'Civil Engineering'],
]
const codeOf = (name) => BRANCHES.find(([c, n]) => c === name || n === name)?.[0] ?? null

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

export default function ProfileEdit() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const navigation = useNavigation()
  const toast = useToast()
  const { onboarding } = useLocalSearchParams()
  const isStudent = user.role === 'student'

  const initial = useMemo(() => ({
    name: user.name ?? '', bio: user.bio ?? '', skills: user.skills ?? [], interests: user.interests ?? [], lookingFor: user.lookingFor ?? [],
    branch: isStudent ? (codeOf(user.branch) ?? user.branch ?? null) : null, year: user.year ?? 1, semester: user.semester ?? 1,
    mentorOpen: !!user.mentor?.open, mentorTopics: user.mentor?.topics ?? [],
  }), [user, isStudent])
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setF((cur) => ({ ...cur, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }
  const dirty = JSON.stringify(f) !== JSON.stringify(initial)

  useLayoutEffect(() => { navigation.setOptions({ title: onboarding ? 'Set up your profile' : 'Edit profile' }) }, [navigation, onboarding])

  const save = async () => {
    const found = {}
    if (f.name.trim().length < 2) found.name = 'Enter your name.'
    if (isStudent && !f.branch) found.branch = 'Choose your branch so we can show your exams and results.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const patch = {
      name: f.name.trim(), bio: f.bio.trim(), skills: f.skills, interests: f.interests, lookingFor: f.lookingFor,
      mentor: { open: f.mentorOpen, topics: f.mentorOpen ? f.mentorTopics : [] },
      ...(isStudent && { branch: BRANCHES.find(([c]) => c === f.branch)?.[1] ?? f.branch ?? '', year: f.year, semester: f.semester }),
    }
    const { error: err } = await updateProfile(patch)
    setBusy(false)
    if (err) return setErrors({ form: err })
    toast.show('Profile saved', 'success')
    router.back()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {onboarding ? <Text style={styles.intro}>The more you add, the better your suggestions: people to meet, projects to join and mentors to ask.</Text> : null}

        <Field label="Name" value={f.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} />

        {isStudent ? (
          <>
            <Choices label="Branch" options={BRANCHES.map(([c]) => [c, c])} value={f.branch} onChange={set('branch')} error={errors.branch} />
            <Choices label="Year" options={[1, 2, 3, 4].map((n) => [n, `Year ${n}`])} value={f.year} onChange={set('year')} />
            <Choices label="Semester" options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, String(n)])} value={f.semester} onChange={set('semester')} />
          </>
        ) : null}

        <Field label="About you" value={f.bio} onChangeText={(v) => set('bio')(v.slice(0, 500))} multiline placeholder="What are you working on or learning?" hint={`${f.bio.length}/500`} />
        <TagInput label="Skills" values={f.skills} onChange={set('skills')} placeholder="e.g. Python, Arduino, AutoCAD" hint="What you can do today." />
        <TagInput label="Interests" values={f.interests} onChange={set('interests')} placeholder="e.g. IoT, Startups, Research" tone="blue" hint="What you want to explore." />
        <TagInput label="Looking for" values={f.lookingFor} onChange={set('lookingFor')} max={10} placeholder="e.g. Hardware co-founder" tone="yellow" hint="Roles or help you need — used to match you with people." />

        {isStudent ? (
          <View style={styles.mentor}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mentorTitle}>Open to mentoring</Text>
              <Text style={styles.hint}>Students from other colleges can find you and ask for guidance. You choose who to accept.</Text>
            </View>
            <Switch value={f.mentorOpen} onValueChange={set('mentorOpen')} trackColor={{ true: t.violet }} accessibilityLabel="Open to mentoring" />
          </View>
        ) : null}
        {isStudent && f.mentorOpen ? <TagInput label="Mentoring topics" values={f.mentorTopics} onChange={set('mentorTopics')} max={10} placeholder="e.g. System design, Placements" tone="green" /> : null}

        <FormError message={errors.form} />
        <Button label="Save profile" onPress={save} loading={busy} disabled={!dirty} />
        {onboarding ? <Button label="Skip for now" variant="ghost" onPress={() => router.back()} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, minWidth: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  choiceOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  choiceText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  mentor: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 14 },
  mentorTitle: { color: t.ink, fontSize: 15, fontWeight: '700' },
  hint: { color: t.inkFaint, fontSize: 12, lineHeight: 17, marginTop: 2 },
  error: { color: '#f87171', fontSize: 13 },
})
