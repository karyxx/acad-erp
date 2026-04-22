'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Tag, Hash, Users } from 'lucide-react'

interface SemesterRegistration {
  id: number
  studentId: number
  semesterId: number
  totalCredits: number
  status: string
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
  batchId: number
  syllabusUrl: string | null
}

interface Course {
  id: number
  code: string
  name: string
  departmentId: number
  credits: number
  courseType: string
  description: string | null
}

interface Semester {
  id: number
  programId: number
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
  conductedOn: string | null
}

interface StudentMark {
  id: number
  componentId: number
  studentId: number
  marksObtained: number | null
  isAbsent: boolean
}

interface OfferingFaculty {
  offeringId: number
  facultyId: number
  role: string
}

interface FacultyProfile {
  id: number
  firstName: string
  lastName: string
  title: string | null
}

interface EnrichedCourse {
  subReg: SubjectRegistration
  offering: CourseOffering
  course: Course
  semester: Semester | null
  components: AssessmentComponent[]
  marks: StudentMark[]
  faculty: FacultyProfile[]
}

function AttendanceBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="badge badge-gray">No data</span>
  const color = pct >= 85 ? 'badge-green' : pct >= 75 ? 'badge-amber' : 'badge-red'
  return <span className={`badge ${color}`}>{pct.toFixed(0)}%</span>
}

function MarkBar({ obtained, max }: { obtained: number; max: number }) {
  const pct = Math.min(100, (obtained / max) * 100)
  const color = pct >= 80 ? '#15803D' : pct >= 50 ? '#B45309' : '#B91C1C'
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="progress-bar flex-1">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)', minWidth: 48 }}>
        {obtained}/{max}
      </span>
    </div>
  )
}

