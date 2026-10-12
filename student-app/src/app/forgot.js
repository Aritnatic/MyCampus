import { useState } from 'react'
import { Text } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { AuthShell, DevCode } from '../components/AuthShell'
import { Button, Field, FormError, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { tokens as t } from '../theme'

// Two steps on one screen: ask for a code, then set a new password with it.
export default function Forgot() {
  const { forgot, reset } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devCode, setDevCode] = useState(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const ask = async () => {
    if (!email.includes('@')) return setError('Enter the email you signed up with.')
    setBusy(true)
    setError(null)
    const { error: err, devCode: dev } = await forgot(email)
    setBusy(false)
    if (err) return setError(err)
    setDevCode(dev ?? null)
    setSent(true)
  }

  const save = async () => {
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code.')
    if (password.length < 8) return setError('Use at least 8 characters for your new password.')
    setBusy(true)
    setError(null)
    const { error: err } = await reset(email, code, password)
    setBusy(false)
    if (err) return setError(err)
    toast.show('Password updated. Sign in with your new password.', 'success')
    router.replace('/login')
  }

  return (
    <AuthShell
      title={sent ? 'Set a new password' : 'Reset your password'}
      subtitle={sent ? `If ${email} has an account, we sent it a 6-digit code.` : "Enter your email and we'll send a code to reset your password."}
      footer={<Link href="/login" style={{ color: t.violetText, fontWeight: '600' }}>Back to sign in</Link>}
    >
      {!sent ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@college.edu.in" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" onSubmitEditing={ask} />
          <FormError message={error} />
          <Button label="Send code" onPress={ask} loading={busy} />
        </>
      ) : (
        <>
          <DevCode code={devCode} onUse={() => setCode(devCode)} />
          <Field label="Code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" textContentType="oneTimeCode" maxLength={6} />
          <Field label="New password" value={password} onChangeText={setPassword} secure placeholder="At least 8 characters" textContentType="newPassword" onSubmitEditing={save} />
          <FormError message={error} />
          <Button label="Update password" onPress={save} loading={busy} />
          <Text style={{ color: t.inkFaint, fontSize: 12, textAlign: 'center' }}>Changing your password signs you out on all other devices.</Text>
        </>
      )}
    </AuthShell>
  )
}
