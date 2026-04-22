'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { AlertTriangle, Mail, CheckCircle2, Save } from 'lucide-react'

interface LowAttendanceStudent {
  studentId: number
  attendancePercentage: number
}

const MOCK_SUMMARY = [
  {
    offeringId: 1, code: 'CS601', name: 'Compiler Design',
    sessions: 28, avgPct: 84,
    students: [
      { id: 1, roll: '22CS0101', name: 'Aryan Mehta', pct: 88, sessions: 25 },
      { id: 2, roll: '22CS0047', name: 'Rohan Das', pct: 68, sessions: 19 },
      { id: 3, roll: '22CS0089', name: 'Sneha Agarwal', pct: 71, sessions: 20 },
      { id: 4, roll: '22CS0112', name: 'Vikram Iyer', pct: 74, sessions: 21 },
      { id: 5, roll: '22CS0198', name: 'Divya Pillai', pct: 92, sessions: 26 },
      { id: 6, roll: '22CS0061', name: 'Kiran Reddy', pct: 85, sessions: 24 },
    ]
  },
  {
    offeringId: 2, code: 'CS603', name: 'Distributed Systems',
    sessions: 24, avgPct: 79,
    students: [
      { id: 6, roll: '22CS0061', name: 'Kiran Reddy', pct: 85, sessions: 20 },
      { id: 7, roll: '22CS0220', name: 'Neha Gupta', pct: 71, sessions: 17 },
    ]
  },
  {
    offeringId: 3, code: 'CS691', name: 'Systems Lab',
    sessions: 12, avgPct: 92,
    students: [
      { id: 1, roll: '22CS0101', name: 'Aryan Mehta', pct: 95, sessions: 11 },
      { id: 5, roll: '22CS0198', name: 'Divya Pillai', pct: 88, sessions: 10 },
    ]
  },
]

export default function FacultyAttendance() {
  const { token } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState(MOCK_SUMMARY[0])
  const [warningsSent, setWarningsSent] = useState<Set<number>>(new Set())
  const [lowAttendance, setLowAttendance] = useState<LowAttendanceStudent[]>([])

  useEffect(() => {
    if (!token) return
    // Try to fetch real low attendance data from backend
    gqlRequest<{ getLowAttendanceStudents: LowAttendanceStudent[] }>(
      `query { getLowAttendanceStudents(offeringId: 1, thresholdPct: 75.0) { studentId attendancePercentage } }`,
      {}, token
    ).then(d => {
      if (d.getLowAttendanceStudents?.length) {
        setLowAttendance(d.getLowAttendanceStudents)
      }
    }).catch(() => {})
  }, [token])

  const handleWarning = (studentId: number) => {
    setWarningsSent(prev => {
      const next = new Set(prev)
      next.add(studentId)
      return next
    })
  }

  const lowStudents = selectedCourse.students.filter(s => s.pct < 75)

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Attendance' }]} />
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Attendance</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track and manage student attendance across your courses
          </p>
        </div>

        {/* Course selector */}
        <div className="flex items-center gap-2">
          {MOCK_SUMMARY.map(c => (
            <button
              key={c.offeringId}
              onClick={() => setSelectedCourse(c)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedCourse.offeringId === c.offeringId ? 'var(--accent)' : 'var(--bg-card)',
                color: selectedCourse.offeringId === c.offeringId ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${selectedCourse.offeringId === c.offeringId ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {c.code} · {c.name}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">{selectedCourse.sessions}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Conducted so far</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Class Average</div>
            <div className="stat-value">{selectedCourse.avgPct}%</div>
            <div className="stat-sub" style={{ color: selectedCourse.avgPct >= 75 ? '#15803D' : '#B45309' }}>
              {selectedCourse.avgPct >= 75 ? 'Above threshold' : 'Below threshold'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Attendance</div>
            <div className="stat-value">{lowStudents.length}</div>
            <div className="stat-sub" style={{ color: lowStudents.length > 0 ? '#B45309' : '#15803D' }}>
              {lowStudents.length > 0 ? 'Need attention' : 'All clear'}
            </div>
          </div>
        </div>

        {/* Low attendance warning section */}
        {lowStudents.length > 0 && (
          <div className="card overflow-hidden">
            <div
              className="px-5 py-4 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--border)', background: '#FFFBEB' }}
            >
              <AlertTriangle size={14} style={{ color: '#B45309' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#92400E' }}>
                Low Attendance Alert — {lowStudents.length} student{lowStudents.length > 1 ? 's' : ''} below 75%
              </h2>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Sessions Present</th>
                  <th>Attendance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStudents.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono text-xs">{s.roll}</span></td>
                    <td className="font-medium text-sm">{s.name}</td>
                    <td className="text-sm tabular-nums">{s.sessions}/{selectedCourse.sessions}</td>
                    <td><AttPill pct={s.pct} /></td>
                    <td>
                      {warningsSent.has(s.id) ? (
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#15803D' }}>
                          <CheckCircle2 size={13} /> Warning sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleWarning(s.id)}
                          className="btn-secondary text-xs"
                          style={{ padding: '4px 10px' }}
                        >
                          <Mail size={12} /> Send Warning
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Full attendance table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              All Students — {selectedCourse.code}
            </h2>
            <button className="btn-primary text-sm">
              <Save size={13} /> Mark Today
            </button>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Sessions Present</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedCourse.students.map(s => (
                <tr key={s.id}>
                  <td><span className="font-mono text-xs">{s.roll}</span></td>
                  <td className="font-medium text-sm">{s.name}</td>
                  <td className="text-sm tabular-nums">{s.sessions}/{selectedCourse.sessions}</td>
                  <td><AttPill pct={s.pct} /></td>
                  <td>
                    {s.pct < 75 ? (
                      <span className="badge badge-red">At risk</span>
                    ) : s.pct < 85 ? (
                      <span className="badge badge-amber">Borderline</span>
                    ) : (
                      <span className="badge badge-green">Good</span>
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

function AttPill({ pct }: { pct: number }) {
  const color = pct >= 85 ? '#15803D' : pct >= 75 ? '#B45309' : '#B91C1C'
  const bg = pct >= 85 ? '#F0FDF4' : pct >= 75 ? '#FFFBEB' : '#FEF2F2'
  return <span className="badge" style={{ background: bg, color }}>{pct}%</span>
}
