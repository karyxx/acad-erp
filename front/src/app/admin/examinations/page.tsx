'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react'

const MOCK_EXAMS = [
  { id: 1, course: 'CS601', type: 'Mid-term', date: '2026-03-15', time: '10:00 AM', venue: 'L1', status: 'completed' },
  { id: 2, course: 'CS603', type: 'Mid-term', date: '2026-03-16', time: '10:00 AM', venue: 'L2', status: 'completed' },
  { id: 3, course: 'EE401', type: 'End-term', date: '2026-05-10', time: '02:00 PM', venue: 'L1', status: 'upcoming' },
  { id: 4, course: 'MA201', type: 'End-term', date: '2026-05-12', time: '09:00 AM', venue: 'L3', status: 'upcoming' },
]

export default function AdminExaminations() {
  const [exams, setExams] = useState(MOCK_EXAMS)

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Examinations' }]} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Examination Schedule</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Schedule and manage exam dates, timings, and venues.</p>
          </div>
          <button className="btn-primary">
            <Plus size={16} /> Schedule Exam
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Exam Type</th>
                <th>Date</th>
                <th>Time & Venue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id}>
                  <td className="font-mono text-sm font-medium">{e.course}</td>
                  <td>{e.type}</td>
                  <td>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarIcon size={14} className="text-gray-400" />
                      {e.date}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5 text-sm">
                      <span className="flex items-center gap-1 text-gray-700"><Clock size={12}/> {e.time}</span>
                      <span className="text-xs text-gray-500">Venue: {e.venue}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge capitalize" style={{
                      background: e.status === 'completed' ? '#F0FDF4' : '#EFF6FF',
                      color: e.status === 'completed' ? '#15803D' : '#1D4ED8'
                    }}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                      {e.status === 'upcoming' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button className="text-xs font-semibold text-red-600 hover:underline">Cancel</button>
                        </>
                      )}
                    </div>
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
