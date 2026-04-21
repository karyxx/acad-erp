'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      if (user.roles.includes('Admin')) router.replace('/admin')
      else if (user.roles.includes('Faculty')) router.replace('/faculty')
      else router.replace('/student')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-80 p-10"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              A
            </div>
            <span className="font-semibold text-lg tracking-tight">AcadERP</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Your academic<br />world, unified.
            </h1>
            <p className="text-sm opacity-75 leading-relaxed">
              Manage courses, grades, timetables, and registrations from one secure platform.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { role: 'Admin', hint: 'admin@college.edu' },
            { role: 'Faculty', hint: 'faculty@college.edu' },
            { role: 'Student', hint: 'student@college.edu' },
          ].map(({ role, hint }) => (
            <button
              key={role}
              onClick={() => { setEmail(hint); setPassword('password123') }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
            >
              <span className="font-medium">{role}</span>
              <span className="opacity-60 ml-2 text-xs">{hint}</span>
            </button>
          ))}
          <p className="text-xs opacity-50 pt-1">↑ Click to fill demo credentials</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              A
            </div>
            <span className="font-semibold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
              AcadERP
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              Sign in
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Use your institutional email address
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="erp-input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="erp-input"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="px-3 py-2.5 rounded-lg text-sm"
                style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FEE2E2' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-2.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Mobile demo credentials */}
          <div className="lg:hidden mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Demo accounts</p>
            <div className="space-y-2">
              {[
                { role: 'Admin', hint: 'admin@college.edu' },
                { role: 'Faculty', hint: 'faculty@college.edu' },
                { role: 'Student', hint: 'student@college.edu' },
              ].map(({ role, hint }) => (
                <button
                  key={role}
                  onClick={() => { setEmail(hint); setPassword('password123') }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  <span className="font-medium">{role}</span>
                  <span className="opacity-60 ml-2">{hint}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} AcadERP · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
