import { useState } from 'react'
import { Text } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { AuthShell } from '../components/AuthShell'
import { Button, Field, FormError } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { tokens as t } from '../theme'

export default function Login() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const found = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter your college email.'
    if (!password) found.password = 'Enter your password.'
    setFieldErrors(found)
    setError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    const { error: err } = await signIn(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  const needsVerify = error?.startsWith('Verify your email')

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your college email to see your campus."
      footer={(
        <>
          <Link href="/forgot" style={{ color: t.violetText, fontWeight: '600' }}>Forgot password?</Link>
          <Text style={{ color: t.inkSoft }}>New here? <Link href="/register" style={{ color: t.violetText, fontWeight: '700' }}>Create an account</Link></Text>
        </>
      )}
    >
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@college.edu.in" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" error={fieldErrors.email} />
      <Field label="Password" value={password} onChangeText={setPassword} secure placeholder="Your password" onSubmitEditing={submit} textContentType="password" autoComplete="password" error={fieldErrors.password} />
      {needsVerify ? (
        <Text style={{ color: '#f87171', fontSize: 13 }} onPress={() => router.push({ pathname: '/verify', params: { email } })}>
          {error} <Text style={{ color: t.violetText, fontWeight: '700' }}>Enter your code</Text>
        </Text>
      ) : <FormError message={error} />}
      <Button label="Sign in" onPress={submit} loading={busy} />
    </AuthShell>
  )
}
