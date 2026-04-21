'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Award, TrendingUp, Target, BookOpen } from 'lucide-react'

interface SemesterResult {
  id: number
  studentId: number
  semesterId: number
  sgpa: number | null
  cgpa: number | null
  totalCreditsEarned: number | null
}

interface SemesterRegistration {
  id: number
  studentId: number
  semesterId: number
}

interface Semester {
  id: number
  number: number
  startDate: string
  endDate: string
  isCurrent: boolean
}

interface AssessmentComponent {
  id: number
  offeringId: number
  name: string
  maxMarks: number
  weightagePct: number | null
}

interface StudentMark {
  id: number
  componentId: number
  studentId: number
  marksObtained: number | null
  isAbsent: boolean
}

interface SubjectRegistration {
  id: number
  registrationId: number
  courseOfferingId: number
  isBacklog: boolean
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

interface EnrichedSemResult {
  result: SemesterResult | null
  semester: Semester
  courses: { course: Course; components: AssessmentComponent[]; marks: StudentMark[] }[]
}

function GradeBar({ obtained, max }: { obtained: number; max: number }) {
  const pct = Math.min(100, (obtained / max) * 100)
  const color = pct >= 80 ? '#15803D' : pct >= 60 ? '#B45309' : '#B91C1C'
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="progress-bar flex-1">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-secondary)', minWidth: 44 }}>
        {obtained}/{max}
      </span>
    </div>
  )
}

