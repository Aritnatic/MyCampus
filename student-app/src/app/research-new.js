import { useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { request } from '../api'
import { Button, Field, FormError, TagInput, useToast } from '../components/ui'
import { SkillPicker } from '../components/SkillPicker'
import { tokens as t, radius, themed } from '../theme'

function Choices({ label, options, value, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map(([key, text]) => (
          <Pressable key={key} onPress={() => onChange(key)} accessibilityRole="radio" accessibilityLabel={`${label}: ${text}`} accessibilityState={{ checked: key === value }} style={[styles.choice, key === value && styles.choiceOn]}>
            <Text style={[styles.choiceText, key === value && { color: t.violetText }]}>{text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// Propose a research project. An admin who manages research at your college reviews it; until then only you
// can see it. Once approved it's listed, you run it, and people can ask to join or be invited by you.
export default function ProposeResearch() {
  const router = useRouter()
  const toast = useToast()
  const [f, setF] = useState({ title: '', description: '', department: '', supervisor: '', requiredSkills: [], positions: 2, duration: '', open: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setF((cur) => ({ ...cur, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const save = async () => {
    const found = {}
    if (f.title.trim().length < 5) found.title = 'Give it a clear title (at least 5 characters).'
    if (f.description.trim().length < 30) found.description = 'Describe the idea in a few sentences (at least 30 characters).'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const r = await request('/research/proposals', {
        method: 'POST',
        body: {
          title: f.title.trim(), description: f.description.trim(), requiredSkills: f.requiredSkills, positions: f.positions,
          visibility: f.open ? 'cross-university' : 'campus',
          ...(f.department.trim() && { department: f.department.trim() }), ...(f.supervisor.trim() && { supervisor: f.supervisor.trim() }), ...(f.duration.trim() && { duration: f.duration.trim() }),
        },
      })
      toast.show('Sent for approval. You’ll be notified.', 'success')
      router.replace(`/discover/research/${r.id}`)
    } catch (e) {
      setErrors({ form: e.message })
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Propose a research idea. Your college’s research admins review it first; only you can see it until they approve. Then it’s listed and you lead it.</Text>
        <Field label="Research title" value={f.title} onChangeText={set('title')} placeholder="e.g. Detecting paddy leaf disease from phone photos" maxLength={140} error={errors.title} />
        <Field label="What will you research, and why?" value={f.description} onChangeText={(v) => set('description')(v.slice(0, 2000))} multiline placeholder="The question, your approach, and what you hope to show." hint={`${f.description.length}/2000`} error={errors.description} />
        <Field label="Department (optional)" value={f.department} onChangeText={set('department')} placeholder="e.g. Agriculture, CSE" maxLength={80} />
        <Field label="Faculty supervisor you’d like (optional)" value={f.supervisor} onChangeText={set('supervisor')} placeholder="e.g. Dr. Rao" maxLength={80} hint="Leave empty and the admins can suggest one." />
        <SkillPicker label="Skills the team needs" catalog="skills" values={f.requiredSkills} onChange={set('requiredSkills')} max={15} placeholder="Type a skill, e.g. Python, Soil Testing" />
        <Choices label="People needed (besides you)" options={[1, 2, 3, 4, 5].map((n) => [n, String(n)])} value={f.positions} onChange={set('positions')} />
        <Field label="How long (optional)" value={f.duration} onChangeText={set('duration')} placeholder="e.g. 3 months" maxLength={40} />
        <View style={styles.visibility}>
          <View style={{ flex: 1 }}>
            <Text style={styles.visTitle}>Open to other colleges</Text>
            <Text style={styles.hint}>{f.open ? 'Once approved, students at other universities can find it too.' : 'Once approved, only students at your college can see it.'}</Text>
          </View>
          <Switch value={f.open} onValueChange={set('open')} trackColor={{ true: t.violet }} accessibilityLabel="Open to other colleges" />
        </View>
        <FormError message={errors.form} />
        <Button label="Send for approval" onPress={save} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  choiceOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  choiceText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  visibility: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 14 },
  visTitle: { color: t.ink, fontSize: 15, fontWeight: '700' },
  hint: { color: t.inkFaint, fontSize: 12, lineHeight: 17, marginTop: 2 },
}))
