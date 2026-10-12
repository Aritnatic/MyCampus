import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, Shield, AlertCircle, Loader2, User, GraduationCap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MODES = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Manage your campus: notices, events, exams, results, placements.',
    icon: Shield,
    accent: 'admin',
    demoEmail: 'rajesh.kumar@cvrp.edu.in',
  },
  {
    id: 'university',
    label: 'University',
    description: 'Verified student or faculty. Sees your university only.',
    icon: GraduationCap,
    accent: 'primary',
    demoEmail: 'aritra.das@students.cvrp.edu.in',
  },
  {
    id: 'individual',
    label: 'Individual',
    description: 'Personal account. Discover cross-university projects & people.',
    icon: User,
    accent: 'success',
    demoEmail: 'priya.sharma@gmail.com',
  },
]

const ACCENT_CLASSES = {
  admin:    { ring: 'ring-admin-900',    bg: 'bg-admin-900',    text: 'text-white' },
  primary:  { ring: 'ring-primary-500',  bg: 'bg-primary-600',  text: 'text-white' },
  success:  { ring: 'ring-success-500',  bg: 'bg-success-600',  text: 'text-white' },
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login, loading: authLoading, error: authError, isAuthenticated, mode: currentMode } = useAuth()

  const [mode, setMode] = useState(() => {
    const fromUrl = searchParams.get('mode')
    return MODES.some(m => m.id === fromUrl) ? fromUrl : 'admin'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already signed in and mode matches, bounce to dashboard.
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentMode === 'admin') {
      const from = location.state?.from?.pathname || '/admin/dashboard'
      navigate(from, { replace: true })
    }
  }, [authLoading, isAuthenticated, currentMode, location.state, navigate])

  const from = location.state?.from?.pathname || '/admin/dashboard'
  const activeMode = MODES.find(m => m.id === mode)
  const accent = ACCENT_CLASSES[activeMode.accent]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setIsSubmitting(true)

    const result = await login(email.trim(), password, mode)
    setIsSubmitting(false)

    if (!result.success) {
      setLocalError(result.error)
      return
    }

    // Route based on mode.
    if (mode === 'admin') {
      navigate(from, { replace: true })
    } else {
      // Individual and University users: show a friendly placeholder.
      // (No /university or /individual routes exist yet — we surface a
      // coming-soon screen instead of bouncing them into the admin shell.)
      setLocalError('University and Individual portals are coming soon. Please use the Admin tab to sign in for now.')
      // Force back to admin mode so the next submit doesn't re-trigger
      setMode('admin')
    }
  }

  const error = localError || authError

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="flex items-center gap-3 text-admin-600" role="status" aria-live="polite">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-admin-50 flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-admin-900 text-white flex-col justify-between p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" aria-hidden="true" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MyCampus</h1>
              <p className="text-xs text-admin-400">Verified Campus Platform</p>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            One campus. Every opportunity.
          </h2>
          <p className="text-admin-300 text-lg max-w-md">
            Notices, events, exams, results, placements, and cross-university discovery — verified end to end.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-admin-400 text-sm">
          <Shield className="w-5 h-5 flex-shrink-0" />
          <span>Scoped access · University data stays inside your campus</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-admin-900 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-admin-900">MyCampus</h1>
              <p className="text-xs text-admin-500">Verified Campus Platform</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-admin-900">Sign in</h2>
            <p className="text-admin-500 mt-1">Choose how you're signing in</p>
          </div>

          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-2 mb-6" role="tablist" aria-label="Login mode">
            {MODES.map((m) => {
              const Icon = m.icon
              const isActive = m.id === mode
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => { setMode(m.id); setLocalError(''); setEmail('') }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isActive
                      ? `border-transparent ${accent.bg} ${accent.text} focus:ring-primary-500`
                      : 'border-admin-200 bg-white text-admin-600 hover:border-admin-300 hover:bg-admin-50 focus:ring-primary-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          <p className="text-sm text-admin-500 mb-6 text-center">{activeMode.description}</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2 text-sm text-danger-700" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="admin-label">
                {mode === 'admin' ? 'Admin email' : mode === 'university' ? 'University email' : 'Personal email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setLocalError('')}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 border border-admin-200 rounded-lg text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-admin-100 disabled:cursor-not-allowed"
                  placeholder={mode === 'admin' ? 'admin@university.edu.in' : mode === 'university' ? 'you@cvrp.edu.in' : 'you@gmail.com'}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="admin-label">Password</label>
                <Link to="/admin/reset" className="text-xs text-primary-600 hover:underline">Forgot password or have a code?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-400" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setLocalError('')}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-12 py-2.5 border border-admin-200 rounded-lg text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-admin-100 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-400 hover:text-admin-600 disabled:cursor-not-allowed"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white ${accent.bg} hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign in as {activeMode.label}</span>
              )}
            </button>
          </form>

          {/* Dev-only hint: the seeded accounts from `npm run seed` in backend/ */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-3 bg-admin-50 border border-admin-200 rounded-lg">
              <p className="text-xs font-medium text-admin-700 mb-1">Dev seed account (password: campus123):</p>
              <button
                type="button"
                onClick={() => setEmail(activeMode.demoEmail)}
                className="text-xs text-primary-600 hover:underline font-mono break-all"
              >
                {activeMode.demoEmail}
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-admin-500">
            <span className="font-medium text-admin-700">MyCampus</span> — Verified Campus Platform
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