export default function StudentGrades() {
  const { token } = useAuth()
  const { profile, profileId, loading: profileLoading } = useStudentProfile()

  const [semResults, setSemResults] = useState<EnrichedSemResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSem, setExpandedSem] = useState<number | null>(null)

  useEffect(() => {
    if (!token || !profileId) return
    loadGrades()
  }, [token, profileId])

  async function loadGrades() {
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

      // 2. Fetch semesters, courses, offerings, marks
      const [semestersRes, coursesRes, offeringsRes, marksRes] = await Promise.all([
        gqlRequest<{ getSemesters: Semester[] }>(
          'query { getSemesters { id number startDate endDate isCurrent } }', {}, token!
        ).catch(() => ({ getSemesters: [] })),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name credits } }', {}, token!
        ).catch(() => ({ getCourses: [] })),
        gqlRequest<{ getCourseOfferings: CourseOffering[] }>(
          'query { getCourseOfferings { id courseId semesterId } }', {}, token!
        ).catch(() => ({ getCourseOfferings: [] })),
        gqlRequest<{ getStudentMarks: StudentMark[] }>(
          `query { getStudentMarks(studentId: ${profileId}) { id componentId studentId marksObtained isAbsent } }`,
          {}, token!
        ).catch(() => ({ getStudentMarks: [] })),
      ])

      const semMap = new Map(semestersRes.getSemesters.map(s => [s.id, s]))
      const coursesMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))
      const offeringsMap = new Map(offeringsRes.getCourseOfferings.map(o => [o.id, o]))
      const marksById = new Map(marksRes.getStudentMarks.map(m => [m.componentId, m]))

      // 3. For each semester registration, get results and subject details
      const enriched: EnrichedSemResult[] = await Promise.all(
        foundRegs.map(async reg => {
          const semester = semMap.get(reg.semesterId)
          if (!semester) return null

          const [resultRes, subRegsRes] = await Promise.all([
            gqlRequest<{ getStudentSemesterResult: SemesterResult | null }>(
              `query { getStudentSemesterResult(studentId: ${profileId}, semesterId: ${reg.semesterId}) {
                id studentId semesterId sgpa cgpa totalCreditsEarned
              } }`,
              {}, token!
            ).catch(() => ({ getStudentSemesterResult: null })),
            gqlRequest<{ getSubjectRegistrations: SubjectRegistration[] }>(
              `query { getSubjectRegistrations(registrationId: ${reg.id}) { id registrationId courseOfferingId isBacklog } }`,
              {}, token!
            ).catch(() => ({ getSubjectRegistrations: [] })),
          ])

          // For each subject, get assessment components
          const courseEntries = await Promise.all(
            subRegsRes.getSubjectRegistrations.map(async sr => {
              const offering = offeringsMap.get(sr.courseOfferingId)
              if (!offering) return null
              const course = coursesMap.get(offering.courseId)
              if (!course) return null

              const compRes = await gqlRequest<{ getAssessmentComponents: AssessmentComponent[] }>(
                `query { getAssessmentComponents(offeringId: ${offering.id}) {
                  id offeringId name maxMarks weightagePct
                } }`,
                {}, token!
              ).catch(() => ({ getAssessmentComponents: [] }))

              const marks = compRes.getAssessmentComponents
                .map(c => marksById.get(c.id))
                .filter(Boolean) as StudentMark[]

              return { course, components: compRes.getAssessmentComponents, marks }
            })
          )

          return {
            result: resultRes.getStudentSemesterResult,
            semester,
            courses: courseEntries.filter(Boolean) as { course: Course; components: AssessmentComponent[]; marks: StudentMark[] }[],
          }
        })
      )

      const filtered = enriched.filter(Boolean) as EnrichedSemResult[]
      // Sort by semester number descending (newest first)
      filtered.sort((a, b) => b.semester.number - a.semester.number)
      setSemResults(filtered)

      // Auto-expand current semester
      const currentSemResult = filtered.find(r => r.semester.isCurrent)
      if (currentSemResult) setExpandedSem(currentSemResult.semester.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load grades')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading

  const latestWithGpa = semResults.find(r => r.result?.cgpa !== null)
  const currentCgpa = latestWithGpa?.result?.cgpa ?? null
  const currentSgpa = semResults.find(r => r.semester.isCurrent)?.result?.sgpa ?? null
  const latestCredits = latestWithGpa?.result?.totalCreditsEarned ?? null

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Grades & GPA' }]} />
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Current CGPA</div>
            <div className="stat-value">{isLoading ? '—' : currentCgpa !== null ? currentCgpa.toFixed(2) : 'N/A'}</div>
            <div className="stat-sub"><Award size={13} style={{ color: 'var(--accent)' }} /> out of 10.00</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Current SGPA</div>
            <div className="stat-value">{isLoading ? '—' : currentSgpa !== null ? currentSgpa.toFixed(2) : 'N/A'}</div>
            <div className="stat-sub"><TrendingUp size={13} style={{ color: '#15803D' }} /> this semester</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Credits Earned</div>
            <div className="stat-value">{isLoading ? '—' : latestCredits !== null ? latestCredits : 'N/A'}</div>
            <div className="stat-sub"><BookOpen size={13} style={{ color: '#1D4ED8' }} /> accumulated</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Target CGPA</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>
              {profile?.targetCgpa !== null && profile?.targetCgpa !== undefined
                ? profile.targetCgpa.toFixed(2)
                : 'Not set'}
            </div>
            <div className="stat-sub"><Target size={13} style={{ color: 'var(--accent)' }} /> goal</div>
          </div>
        </div>

        {/* Semester history */}
        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading grades…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>{error}</div>
        ) : semResults.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <Award size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No grade data found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {semResults.map(({ result, semester, courses }) => {
              const isExpanded = expandedSem === semester.id
              return (
                <div key={semester.id} className="card overflow-hidden">
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                    onClick={() => setExpandedSem(isExpanded ? null : semester.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Semester {semester.number}
                          </span>
                          {semester.isCurrent && <span className="badge badge-purple">Current</span>}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(semester.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          {' – '}
                          {new Date(semester.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {result?.sgpa !== null && result?.sgpa !== undefined ? (
                        <div className="text-right">
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>SGPA</div>
                          <div
                            className="text-lg font-bold tabular-nums"
                            style={{ color: result.sgpa >= 8.5 ? '#15803D' : result.sgpa >= 7 ? 'var(--text-primary)' : '#B45309' }}
                          >
                            {result.sgpa.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-gray">Results pending</span>
                      )}
                      {result?.cgpa !== null && result?.cgpa !== undefined && (
                        <div className="text-right">
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>CGPA</div>
                          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                            {result.cgpa.toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>{isExpanded ? '↑' : '↓'}</div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      {courses.length === 0 ? (
                        <div className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          No subject details available.
                        </div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                          {courses.map(({ course, components, marks }) => {
                            const marksByComp = new Map(marks.map(m => [m.componentId, m]))
                            return (
                              <div key={course.id} className="px-5 py-3.5">
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                                    {course.code}
                                  </span>
                                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {course.name}
                                  </span>
                                  <span className="badge badge-gray">{course.credits} cr</span>
                                </div>
                                {components.length > 0 ? (
                                  <div className="space-y-2">
                                    {components.map(comp => {
                                      const mark = marksByComp.get(comp.id)
                                      return (
                                        <div key={comp.id} className="flex items-center gap-3">
                                          <div style={{ width: 140, flexShrink: 0 }}>
                                            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                              {comp.name}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                              /{comp.maxMarks}{comp.weightagePct ? ` · ${comp.weightagePct}%` : ''}
                                            </div>
                                          </div>
                                          {mark ? (
                                            mark.isAbsent ? (
                                              <span className="badge badge-red">Absent</span>
                                            ) : mark.marksObtained !== null ? (
                                              <GradeBar obtained={mark.marksObtained} max={comp.maxMarks} />
                                            ) : (
                                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not entered</span>
                                            )
                                          ) : (
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    No assessment components defined.
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
