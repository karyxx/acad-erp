'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Calendar, Settings } from 'lucide-react'

export default function AdminRegistrations() {
  const [windowOpen, setWindowOpen] = useState(false)

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Registrations' }]} />
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Enrollment Control</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage course registration windows for the upcoming semester.</p>
        </div>

        <div className="card p-6 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Registration Window</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              When open, students can log in and register for their courses for the upcoming semester.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: windowOpen ? '#15803D' : '#6B7280' }}>
              <Calendar size={16} />
              {windowOpen ? 'Window is currently OPEN' : 'Window is CLOSED'}
            </div>
          </div>
          
          <button 
            className={`btn-primary ${windowOpen ? 'bg-red-600 hover:bg-red-700' : ''}`}
            onClick={() => setWindowOpen(!windowOpen)}
          >
            <Settings size={16} />
            {windowOpen ? 'Close Registration' : 'Open Registration'}
          </button>
        </div>
      </div>
    </AuthGuard>
  )
}
