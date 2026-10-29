import { useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { Button, Field, FormError, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { tokens as t, themed } from '../theme'

export default function ChangePassword() {
  const { changePassword } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [v, setV] = useState({ current: '', next: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setV((x) => ({ ...x, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const save = async () => {
    const found = {}
    if (!v.current) found.current = 'Enter your current password.'
    if (v.next.length < 8) found.next = 'Use at least 8 characters.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const { error } = await changePassword(v.current, v.next)
    setBusy(false)
    if (error) return setErrors(/current password/i.test(error) ? { current: error } : { next: error })
    toast.show('Password changed. Other devices were signed out.', 'success')
    router.back()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Changing your password signs you out on every other device.</Text>
        <Field label="Current password" value={v.current} onChangeText={set('current')} secure textContentType="password" error={errors.current} />
        <Field label="New password" value={v.next} onChangeText={set('next')} secure textContentType="newPassword" onSubmitEditing={save} error={errors.next} hint="At least 8 characters. Avoid common passwords and your email name." />
        <FormError message={errors.form} />
        <Button label="Change password" onPress={save} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
}))
