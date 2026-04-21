'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '@/context/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (requiredRole && !user.roles.includes(requiredRole)) {
      // Redirect to their actual dashboard
      if (user.roles.includes('Admin')) router.replace('/admin')
      else if (user.roles.includes('Faculty')) router.replace('/faculty')
      else router.replace('/student')
    }
  }, [user, isLoading, requiredRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return null
  if (requiredRole && !user.roles.includes(requiredRole)) return null

  return <>{children}</>
}
