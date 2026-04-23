'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import {
  BookOpen, Users, AlertTriangle, ChevronRight,
  Clock, BarChart3, CheckCircle2, Calendar
} from 'lucide-react'
import Link from 'next/link'

interface FacultyProfile {
  id: number
  userId: number
  employeeId: string
  firstName: string
  lastName: string
  departmentId: number
  title: string | null
  isActive: boolean
}

interface CourseOffering {
  id: number
  courseId: number
  semesterId: number
  batchId: number
}

interface Course {
  id: number
  code: string
  name: string
  credits: number
  courseType: string
}

interface LowAttendanceStudent {
  studentId: number
  attendancePercentage: number
}

// Mock data for richer UI
const MOCK_COURSES = [
  { id: 1, code: 'CS601', name: 'Compiler Design', batch: 'B.Tech CSE 2022', students: 62, offeringId: 1 },
  { id: 2, code: 'CS603', name: 'Distributed Systems', batch: 'B.Tech CSE 2022', students: 58, offeringId: 2 },
  { id: 3, code: 'CS691', name: 'Systems Lab', batch: 'B.Tech EE 2022', students: 45, offeringId: 3 },
]

const MOCK_UPCOMING = [
  { course: 'CS601', type: 'Lecture', room: 'LT-1', time: '8:00 – 8:55', day: 'Today' },
  { course: 'CS691', type: 'Lab', room: 'Lab-A', time: '11:00 – 11:55', day: 'Today' },
  { course: 'CS603', type: 'Lecture', room: 'LT-3', time: '8:00 – 8:55', day: 'Tomorrow' },
]

const MOCK_LOW_ATTENDANCE = [
  { rollNo: '22CS0047', name: 'Rohan Das', course: 'CS601', pct: 68 },
  { rollNo: '22CS0089', name: 'Sneha Agarwal', course: 'CS603', pct: 71 },
  { rollNo: '22CS0112', name: 'Vikram Iyer', course: 'CS601', pct: 74 },
]

export default function FacultyOverview() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState<FacultyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    gqlRequest<{ getFacultyProfile: FacultyProfile }>(
      `query { getFacultyProfile(profileId: 1) {
        id userId employeeId firstName lastName departmentId title isActive
      }}`,
      {}, token
    ).then(d => setProfile(d.getFacultyProfile)).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  const name = profile ? `${profile.title ?? ''} ${profile.firstName} ${profile.lastName}`.trim() : (user?.email.split('@')[0] ?? 'Faculty')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Overview' }]} />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {profile?.firstName ?? name.split(' ')[0]}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {profile?.employeeId ?? '—'} · Semester VI · Active
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Courses Assigned</div>
            <div className="stat-value">3</div>
            <div className="stat-sub"><BookOpen size={13} style={{ color: 'var(--accent)' }} /> This semester</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">165</div>
            <div className="stat-sub"><Users size={13} style={{ color: '#15803D' }} /> Across all courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Attendance</div>
            <div className="stat-value">3</div>
            <div className="stat-sub"><AlertTriangle size={13} style={{ color: '#B45309' }} /> Below 75%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Marks</div>
            <div className="stat-value">2</div>
            <div className="stat-sub"><BarChart3 size={13} style={{ color: '#1D4ED8' }} /> Components pending</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* My courses */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h2>
              <Link href="/faculty/courses" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Students</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COURSES.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-mono text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{c.code}</span></td>
                    <td className="font-medium text-sm">{c.name}</td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.batch}</td>
                    <td className="text-sm">{c.students}</td>
                    <td>
                      <Link href={`/faculty/courses/${c.offeringId}`} className="text-xs" style={{ color: 'var(--accent)' }}>
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Today's schedule */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming Classes</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {MOCK_UPCOMING.map((s, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>{s.course}</span>
                        <span className="badge badge-gray text-xs">{s.type}</span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {s.room} · {s.time}
                      </div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: s.day === 'Today' ? '#15803D' : 'var(--text-secondary)' }}>
                      {s.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Low attendance alert */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: '#B45309' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Low Attendance Alerts</h2>
              <span className="badge badge-amber">3 students</span>
            </div>
            <Link href="/faculty/attendance" className="text-xs" style={{ color: 'var(--accent)' }}>
              Manage attendance →
            </Link>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student</th>
                <th>Course</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LOW_ATTENDANCE.map(s => (
                <tr key={s.rollNo}>
                  <td><span className="font-mono text-xs">{s.rollNo}</span></td>
                  <td className="font-medium text-sm">{s.name}</td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.course}</td>
                  <td>
                    <AttendancePill pct={s.pct} />
                  </td>
                  <td>
                    <span className="badge badge-amber">Warning sent</span>
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

function AttendancePill({ pct }: { pct: number }) {
  const color = pct >= 85 ? '#15803D' : pct >= 75 ? '#B45309' : '#B91C1C'
  const bg = pct >= 85 ? '#F0FDF4' : pct >= 75 ? '#FFFBEB' : '#FEF2F2'
  return <span className="badge" style={{ background: bg, color }}>{pct}%</span>
}
