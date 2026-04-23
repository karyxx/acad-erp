'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import {
  BookOpen, Award, AlertCircle, DollarSign,
  TrendingUp, Calendar, ChevronRight,
} from 'lucide-react'

interface FeeRecord {
  id: number
  semesterId: number
  amount: number
  status: string
}

interface SemesterResult {
  id: number
  semesterId: number
  sgpa: number | null
  cgpa: number | null
  totalCreditsEarned: number | null
}

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
  status: string
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

interface Semester {
  id: number
  number: number
  isCurrent: boolean
}

interface Exam {
  id: number
  semesterId: number
  name: string
  examType: string
  status: string
}

interface ExamSchedule {
  id: number
  examId: number
  courseId: number
  examDate: string
  startTime: string
  endTime: string
}

interface EnrichedCourse {
  course: Course
  offering: CourseOffering
}

export default function StudentOverview() {
  const { user } = useAuth()
  const { profile, profileId, loading: profileLoading } = useStudentProfile()
  const { token } = useAuth()

  const [fees, setFees] = useState<FeeRecord[]>([])
  const [results, setResults] = useState<SemesterResult[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<EnrichedCourse[]>([])
  const [upcomingExams, setUpcomingExams] = useState<{ exam: Exam; schedule: ExamSchedule; course: Course }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !profileId) return
    loadDashboard()
  }, [token, profileId])

  async function loadDashboard() {
    setLoading(true)
    try {
      // Get student's registrations
      const regsRes = await gqlRequest<{ getMySemesterRegistrations: SemesterRegistration[] }>(
        `query { getMySemesterRegistrations { id studentId semesterId status } }`,
        {}, token!
      ).catch(() => ({ getMySemesterRegistrations: [] }))
      const foundRegs = regsRes.getMySemesterRegistrations

      const semesterIds = Array.from(new Set(foundRegs.map(r => r.semesterId)))

      // Parallel fetches
      const [feesRes, semestersRes, coursesRes, offeringsRes] = await Promise.all([
        gqlRequest<{ getStudentFeeStatus: FeeRecord[] }>(
          `query { getStudentFeeStatus(studentId: ${profileId}) { id semesterId amount status } }`,
          {}, token!
        ).catch(() => ({ getStudentFeeStatus: [] })),
        gqlRequest<{ getSemesters: Semester[] }>(
          'query { getSemesters { id number isCurrent } }', {}, token!
        ).catch(() => ({ getSemesters: [] })),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name credits } }', {}, token!
        ).catch(() => ({ getCourses: [] })),
        gqlRequest<{ getCourseOfferings: CourseOffering[] }>(
          'query { getCourseOfferings { id courseId semesterId } }', {}, token!
        ).catch(() => ({ getCourseOfferings: [] })),
      ])

      setFees(feesRes.getStudentFeeStatus)

      const semMap = new Map(semestersRes.getSemesters.map(s => [s.id, s]))
      const coursesMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))
      const offeringsMap = new Map(offeringsRes.getCourseOfferings.map(o => [o.id, o]))

      // Get current semester
      const currentSem = semestersRes.getSemesters.find(s => s.isCurrent)
      const currentReg = foundRegs.find(r => r.semesterId === currentSem?.id)

      // Get current semester results
      const resultFetches = foundRegs.map(reg =>
        gqlRequest<{ getStudentSemesterResult: SemesterResult | null }>(
          `query { getStudentSemesterResult(studentId: ${profileId}, semesterId: ${reg.semesterId}) {
            id semesterId sgpa cgpa totalCreditsEarned
          } }`,
          {}, token!
        ).catch(() => ({ getStudentSemesterResult: null }))
      )
      const resultResponses = await Promise.all(resultFetches)
      const allResults = resultResponses
        .map(r => r.getStudentSemesterResult)
        .filter(Boolean) as SemesterResult[]
      setResults(allResults)

      // Get enrolled courses for current semester
      if (currentReg) {
        const subRegsRes = await gqlRequest<{ getSubjectRegistrations: SubjectRegistration[] }>(
          `query { getSubjectRegistrations(registrationId: ${currentReg.id}) { id registrationId courseOfferingId isBacklog } }`,
          {}, token!
        ).catch(() => ({ getSubjectRegistrations: [] }))

        const enriched: EnrichedCourse[] = subRegsRes.getSubjectRegistrations
          .map(sr => {
            const offering = offeringsMap.get(sr.courseOfferingId)
            if (!offering) return null
            const course = coursesMap.get(offering.courseId)
            if (!course) return null
            return { course, offering }
          })
          .filter(Boolean) as EnrichedCourse[]
        setEnrolledCourses(enriched)
      }

      // Get upcoming exams from current semester
      if (currentSem) {
        const examsRes = await gqlRequest<{ getExams: Exam[] }>(
          `query { getExams(semesterId: ${currentSem.id}) { id semesterId name examType status } }`,
          {}, token!
        ).catch(() => ({ getExams: [] }))

        const today = new Date().setHours(0, 0, 0, 0)
        const examItems: { exam: Exam; schedule: ExamSchedule; course: Course }[] = []

        await Promise.all(examsRes.getExams.slice(0, 5).map(async exam => {
          const schedulesRes = await gqlRequest<{ getExamSchedules: ExamSchedule[] }>(
            `query { getExamSchedules(examId: ${exam.id}) { id examId courseId examDate startTime endTime } }`,
            {}, token!
          ).catch(() => ({ getExamSchedules: [] }))

          for (const s of schedulesRes.getExamSchedules) {
            if (new Date(s.examDate).setHours(0, 0, 0, 0) >= today) {
              const course = coursesMap.get(s.courseId)
              if (course) examItems.push({ exam, schedule: s, course })
            }
          }
        }))

        examItems.sort((a, b) => new Date(a.schedule.examDate).getTime() - new Date(b.schedule.examDate).getTime())
        setUpcomingExams(examItems.slice(0, 4))
      }
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading

  // Compute stats
  const latestResult = results.sort((a, b) => b.semesterId - a.semesterId)[0]
  const cgpa = latestResult?.cgpa ?? null
  const sgpa = latestResult?.sgpa ?? null
  const credits = latestResult?.totalCreditsEarned ?? null
  const currentFee = fees.find(f => f.status !== 'paid')
  const profileName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email.split('@')[0] ?? '')
  const rollNo = profile?.rollNumber ?? ''

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Overview' }]} />
      <div className="p-6 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {profileName.split(' ')[0] || '—'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {rollNo && `${rollNo} · `}
            {profile?.departmentId ? `Dept. ${profile.departmentId} · ` : ''}
            Active
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">CGPA</div>
            <div className="stat-value">{isLoading ? '—' : cgpa !== null ? cgpa.toFixed(2) : 'N/A'}</div>
            <div className="stat-sub"><Award size={13} style={{ color: '#5B4DCC' }} /> out of 10.00</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Latest SGPA</div>
            <div className="stat-value">{isLoading ? '—' : sgpa !== null ? sgpa.toFixed(2) : 'N/A'}</div>
            <div className="stat-sub"><TrendingUp size={13} style={{ color: '#15803D' }} /> current semester</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Credits Earned</div>
            <div className="stat-value">{isLoading ? '—' : credits !== null ? credits : 'N/A'}</div>
            <div className="stat-sub"><BookOpen size={13} style={{ color: '#1D4ED8' }} /> accumulated</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fee Status</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {isLoading ? '—' : fees.length === 0 ? 'N/A' : currentFee ? (
                <span className="badge badge-red">Pending</span>
              ) : (
                <span className="badge badge-green">Paid</span>
              )}
            </div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
              {fees.length > 0 && currentFee
                ? `₹${currentFee.amount.toLocaleString('en-IN')} due`
                : 'No dues'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Current courses */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Current Semester Courses
              </h2>
              <a href="/student/courses" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                View all <ChevronRight size={12} />
              </a>
            </div>
            {isLoading ? (
              <div className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
            ) : enrolledCourses.length === 0 ? (
              <div className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                No courses found for current semester.
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledCourses.map(({ course, offering }) => (
                    <tr key={offering.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          {course.code}
                        </span>
                      </td>
                      <td className="font-medium text-sm">{course.name}</td>
                      <td className="text-sm">{course.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Upcoming exams */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming Exams</h2>
              </div>
              {isLoading ? (
                <div className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
              ) : upcomingExams.length === 0 ? (
                <div className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming exams.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {upcomingExams.map(({ exam, schedule, course }) => (
                    <div key={schedule.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {course.code} — {exam.examType}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{course.name}</div>
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(schedule.examDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CGPA Goal tracker */}
            {profile?.targetCgpa && (
              <div className="card px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>CGPA Goal Tracker</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Current</div>
                      <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {cgpa !== null ? cgpa.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Target</div>
                      <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--accent)' }}>
                        {profile.targetCgpa.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${cgpa !== null ? Math.min(100, (cgpa / profile.targetCgpa) * 100) : 0}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                  {cgpa !== null && cgpa < profile.targetCgpa && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {cgpa.toFixed(2)} of {profile.targetCgpa.toFixed(2)} target
                    </p>
                  )}
                  {cgpa !== null && cgpa >= profile.targetCgpa && (
                    <p className="text-xs" style={{ color: '#15803D' }}>
                      ✓ Target achieved!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
