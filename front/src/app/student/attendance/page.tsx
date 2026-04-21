'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react'

interface SubjectRegistration {
  id: number
  registrationId: number
  courseOfferingId: number
  isBacklog: boolean
}

interface SemesterRegistration {
  id: number
  studentId: number
  semesterId: number
}

interface CourseOffering {
  id: number
  courseId: number
  semesterId: number
}

interface Course {
  id: number
  code: string
  name: string
  credits: number
}

interface AttendanceSession {
  id: number
  offeringId: number
  sessionDate: string
  startTime: string
  endTime: string
  conductedBy: number
}

interface AttendanceRecord {
  id: number
  sessionId: number
  studentId: number
  status: string
}

interface CourseAttendance {
  course: Course
  offering: CourseOffering
  sessions: AttendanceSession[]
  records: AttendanceRecord[]
  present: number
  total: number
  percentage: number | null
}

function AttendanceRing({ pct }: { pct: number }) {
  const r = 28
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 85 ? '#15803D' : pct >= 75 ? '#D97706' : '#DC2626'

  return (
    <div className="relative" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {pct.toFixed(0)}%
      </div>
    </div>
  )
}

function AttendanceCard({ ca }: { ca: CourseAttendance }) {
  const [expanded, setExpanded] = useState(false)
  const pct = ca.percentage ?? 0
  const statusColor = pct >= 85 ? '#15803D' : pct >= 75 ? '#D97706' : '#DC2626'
  const statusBg = pct >= 85 ? '#F0FDF4' : pct >= 75 ? '#FFFBEB' : '#FEF2F2'

  const sessionById = new Map(ca.sessions.map(s => [s.id, s]))
  const studentRecords = ca.records

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4"
        onClick={() => setExpanded(e => !e)}
      >
        <AttendanceRing pct={pct} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {ca.course.code}
            </span>
            {pct < 75 && (
              <span className="flex items-center gap-1 badge badge-red text-xs">
                <AlertTriangle size={10} /> Below threshold
              </span>
            )}
            {pct >= 75 && pct < 85 && (
              <span className="badge badge-amber text-xs">Low</span>
            )}
          </div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {ca.course.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {ca.present} present / {ca.total} classes
            {ca.total > 0 && pct < 75 && (
              <span style={{ color: '#DC2626', marginLeft: 8 }}>
                Need {Math.ceil((0.75 * ca.total - ca.present) / 0.25)} more classes to reach 75%
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: statusBg, color: statusColor }}
          >
            {pct.toFixed(1)}%
          </div>
        </div>
      </button>

      {expanded && ca.sessions.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ca.sessions.map(session => {
                const record = studentRecords.find(r => r.sessionId === session.id)
                const status = record?.status ?? 'absent'
                const isPresent = status.toLowerCase() === 'present'
                return (
                  <tr key={session.id}>
                    <td className="text-sm">
                      {new Date(session.sessionDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="text-sm tabular-nums">
                      {session.startTime.slice(0, 5)} – {session.endTime.slice(0, 5)}
                    </td>
                    <td>
                      {record ? (
                        <span className={`badge ${isPresent ? 'badge-green' : status === 'late' ? 'badge-amber' : status === 'excused' ? 'badge-blue' : 'badge-red'}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      ) : (
                        <span className="badge badge-gray">No record</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {expanded && ca.sessions.length === 0 && (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
          No attendance sessions recorded yet.
        </div>
      )}
    </div>
  )
}

export default function StudentAttendance() {
  const { token } = useAuth()
  const { profileId, loading: profileLoading } = useStudentProfile()

  const [courseAttendances, setCourseAttendances] = useState<CourseAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !profileId) return
    loadAttendance()
  }, [token, profileId])

  async function loadAttendance() {
    setLoading(true)
    setError(null)
    try {
      // 1. Get student's registrations
      const regsRes = await gqlRequest<{ getMySemesterRegistrations: SemesterRegistration[] }>(
        `query { getMySemesterRegistrations { id studentId semesterId } }`,
        {}, token!
      ).catch(() => ({ getMySemesterRegistrations: [] }))
      const foundRegs = regsRes.getMySemesterRegistrations

      if (foundRegs.length === 0) { setLoading(false); return }

      // 2. Get subject registrations
      const allSubRegs: SubjectRegistration[] = []
      await Promise.all(foundRegs.map(async reg => {
        const res = await gqlRequest<{ getSubjectRegistrations: SubjectRegistration[] }>(
          `query { getSubjectRegistrations(registrationId: ${reg.id}) { id registrationId courseOfferingId isBacklog } }`,
          {}, token!
        ).catch(() => ({ getSubjectRegistrations: [] }))
        allSubRegs.push(...res.getSubjectRegistrations)
      }))

      if (allSubRegs.length === 0) { setLoading(false); return }

      // 3. Fetch reference data
      const [offeringsRes, coursesRes] = await Promise.all([
        gqlRequest<{ getCourseOfferings: CourseOffering[] }>(
          'query { getCourseOfferings { id courseId semesterId } }', {}, token!
        ).catch(() => ({ getCourseOfferings: [] })),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name credits } }', {}, token!
        ).catch(() => ({ getCourses: [] })),
      ])

      const offeringsMap = new Map(offeringsRes.getCourseOfferings.map(o => [o.id, o]))
      const coursesMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))

      // 4. Fetch all attendance sessions and student records
      const allSessions: AttendanceSession[] = []
      await Promise.all(allSubRegs.map(async subReg => {
        const res = await gqlRequest<{ getOfferingAttendanceSessions: AttendanceSession[] }>(
          `query { getOfferingAttendanceSessions(offeringId: ${subReg.courseOfferingId}) {
            id offeringId sessionDate startTime endTime conductedBy
          } }`,
          {}, token!
        ).catch(() => ({ getOfferingAttendanceSessions: [] }))
        allSessions.push(...res.getOfferingAttendanceSessions)
      }))

      const recordsRes = await gqlRequest<{ getMyAttendanceRecords: AttendanceRecord[] }>(
        `query { getMyAttendanceRecords(studentId: ${profileId}) { id sessionId studentId status } }`,
        {}, token!
      ).catch(() => ({ getMyAttendanceRecords: [] }))
      const allRecords = recordsRes.getMyAttendanceRecords
      const recordsBySession = new Map(allRecords.map(r => [r.sessionId, r]))

      // Build course attendance objects
      const results: CourseAttendance[] = allSubRegs
        .map(subReg => {
          const offering = offeringsMap.get(subReg.courseOfferingId)
          if (!offering) return null
          const course = coursesMap.get(offering.courseId)
          if (!course) return null

          const mySessions = allSessions.filter(s => s.offeringId === subReg.courseOfferingId)
          const myRecords = mySessions.map(s => recordsBySession.get(s.id)).filter(Boolean) as AttendanceRecord[]
          const present = myRecords.filter(r => r.status.toLowerCase() === 'present').length
          const total = mySessions.length
          const percentage = total > 0 ? (present / total) * 100 : null
          return {
            course,
            offering,
            sessions: mySessions,
            records: myRecords,
            present,
            total,
            percentage,
          } as CourseAttendance
        })
        .filter(Boolean) as CourseAttendance[]

      setCourseAttendances(results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading

  const below75 = courseAttendances.filter(ca => ca.percentage !== null && ca.percentage < 75)
  const avg = courseAttendances.filter(ca => ca.percentage !== null)
  const avgPct = avg.length > 0 ? avg.reduce((s, ca) => s + (ca.percentage ?? 0), 0) / avg.length : null

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Attendance' }]} />
      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="stat-label">Average Attendance</div>
            <div className="stat-value">{isLoading ? '—' : avgPct !== null ? `${avgPct.toFixed(1)}%` : 'N/A'}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>across all courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Courses Below 75%</div>
            <div className="stat-value" style={{ color: below75.length > 0 ? '#DC2626' : undefined }}>
              {isLoading ? '—' : below75.length}
            </div>
            <div className="stat-sub" style={{ color: below75.length > 0 ? '#DC2626' : 'var(--text-muted)' }}>
              {below75.length > 0 ? 'At risk of debarment' : 'All clear'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Courses</div>
            <div className="stat-value">{isLoading ? '—' : courseAttendances.length}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>enrolled this semester</div>
          </div>
        </div>

        {below75.length > 0 && (
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-lg"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <AlertTriangle size={16} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
            <div className="text-sm">
              <span className="font-semibold" style={{ color: '#991B1B' }}>Attendance warning: </span>
              <span style={{ color: '#B91C1C' }}>
                {below75.map(ca => ca.course.code).join(', ')} {below75.length === 1 ? 'is' : 'are'} below the mandatory 75% threshold.
                You may be debarred from appearing in final examinations.
              </span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading attendance…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>{error}</div>
        ) : courseAttendances.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <ClipboardList size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No attendance data found</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Attendance has not been recorded for your courses yet.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {courseAttendances
              .sort((a, b) => (a.percentage ?? 100) - (b.percentage ?? 100))
              .map(ca => (
                <AttendanceCard key={ca.offering.id} ca={ca} />
              ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
