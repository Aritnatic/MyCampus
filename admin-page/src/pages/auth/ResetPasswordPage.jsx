import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react'
import { request } from '../../api'

const input = 'w-full px-3 py-2.5 border border-admin-200 rounded-lg text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-admin-50'

// Public page for setting or resetting a password with an emailed 6-digit code. It serves two cases:
// "I forgot my password" and "I was just added as an admin and was sent a code".
// Reaching it with ?step=code skips straight to entering the code.
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState(params.get('step') === 'code' ? 'code' : 'email')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [devCode, setDevCode] = useState(null)
  const [done, setDone] = useState(false)
  const clear = () => setErrors({})

  const ask = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErrors({ email: 'Enter the email address of your admin account.' })
    setBusy(true)
    try {
      const res = await request('/auth/forgot', { method: 'POST', body: { email: email.trim() } })
      setDevCode(res?.devCode ?? null)
      setStep('code')
      clear()
    } catch (err) {
      setErrors({ form: err.message })
    }
    setBusy(false)
  }

  const save = async (e) => {
    e.preventDefault()
    const found = {}
    if (!/^\d{6}$/.test(code.trim())) found.code = 'Enter the 6-digit code from your email.'
    if (password.length < 8) found.password = 'Use at least 8 characters.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter your email address.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await request('/auth/reset', { method: 'POST', body: { email: email.trim(), code: code.trim(), password } })
      setDone(true)
      setTimeout(() => navigate('/admin/login', { replace: true }), 1800)
    } catch (err) {
      setErrors({ form: err.message })
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-admin-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl border border-admin-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-admin-900 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-lg font-bold text-admin-900">MyCampus</h1><p className="text-xs text-admin-500">Admin panel</p></div>
        </div>

        {done ? (
          <div className="text-center py-6" role="status">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
            <h2 className="text-lg font-semibold text-admin-900">Password saved</h2>
            <p className="text-sm text-admin-500 mt-1">Taking you to the sign-in page…</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-admin-900">{step === 'email' ? 'Reset your password' : 'Enter your code'}</h2>
            <p className="text-sm text-admin-500 mt-1 mb-5">
              {step === 'email' ? "We'll email you a 6-digit code. If you were just added as an admin, use the code from your welcome email." : `If ${email || 'that address'} has an admin account, we sent it a 6-digit code. It works for 15 minutes.`}
            </p>

            {errors.form && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2 text-sm text-danger-700" role="alert"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{errors.form}</span></div>
            )}

            {step === 'email' ? (
              <form onSubmit={ask} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="rp-email" className="admin-label">Admin email</label>
                  <input id="rp-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clear() }} className={input} placeholder="admin@university.edu.in" aria-invalid={!!errors.email} />
                  {errors.email && <p role="alert" className="text-xs text-danger-700 mt-1">{errors.email}</p>}
                </div>
                <button type="submit" disabled={busy} className="admin-btn-primary w-full justify-center">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send me a code'}</button>
                <button type="button" onClick={() => setStep('code')} className="w-full text-sm text-primary-600 hover:underline">I already have a code</button>
              </form>
            ) : (
              <form onSubmit={save} className="space-y-4" noValidate>
                {devCode && <p className="text-xs p-2 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">Development server: your code is <strong>{devCode}</strong>.</p>}
                <div>
                  <label htmlFor="rp-email2" className="admin-label">Admin email</label>
                  <input id="rp-email2" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clear() }} className={input} aria-invalid={!!errors.email} />
                  {errors.email && <p role="alert" className="text-xs text-danger-700 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="rp-code" className="admin-label">6-digit code</label>
                  <input id="rp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); clear() }} className={input} placeholder="123456" aria-invalid={!!errors.code} />
                  {errors.code && <p role="alert" className="text-xs text-danger-700 mt-1">{errors.code}</p>}
                </div>
                <div>
                  <label htmlFor="rp-pass" className="admin-label">New password</label>
                  <input id="rp-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); clear() }} className={input} placeholder="At least 8 characters" aria-invalid={!!errors.password} />
                  {errors.password && <p role="alert" className="text-xs text-danger-700 mt-1">{errors.password}</p>}
                </div>
                <button type="submit" disabled={busy} className="admin-btn-primary w-full justify-center">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save password'}</button>
              </form>
            )}
            <p className="text-center text-sm mt-6"><Link to="/admin/login" className="text-primary-600 hover:underline">Back to sign in</Link></p>
          </>
        )}
      </div>
    </div>
  )
}
