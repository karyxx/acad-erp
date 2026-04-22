'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { BookOpen, Users, BarChart3, ChevronRight } from 'lucide-react'

// Mock data representing what we'd get from joining offerings+courses
const MOCK_COURSES = [
  {
    offeringId: 1,
    code: 'CS601',
    name: 'Compiler Design',
    credits: 4,
    type: 'core',
    batch: 'B.Tech CSE 2022',
    semester: 'Sem VI',
    students: 62,
    avgAttendance: 84,
    marksEntered: true,
  },
  {
    offeringId: 2,
    code: 'CS603',
    name: 'Distributed Systems',
    credits: 4,
    type: 'core',
    batch: 'B.Tech CSE 2022',
    semester: 'Sem VI',
    students: 58,
    avgAttendance: 79,
    marksEntered: false,
  },
  {
    offeringId: 3,
    code: 'CS691',
    name: 'Systems Lab',
    credits: 2,
    type: 'lab',
    batch: 'B.Tech EE 2022',
    semester: 'Sem VI',
    students: 45,
    avgAttendance: 91,
    marksEntered: true,
  },
]

export default function FacultyCourses() {
  const { token } = useAuth()
  const [courses, setCourses] = useState(MOCK_COURSES)

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'My Courses' }]} />
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>My Courses</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Semester VI · 3 courses assigned</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {courses.map(c => (
            <div key={c.offeringId} className="card overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent-light)' }}
                  >
                    <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.code}</span>
                      <span className={`badge ${c.type === 'lab' ? 'badge-green' : 'badge-purple'}`}>{c.type}</span>
                    </div>
                    <h3 className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{c.name}</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {c.batch} · {c.semester} · {c.credits} credits
                    </p>
                  </div>
                </div>
                <Link
                  href={`/faculty/courses/${c.offeringId}`}
                  className="btn-secondary text-xs"
                >
                  Manage <ChevronRight size={13} />
                </Link>
              </div>

              <div
                className="px-5 py-3 grid grid-cols-3 gap-4"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <div className="flex items-center gap-2">
                  <Users size={13} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm"><strong>{c.students}</strong> students</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Avg attendance:</span>
                  <AttPill pct={c.avgAttendance} />
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={13} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm">
                    Marks: {c.marksEntered
                      ? <span style={{ color: '#15803D' }}>Entered</span>
                      : <span style={{ color: '#B45309' }}>Pending</span>}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
