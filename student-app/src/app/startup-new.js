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

// Post a startup. It goes live straight away, like a project; you own it, get join requests and can invite people.
const SECTORS = ['Edtech', 'Agritech', 'Healthtech', 'Fintech', 'E-commerce', 'Mobility', 'Climate', 'Social impact', 'SaaS', 'Hardware', 'Other']
const STAGES = [['idea', 'Idea'], ['prototype', 'Prototype'], ['mvp', 'MVP'], ['early-revenue', 'Early revenue'], ['growing', 'Growing']]
const ROLE_TYPES = [['co-founder', 'Co-founder'], ['part-time', 'Part-time'], ['intern', 'Intern']]

export default function NewStartup() {
  const router = useRouter()
  const toast = useToast()
  const [f, setF] = useState({ name: '', tagline: '', description: '', sector: 'Edtech', stage: 'idea', skills: [], roles: [], roleType: 'co-founder', website: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setF((cur) => ({ ...cur, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const save = async () => {
    const found = {}
    if (f.name.trim().length < 2) found.name = 'Give your startup a name.'
    if (f.tagline.trim().length < 5) found.tagline = 'Say what it does in one line (at least 5 characters).'
    if (f.description.trim().length < 10) found.description = 'Describe it in a sentence or two (at least 10 characters).'
    if (f.website.trim() && !/^https?:\/\/\S+\.\S+/i.test(f.website.trim())) found.website = 'Enter the full address, starting with https://'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const s = await request('/startups', {
        method: 'POST',
        body: {
          name: f.name.trim(), tagline: f.tagline.trim(), description: f.description.trim(), sector: f.sector, stage: f.stage, skills: f.skills,
          rolesOpen: f.roles.map((role) => ({ role, type: f.roleType })), ...(f.website.trim() && { website: f.website.trim() }),
        },
      })
      toast.show('Startup posted', 'success')
      router.replace(`/discover/startups/${s.id}`)
    } catch (e) {
      setErrors({ form: e.message })
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Post your startup so students at your college and beyond can find it, ask to join, or be invited by you.</Text>
        <Field label="Startup name" value={f.name} onChangeText={set('name')} placeholder="e.g. KrishiBot" maxLength={80} error={errors.name} />
        <Field label="One-line pitch" value={f.tagline} onChangeText={set('tagline')} placeholder="e.g. Crop advice for farmers on WhatsApp" maxLength={160} error={errors.tagline} />
        <Field label="What problem are you solving?" value={f.description} onChangeText={(v) => set('description')(v.slice(0, 600))} multiline placeholder="Who has the problem, and how you solve it." hint={`${f.description.length}/600`} error={errors.description} />
        <Choices label="Sector" options={SECTORS.map((c) => [c, c])} value={f.sector} onChange={set('sector')} />
        <Choices label="Stage" options={STAGES} value={f.stage} onChange={set('stage')} />
        <SkillPicker label="Skills you use or need" catalog="skills" values={f.skills} onChange={set('skills')} placeholder="Type a skill, e.g. Flutter, Marketing" />
        <TagInput label="Open roles" values={f.roles} onChange={set('roles')} max={10} placeholder="e.g. Tech co-founder, Marketing intern" tone="yellow" hint="Who you're looking for." />
        {f.roles.length ? <Choices label="Those roles are" options={ROLE_TYPES} value={f.roleType} onChange={set('roleType')} /> : null}
        <Field label="Website (optional)" value={f.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" placeholder="https://" error={errors.website} />
        <FormError message={errors.form} />
        <Button label="Post startup" onPress={save} loading={busy} />
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