function CourseCard({ ec }: { ec: EnrichedCourse }) {
  const [expanded, setExpanded] = useState(false)
  const { course, offering, subReg, semester, components, marks, faculty } = ec

  const marksByComponent = new Map(marks.map(m => [m.componentId, m]))
  const totalEarned = components.reduce((sum, c) => {
    const m = marksByComponent.get(c.id)
    if (!m || m.isAbsent || m.marksObtained === null) return sum
    return sum + m.marksObtained
  }, 0)
  const totalMax = components.reduce((sum, c) => sum + c.maxMarks, 0)
  const overallPct = totalMax > 0 ? (totalEarned / totalMax) * 100 : null

  const typeColor = course.courseType === 'core' ? 'badge-blue' : 'badge-purple'

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {course.code}
            </span>
            <span className={`badge ${typeColor}`}>{course.courseType}</span>
            {subReg.isBacklog && <span className="badge badge-red">Backlog</span>}
            <span className="badge badge-gray">{course.credits} cr</span>
          </div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {course.name}
          </div>
          {faculty.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Users size={11} />
              {faculty.map(f => `${f.title ?? ''} ${f.firstName} ${f.lastName}`.trim()).join(', ')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {overallPct !== null && (
            <div className="text-right">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Marks so far</div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {totalEarned}/{totalMax}
              </div>
            </div>
          )}
          <div style={{ color: 'var(--text-muted)' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Course info row */}
          <div
            className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs"
            style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="mb-0.5">Semester</div>
              <div style={{ color: 'var(--text-secondary)' }} className="font-medium">
                {semester ? `Sem ${semester.number} (${semester.startDate.slice(0, 4)})` : `ID ${offering.semesterId}`}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="mb-0.5">Credits</div>
              <div style={{ color: 'var(--text-secondary)' }} className="font-medium">{course.credits}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="mb-0.5">Type</div>
              <div style={{ color: 'var(--text-secondary)' }} className="font-medium capitalize">{course.courseType}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="mb-0.5">Status</div>
              <div style={{ color: 'var(--text-secondary)' }} className="font-medium capitalize">{subReg.isBacklog ? 'Backlog' : 'Regular'}</div>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {course.description}
              </p>
            </div>
          )}

          {/* Assessment components & marks */}
          {components.length > 0 ? (
            <div className="px-5 py-3">
              <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Assessment Components
              </div>
              <div className="space-y-2.5">
                {components.map(comp => {
                  const mark = marksByComponent.get(comp.id)
                  return (
                    <div key={comp.id} className="flex items-center gap-3">
                      <div className="min-w-0" style={{ width: 160, flexShrink: 0 }}>
                        <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {comp.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          max {comp.maxMarks}{comp.weightagePct ? ` · ${comp.weightagePct}%` : ''}
                        </div>
                      </div>
                      {mark ? (
                        mark.isAbsent ? (
                          <span className="badge badge-red">Absent</span>
                        ) : mark.marksObtained !== null ? (
                          <MarkBar obtained={mark.marksObtained} max={comp.maxMarks} />
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
            </div>
          ) : (
            <div className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              No assessment components defined yet.
            </div>
          )}

          {/* Syllabus link */}
          {offering.syllabusUrl && (
            <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <a
                href={offering.syllabusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink size={12} />
                View Syllabus
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudentCourses() {
  const { token } = useAuth()
  const { profileId, loading: profileLoading } = useStudentProfile()

  const [semRegs, setSemRegs] = useState<SemesterRegistration[]>([])
  const [enriched, setEnriched] = useState<EnrichedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !profileId) return
    loadAll()
  }, [token, profileId])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      // 1. Get student's registrations
      const regsRes = await gqlRequest<{ getMySemesterRegistrations: SemesterRegistration[] }>(
        `query { getMySemesterRegistrations { id studentId semesterId totalCredits status } }`,
        {}, token!
      ).catch(() => ({ getMySemesterRegistrations: [] }))
      const foundRegs = regsRes.getMySemesterRegistrations
      setSemRegs(foundRegs)
      if (foundRegs.length === 0) { setLoading(false); return }

      // 2. For each registration, get subject registrations
      const allSubRegs: SubjectRegistration[] = []
      await Promise.all(foundRegs.map(async reg => {
        try {
          const res = await gqlRequest<{ getSubjectRegistrations: SubjectRegistration[] }>(
            `query { getSubjectRegistrations(registrationId: ${reg.id}) { id registrationId courseOfferingId isBacklog } }`,
            {}, token!
          )
          allSubRegs.push(...res.getSubjectRegistrations)
        } catch {}
      }))

      if (allSubRegs.length === 0) { setLoading(false); return }

      // 3. Fetch all offerings, courses, semesters, faculty profiles in parallel
      const [offeringsRes, coursesRes, semestersRes, facultyRes] = await Promise.all([
        gqlRequest<{ getCourseOfferings: CourseOffering[] }>(
          'query { getCourseOfferings { id courseId semesterId batchId syllabusUrl } }', {}, token!
        ).catch(() => ({ getCourseOfferings: [] })),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name departmentId credits courseType description } }', {}, token!
        ).catch(() => ({ getCourses: [] })),
        gqlRequest<{ getSemesters: Semester[] }>(
          'query { getSemesters { id programId number startDate endDate isCurrent } }', {}, token!
        ).catch(() => ({ getSemesters: [] })),
        gqlRequest<{ getFacultyProfiles: FacultyProfile[] }>(
          'query { getFacultyProfiles { id firstName lastName title } }', {}, token!
        ).catch(() => ({ getFacultyProfiles: [] })),
      ])

      const offeringsMap = new Map(offeringsRes.getCourseOfferings.map(o => [o.id, o]))
      const coursesMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))
      const semestersMap = new Map(semestersRes.getSemesters.map(s => [s.id, s]))
      const facultyMap = new Map(facultyRes.getFacultyProfiles.map(f => [f.id, f]))

      // 4. For each subject registration, fetch components, marks, and faculty assignments
      const enrichedList = await Promise.all(
        allSubRegs.map(async (subReg) => {
          const offering = offeringsMap.get(subReg.courseOfferingId)
          if (!offering) return null

          const course = coursesMap.get(offering.courseId)
          if (!course) return null

          const semester = semestersMap.get(offering.semesterId) ?? null

          const [componentsRes, marksRes] = await Promise.all([
            gqlRequest<{ getAssessmentComponents: AssessmentComponent[] }>(
              `query { getAssessmentComponents(offeringId: ${offering.id}) { id offeringId name maxMarks weightagePct conductedOn } }`,
              {}, token!
            ).catch(() => ({ getAssessmentComponents: [] })),
            gqlRequest<{ getStudentMarks: StudentMark[] }>(
              `query { getStudentMarks(studentId: ${profileId}) { id componentId studentId marksObtained isAbsent } }`,
              {}, token!
            ).catch(() => ({ getStudentMarks: [] })),
          ])

          // Faculty for this offering
          const facultyRes = await gqlRequest<{ getOfferingFaculty: FacultyProfile[] }>(
            `query { getOfferingFaculty(offeringId: ${offering.id}) { id firstName lastName title } }`,
            {}, token!
          ).catch(() => ({ getOfferingFaculty: [] }))

          const componentIds = new Set(componentsRes.getAssessmentComponents.map(c => c.id))
          const filteredMarks = marksRes.getStudentMarks.filter(m => componentIds.has(m.componentId))

          return {
            subReg,
            offering,
            course,
            semester,
            components: componentsRes.getAssessmentComponents,
            marks: filteredMarks,
            faculty: facultyRes.getOfferingFaculty,
          } as EnrichedCourse
        })
      )

      setEnriched(enrichedList.filter(Boolean) as EnrichedCourse[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const totalCredits = enriched.reduce((sum, ec) => sum + ec.course.credits, 0)
  const coreCount = enriched.filter(ec => ec.course.courseType === 'core').length
  const electiveCount = enriched.filter(ec => ec.course.courseType !== 'core').length

  const isLoading = profileLoading || loading

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'My Courses' }]} />
      <div className="p-6 space-y-5">
        {/* Summary stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Enrolled Courses</div>
            <div className="stat-value">{isLoading ? '—' : enriched.length}</div>
            <div className="stat-sub"><BookOpen size={13} style={{ color: 'var(--accent)' }} /> this semester</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Credits</div>
            <div className="stat-value">{isLoading ? '—' : totalCredits}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>registered credits</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Core Courses</div>
            <div className="stat-value">{isLoading ? '—' : coreCount}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>compulsory</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Electives</div>
            <div className="stat-value">{isLoading ? '—' : electiveCount}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>optional</div>
          </div>
        </div>

        {/* Course list */}
        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading courses…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>
            {error}
          </div>
        ) : enriched.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <BookOpen size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No courses found</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              No semester registrations or subject selections found for your account.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {enriched.map(ec => (
              <CourseCard key={ec.subReg.id} ec={ec} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
