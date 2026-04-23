'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

const MOCK_SUBMISSIONS = [
  { id: 1, course: 'CS601 · Compiler Design', faculty: 'Dr. John Smith', status: 'submitted', date: '2026-04-20' },
  { id: 2, course: 'EE401 · Control Systems', faculty: 'Dr. Jane Doe', status: 'approved', date: '2026-04-18' },
  { id: 3, course: 'MA201 · Linear Algebra', faculty: 'Dr. Alan Turing', status: 'pending', date: null },
]

export default function AdminAssessments() {
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS)

  const handleAction = (id: number, action: 'approved' | 'revision_requested') => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s))
  }

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Grade Approvals' }]} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Grade Approvals</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Review and publish final course grades submitted by faculty.</p>
        </div>

        <div className="card overflow-hidden">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Instructor</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id}>
                  <td className="font-medium text-sm">{s.course}</td>
                  <td className="text-sm">{s.faculty}</td>
                  <td className="text-sm">{s.date || '--'}</td>
                  <td>
                    {s.status === 'submitted' && <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}><Clock size={12} className="inline mr-1" />Pending Review</span>}
                    {s.status === 'approved' && <span className="badge" style={{ background: '#F0FDF4', color: '#15803D' }}><CheckCircle2 size={12} className="inline mr-1" />Published</span>}
                    {s.status === 'revision_requested' && <span className="badge" style={{ background: '#FEF2F2', color: '#B91C1C' }}><XCircle size={12} className="inline mr-1" />Revision Requested</span>}
                    {s.status === 'pending' && <span className="badge" style={{ background: '#F9FAFB', color: '#6B7280' }}>Awaiting Submission</span>}
                  </td>
                  <td>
                    {s.status === 'submitted' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAction(s.id, 'approved')} className="text-xs font-semibold text-green-700 hover:underline">Approve</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => handleAction(s.id, 'revision_requested')} className="text-xs font-semibold text-red-700 hover:underline">Request Revision</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  )
}
