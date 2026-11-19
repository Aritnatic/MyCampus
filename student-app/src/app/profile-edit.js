import { useLayoutEffect, useMemo, useState } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Button, Field, FormError, TagInput, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { tokens as t, radius, themed } from '../theme'
import { SkillPicker } from '../components/SkillPicker'

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
    instagram: user.socials?.instagram ?? '', linkedin: user.socials?.linkedin ?? '', github: user.socials?.github ?? '',
    twitter: user.socials?.twitter ?? '', website: user.socials?.website ?? '',
    phone: user.contact?.phone ?? '', whatsapp: user.contact?.whatsapp ?? true, showPhone: user.contact?.showPhone ?? false,
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
    if (f.phone.trim() && !/^\+?[0-9][0-9 ()-]{6,18}$/.test(f.phone.trim())) found.phone = 'Enter the number with its country code, e.g. +91 98765 43210.'
    if (f.website.trim() && !/^https?:\/\/\S+\.\S+/i.test(f.website.trim())) found.website = 'Enter the full address, starting with https://'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const patch = {
      name: f.name.trim(), bio: f.bio.trim(), skills: f.skills, interests: f.interests, lookingFor: f.lookingFor,
      mentor: { open: f.mentorOpen, topics: f.mentorOpen ? f.mentorTopics : [] },
      socials: { instagram: f.instagram.trim().replace(/^@/, ''), linkedin: f.linkedin.trim(), github: f.github.trim().replace(/^@/, ''), twitter: f.twitter.trim().replace(/^@/, ''), website: f.website.trim() },
      contact: { phone: f.phone.trim(), whatsapp: f.whatsapp, showPhone: !!f.phone.trim() && f.showPhone },
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
        <SkillPicker label="Skills" catalog="skills" values={f.skills} onChange={set('skills')} placeholder="Type a skill, e.g. Python, AutoCAD, Soil Testing" hint="What you can do today. Pick from the list or add your own." />
        <SkillPicker label="Interests" catalog="interests" values={f.interests} onChange={set('interests')} placeholder="Type an interest, e.g. Startups, Drones" tone="blue" hint="What you want to explore." />
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

        <View style={{ gap: 4, marginTop: 6 }}>
          <Text style={styles.section}>Contact & socials</Text>
          <Text style={styles.hint}>How people you meet here can reach you. Social links show on your profile; your number never does.</Text>
        </View>
        <Field label="Instagram" value={f.instagram} onChangeText={set('instagram')} autoCapitalize="none" autoCorrect={false} placeholder="username" />
        <Field label="LinkedIn" value={f.linkedin} onChangeText={set('linkedin')} autoCapitalize="none" autoCorrect={false} placeholder="your-name (from linkedin.com/in/your-name)" />
        <Field label="GitHub" value={f.github} onChangeText={set('github')} autoCapitalize="none" autoCorrect={false} placeholder="username" />
        <Field label="X (Twitter)" value={f.twitter} onChangeText={set('twitter')} autoCapitalize="none" autoCorrect={false} placeholder="username" />
        <Field label="Website or portfolio" value={f.website} onChangeText={set('website')} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://" error={errors.website} />
        <Field label="Phone number" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+91 98765 43210" error={errors.phone} />
        {f.phone.trim() ? (
          <>
            <View style={styles.mentor}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mentorTitle}>Share with my connections</Text>
                <Text style={styles.hint}>Only people you’ve connected with (both of you agreed) can see it. Nobody else, ever.</Text>
              </View>
              <Switch value={f.showPhone} onValueChange={set('showPhone')} trackColor={{ true: t.violet }} accessibilityLabel="Share my number with my connections" />
            </View>
            <View style={styles.mentor}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mentorTitle}>It’s on WhatsApp</Text>
                <Text style={styles.hint}>Connections get a “Message on WhatsApp” button.</Text>
              </View>
              <Switch value={f.whatsapp} onValueChange={set('whatsapp')} trackColor={{ true: t.violet }} accessibilityLabel="This number is on WhatsApp" />
            </View>
          </>
        ) : null}

        <FormError message={errors.form} />
        <Button label="Save profile" onPress={save} loading={busy} disabled={!dirty} />
        {onboarding ? <Button label="Skip for now" variant="ghost" onPress={() => router.back()} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, minWidth: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  choiceOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  choiceText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  mentor: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 14 },
  mentorTitle: { color: t.ink, fontSize: 15, fontWeight: '700' },
  section: { color: t.ink, fontSize: 17, fontWeight: '800' },
  hint: { color: t.inkFaint, fontSize: 12, lineHeight: 17, marginTop: 2 },
  error: { color: t.red, fontSize: 13 },
}))
