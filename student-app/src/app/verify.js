import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { AuthShell, DevCode } from '../components/AuthShell'
import { Button, Field, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const COOLDOWN = 30

export default function Verify() {
  const params = useLocalSearchParams()
  const email = String(params.email ?? '')
  const { verify, resend } = useAuth()
  const toast = useToast()
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(params.devCode ? String(params.devCode) : null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(COOLDOWN)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const submit = async () => {
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code.')
    setBusy(true)
    setError(null)
    const { error: err } = await verify(email, code)
    setBusy(false)
    // On success the session starts and the app switches to the signed-in screens by itself.
    if (err) setError(err)
  }

  const again = async () => {
    const { error: err, devCode: next } = await resend(email)
    if (err) return toast.show(err, 'error')
    setDevCode(next ?? null)
    setWait(COOLDOWN)
    toast.show('We sent a new code.', 'success')
  }

  return (
    <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${email}. It expires in 15 minutes.`}
      footer={<Button label={wait > 0 ? `Resend code in ${wait}s` : 'Resend code'} variant="ghost" onPress={again} disabled={wait > 0} compact />}>
      <DevCode code={devCode} onUse={() => setCode(devCode)} />
      <Field label="Verification code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} onSubmitEditing={submit} error={error} />
      <Button label="Verify and continue" onPress={submit} loading={busy} />
    </AuthShell>
  )
}
