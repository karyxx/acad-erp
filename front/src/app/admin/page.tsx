'use client'

import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { useAuth } from '@/context/AuthContext'
import { Shield, Users, BookOpen, DollarSign, BarChart3, Building2 } from 'lucide-react'

const ADMIN_STATS = [
  { label: 'Students', value: '2,148', sub: '342 registered today', icon: <Users size={16} />, color: 'purple' },
  { label: 'Faculty', value: '184', sub: '6 departments', icon: <Shield size={16} />, color: 'blue' },
  { label: 'Courses Active', value: '67', sub: '12 with backlog seats', icon: <BookOpen size={16} />, color: 'green' },
  { label: 'Fee Collected', value: '₹1.4Cr', sub: '218 pending', icon: <DollarSign size={16} />, color: 'amber' },
]

const DEPT_ENROLLMENT = [
  { dept: 'CSE', count: 612, max: 700, color: '#4338CA' },
  { dept: 'EE', count: 480, max: 700, color: '#0F766E' },
  { dept: 'ME', count: 374, max: 700, color: '#854D0E' },
  { dept: 'CE', count: 280, max: 700, color: '#B91C1C' },
  { dept: 'MA', count: 204, max: 700, color: '#1D4ED8' },
]

const RECENT_REGS = [
  { name: 'Aryan Mehta', program: 'B.Tech CSE', sem: 'VI', status: 'Complete' },
  { name: 'Priya Nair', program: 'M.Tech EE', sem: 'II', status: 'Complete' },
  { name: 'Rohan Das', program: 'B.Tech ME', sem: 'IV', status: 'Fee pending' },
  { name: 'Sneha Kapoor', program: 'Integrated MA', sem: 'VIII', status: 'In progress' },
  { name: 'Vikram Iyer', program: 'B.Tech CE', sem: 'II', status: 'Hostel due' },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Complete': { bg: '#F0FDF4', color: '#15803D' },
  'Fee pending': { bg: '#FFFBEB', color: '#B45309' },
  'In progress': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Hostel due': { bg: '#FEF2F2', color: '#B91C1C' },
}

export default function AdminOverview() {
  const { user } = useAuth()

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Overview' }]} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Good morning, Admin
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Semester VI · Active · 14 weeks remaining
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {ADMIN_STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>{s.icon}</span>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Recent registrations */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Registrations</h2>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Program</th>
                  <th>Semester</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_REGS.map(r => {
                  const s = STATUS_STYLE[r.status] ?? { bg: '#F9FAFB', color: '#6B7280' }
                  return (
                    <tr key={r.name}>
                      <td className="font-medium text-sm">{r.name}</td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.program}</td>
                      <td className="text-sm">{r.sem}</td>
                      <td><span className="badge" style={{ background: s.bg, color: s.color }}>{r.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Enrollment by dept */}
            <div className="card px-5 py-4">
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Enrollment by Dept.
              </h2>
              <div className="space-y-3">
                {DEPT_ENROLLMENT.map(d => (
                  <div key={d.dept} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--text-secondary)' }}>{d.dept}</span>
                    <div className="progress-bar flex-1">
                      <div
                        className="progress-fill"
                        style={{ width: `${(d.count / d.max) * 100}%`, background: d.color }}
                      />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming exams */}
            <div className="card px-5 py-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Upcoming Exams</h2>
              <div className="space-y-2">
                {[
                  { code: 'CS601', type: 'Mid-term', date: 'Apr 24' },
                  { code: 'EE401', type: 'Quiz 2', date: 'Apr 25' },
                  { code: 'MA201', type: 'End-term', date: 'May 2' },
                  { code: 'ME301', type: 'Lab exam', date: 'May 4' },
                ].map(e => (
                  <div key={e.code} className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {e.code} — {e.type}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{e.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
