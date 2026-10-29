import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { request } from '../api'
import { Button, Field, FormError, TagInput, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { MAX_NOTE_BYTES, NOTE_TYPES, uploadNoteFile } from '../files'
import { tokens as t, radius, themed } from '../theme'

const readable = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export default function NewNote() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [f, setF] = useState({ title: '', subject: '', semester: user.semester ?? 1, description: '', tags: [], open: false })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setF((cur) => ({ ...cur, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: NOTE_TYPES, copyToCacheDirectory: true })
    if (res.canceled) return
    const asset = res.assets[0]
    if (asset.size > MAX_NOTE_BYTES) return setErrors((e) => ({ ...e, file: 'That file is over 20 MB.' }))
    setFile(asset)
    setErrors((e) => ({ ...e, file: undefined }))
  }

  const save = async () => {
    const found = {}
    if (f.title.trim().length < 3) found.title = 'Give your notes a title.'
    if (!f.subject.trim()) found.subject = 'Enter the subject or course code.'
    if (!file) found.file = 'Attach the notes file (PDF, image, Word or PowerPoint).'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    let note
    try {
      note = await request('/notes', { method: 'POST', body: { title: f.title.trim(), subject: f.subject.trim(), semester: f.semester, description: f.description.trim(), tags: f.tags, visibility: f.open ? 'cross-university' : 'campus' } })
      await uploadNoteFile(note.id, file)
      toast.show('Notes shared', 'success')
      router.back()
    } catch (e) {
      // Don't leave a file-less note behind if the upload failed.
      if (note) await request(`/notes/${note.id}`, { method: 'DELETE' }).catch(() => {})
      setErrors({ form: e.message })
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Title" value={f.title} onChangeText={set('title')} placeholder="e.g. Operating Systems — Unit 3 summary" maxLength={150} error={errors.title} />
        <Field label="Subject" value={f.subject} onChangeText={set('subject')} placeholder="e.g. CSE-302" maxLength={30} autoCapitalize="characters" error={errors.subject} />
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Semester</Text>
          <View style={styles.choiceRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Pressable key={n} onPress={() => set('semester')(n)} accessibilityRole="radio" accessibilityLabel={`Semester ${n}`} accessibilityState={{ checked: n === f.semester }} style={[styles.choice, n === f.semester && styles.choiceOn]}>
                <Text style={[styles.choiceText, n === f.semester && { color: t.violetText }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Field label="Description (optional)" value={f.description} onChangeText={(v) => set('description')(v.slice(0, 1000))} multiline placeholder="What's covered? Handwritten or typed?" />
        <TagInput label="Tags" values={f.tags} onChange={set('tags')} max={10} placeholder="e.g. scheduling, deadlocks" tone="blue" />

        <View style={{ gap: 8 }}>
          <Text style={styles.label}>File</Text>
          <Button label={file ? 'Choose a different file' : 'Choose file'} icon="attach-outline" variant="secondary" onPress={pick} />
          {file ? <Text style={styles.file}>{file.name} · {readable(file.size ?? 0)}</Text> : null}
          {errors.file ? <Text style={styles.error}>{errors.file}</Text> : <Text style={styles.hint}>PDF, PNG, JPEG, Word or PowerPoint, up to 20 MB.</Text>}
        </View>

        <View style={styles.visibility}>
          <View style={{ flex: 1 }}>
            <Text style={styles.visTitle}>Share with other colleges</Text>
            <Text style={styles.hint}>{f.open ? 'Students at other universities can download these notes.' : 'Only students at your college can see them.'}</Text>
          </View>
          <Switch value={f.open} onValueChange={set('open')} trackColor={{ true: t.violet }} accessibilityLabel="Share with other colleges" />
        </View>

        <FormError message={errors.form} />
        <Button label="Share notes" onPress={save} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, minWidth: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  choiceOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  choiceText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  file: { color: t.ink, fontSize: 13 },
  hint: { color: t.inkFaint, fontSize: 12, lineHeight: 17 },
  error: { color: t.red, fontSize: 12 },
  visibility: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 14 },
  visTitle: { color: t.ink, fontSize: 15, fontWeight: '700' },
}))
