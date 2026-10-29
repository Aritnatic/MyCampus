import { useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { request } from '../api'
import { Button, Field, FormError, TagInput, useToast } from '../components/ui'
import { tokens as t, radius, themed } from '../theme'

const CATEGORIES = ['Web App', 'Mobile App', 'IoT', 'AI / ML', 'Hardware', 'Research', 'Other']
const STAGES = [['idea', 'Idea'], ['prototype', 'Prototype'], ['beta', 'Beta'], ['live', 'Live']]

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

export default function NewProject() {
  const router = useRouter()
  const toast = useToast()
  const [f, setF] = useState({ title: '', description: '', category: 'Web App', stage: 'idea', skills: [], lookingFor: [], open: true })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setF((cur) => ({ ...cur, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const save = async () => {
    const found = {}
    if (f.title.trim().length < 3) found.title = 'Give your project a name (at least 3 letters).'
    if (f.description.trim().length < 10) found.description = 'Describe it in a sentence or two (at least 10 characters).'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const project = await request('/projects', {
        method: 'POST',
        body: { title: f.title.trim(), description: f.description.trim(), category: f.category, stage: f.stage, skills: f.skills, lookingFor: f.lookingFor, visibility: f.open ? 'cross-university' : 'campus' },
      })
      toast.show('Project created', 'success')
      router.replace(`/discover/projects/${project.id}`)
    } catch (e) {
      setErrors({ form: e.message })
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Tell people what you’re building and who you need. Students who match will be able to ask to join.</Text>
        <Field label="Project name" value={f.title} onChangeText={set('title')} placeholder="e.g. Campus bus tracker" maxLength={120} error={errors.title} />
        <Field label="What is it?" value={f.description} onChangeText={(v) => set('description')(v.slice(0, 400))} multiline placeholder="One or two sentences on the problem and your approach." hint={`${f.description.length}/400`} error={errors.description} />
        <Choices label="Type" options={CATEGORIES.map((c) => [c, c])} value={f.category} onChange={set('category')} />
        <Choices label="Stage" options={STAGES} value={f.stage} onChange={set('stage')} />
        <TagInput label="Tech and skills used" values={f.skills} onChange={set('skills')} placeholder="e.g. React Native, Arduino" />
        <TagInput label="Who do you need?" values={f.lookingFor} onChange={set('lookingFor')} max={10} placeholder="e.g. UI designer, Backend developer" tone="yellow" hint="Roles help us match people to your project." />
        <View style={styles.visibility}>
          <View style={{ flex: 1 }}>
            <Text style={styles.visTitle}>Open to other colleges</Text>
            <Text style={styles.hint}>{f.open ? 'Students at other universities can find and join this project.' : 'Only students at your college can see it.'}</Text>
          </View>
          <Switch value={f.open} onValueChange={set('open')} trackColor={{ true: t.violet }} accessibilityLabel="Open to other colleges" />
        </View>
        <FormError message={errors.form} />
        <Button label="Create project" onPress={save} loading={busy} />
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
