import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading: authLoading, error: authError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setIsSubmitting(true)

    // Basic validation
    if (!email.trim()) {
      setLocalError('Please enter your university email')
      setIsSubmitting(false)
      return
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address')
      setIsSubmitting(false)
      return
    }

    if (!password) {
      setLocalError('Please enter your password')
      setIsSubmitting(false)
      return
    }

    const result = await login(email.trim(), password)

    if (result.success) {
      navigate('/admin/dashboard', { replace: true })
    } else {
      setLocalError(result.error)
    }
    setIsSubmitting(false)
  }

  const error = localError || authError

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="flex items-center gap-3 text-admin-600">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-admin-50 flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-admin-900 text-white flex-col justify-between p-8 sm:p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MyCampus</h1>
              <p className="text-xs text-admin-400">Admin Panel</p>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Welcome back
          </h2>
          <p className="text-admin-300 text-lg max-w-md">
            Sign in to manage your campus — notices, events, exams, results, placements, and settings.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-admin-400 text-sm">
          <Shield className="w-5 h-5 flex-shrink-0" />
          <span>Secured with university email verification</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-admin-900 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-admin-900">MyCampus</h1>
              <p className="text-xs text-admin-500">Admin Panel</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-admin-900">Sign in</h2>
            <p className="text-admin-500 mt-1">Use your university email and password</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-2 text-sm text-danger-700" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-admin-700 mb-1.5">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setLocalError('')}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 border border-admin-200 rounded-lg text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-admin-100 disabled:cursor-not-allowed"
                  placeholder="admin@university.edu.in"
                  aria-describedby={error ? 'email-error' : undefined}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-admin-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-400" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setLocalError('')}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-12 py-3 border border-admin-200 rounded-lg text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-admin-100 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                  aria-describedby={error ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-400 hover:text-admin-600 disabled:cursor-not-allowed"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full admin-btn-primary py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-8 p-4 bg-admin-50 border border-admin-200 rounded-lg">
            <p className="text-xs font-medium text-admin-700 mb-2">Demo Credentials (any password works):</p>
            <ul className="text-xs text-admin-600 space-y-1 font-mono">
              <li>rajesh.kumar@cvrp.edu.in (Super Admin)</li>
              <li>anita.sharma@cvrp.edu.in (Moderator)</li>
              <li>vikram.singh@cvrp.edu.in (Exam Controller)</li>
            </ul>
          </div>

          <p className="mt-6 text-center text-sm text-admin-500">
            <span className="font-medium text-admin-700">MyCampus</span> — Verified Campus Platform
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage