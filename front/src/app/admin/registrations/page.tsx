'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Calendar, Settings } from 'lucide-react'

export default function AdminRegistrations() {
  const [startDate, setStartDate] = useState('2026-07-01')
  const [endDate, setEndDate] = useState('2026-08-15')
  
  const today = new Date().toISOString().split('T')[0]
  const windowOpen = today >= startDate && today <= endDate

  const handleUpdateWindow = () => {
    alert(`Registration window updated: ${startDate} to ${endDate}`)
    // This would typically trigger the 'update_registration_window' GraphQL mutation
  }

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Registrations' }]} />
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Enrollment Control</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage course registration windows for the upcoming semester.</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
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
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-4 text-gray-700">Set Window Dates</h3>
            <div className="flex gap-6 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                <input 
                  type="date" 
                  className="erp-input w-full" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                <input 
                  type="date" 
                  className="erp-input w-full" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button 
                className="btn-primary whitespace-nowrap"
                onClick={handleUpdateWindow}
              >
                <Settings size={16} />
                Update Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
