'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function RootPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    // Redirect based on role
    if (user.roles.includes('Admin')) router.replace('/admin')
    else if (user.roles.includes('Faculty')) router.replace('/faculty')
    else router.replace('/student')
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        Loading…
      </div>
    </div>
  )
}
