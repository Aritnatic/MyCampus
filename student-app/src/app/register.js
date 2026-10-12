import { useState } from 'react'
import { Linking, Text } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { AuthShell } from '../components/AuthShell'
import { Button, Field, FormError } from '../components/ui'
import { SITE_URL } from '../api'
import { useAuth } from '../context/AuthContext'
import { tokens as t } from '../theme'

export default function Register() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, form: undefined })) }

  const submit = async () => {
    const found = {}
    if (form.name.trim().length < 2) found.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = 'Enter a valid email address.'
    if (form.password.length < 8) found.password = 'Use at least 8 characters.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const { error: err, devCode } = await register(form)
    setBusy(false)
    if (err) return setErrors({ form: err })
    router.push({ pathname: '/verify', params: { email: form.email.trim(), ...(devCode && { devCode }) } })
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Use your official college email to unlock your campus. Other emails can still explore projects, research and startups."
      footer={<Text style={{ color: t.inkSoft }}>Already have an account? <Link href="/login" style={{ color: t.violetText, fontWeight: '700' }}>Sign in</Link></Text>}
    >
      <Field label="Full name" value={form.name} onChangeText={set('name')} placeholder="Aritra Das" autoCapitalize="words" textContentType="name" error={errors.name} />
      <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="you@college.edu.in" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" error={errors.email} />
      <Field label="Password" value={form.password} onChangeText={set('password')} secure placeholder="At least 8 characters" textContentType="newPassword" onSubmitEditing={submit} error={errors.password} hint="Avoid common passwords and your email name." />
      <FormError message={errors.form} />
      <Button label="Send verification code" onPress={submit} loading={busy} />
      <Text style={{ color: t.inkFaint, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
        By creating an account you agree to the{' '}
        <Text style={{ color: t.violetText }} onPress={() => Linking.openURL(`${SITE_URL}/legal/terms`)} accessibilityRole="link">Terms of use</Text>
        {' '}and the{' '}
        <Text style={{ color: t.violetText }} onPress={() => Linking.openURL(`${SITE_URL}/legal/privacy`)} accessibilityRole="link">Privacy policy</Text>.
      </Text>
    </AuthShell>
  )
}
