'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, Plus, Info } from 'lucide-react'

interface SemesterRegistration {
  id: number
  studentId: number
  semesterId: number
  instituteFeePaid: boolean
  hostelFeePaid: boolean
  totalCredits: number
  status: string
}

interface SubjectRegistration {
  id: number
  registrationId: number
  courseOfferingId: number
  isBacklog: boolean
}

interface Semester {
  id: number
  programId: number
  number: number
  startDate: string
  endDate: string
  isCurrent: boolean
  registrationWindowStart: string | null
  registrationWindowEnd: string | null
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
  credits: number
  courseType: string
  description: string | null
}

interface Batch {
  id: number
  programId: number
  name: string
  year: number
  label: string
}

interface EnrichedRegistration {
  semReg: SemesterRegistration
  semester: Semester | null
  subRegs: SubjectRegistration[]
  courses: { offering: CourseOffering; course: Course }[]
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', badgeClass: 'badge-amber', icon: <Clock size={14} /> },
  approved: { label: 'Approved', badgeClass: 'badge-green', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Rejected', badgeClass: 'badge-red', icon: <XCircle size={14} /> },
}

function RegistrationCard({ er, coursesMap, offeringsMap }: {
  er: EnrichedRegistration
  coursesMap: Map<number, Course>
  offeringsMap: Map<number, CourseOffering>
}) {
  const { semReg, semester, subRegs } = er
  const statusCfg = STATUS_CONFIG[semReg.status] ?? STATUS_CONFIG.pending

  const isWindowOpen = semester?.registrationWindowStart && semester?.registrationWindowEnd
    ? new Date() >= new Date(semester.registrationWindowStart) && new Date() <= new Date(semester.registrationWindowEnd)
    : false

  const enrichedSubRegs = subRegs.map(sr => {
    const offering = offeringsMap.get(sr.courseOfferingId)
    const course = offering ? coursesMap.get(offering.courseId) : null
    return { sr, offering, course }
  })

  const totalCredits = enrichedSubRegs.reduce((sum, { course }) => sum + (course?.credits ?? 0), 0)

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Semester {semester?.number ?? semReg.semesterId}
            </span>
            {semester?.isCurrent && (
              <span className="badge badge-purple">Current</span>
            )}
            <span className={`badge ${statusCfg.badgeClass} flex items-center gap-1`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          </div>
          {semester && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(semester.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              {' – '}
              {new Date(semester.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Registered Credits</div>
          <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {totalCredits}
          </div>
        </div>
      </div>

      {/* Fee status */}
      <div
        className="px-5 py-3 grid grid-cols-2 gap-4 text-xs"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          {semReg.instituteFeePaid ? (
            <CheckCircle size={14} style={{ color: '#15803D' }} />
          ) : (
            <XCircle size={14} style={{ color: '#DC2626' }} />
          )}
          <span style={{ color: semReg.instituteFeePaid ? '#15803D' : '#DC2626' }}>
            Institute fee {semReg.instituteFeePaid ? 'paid' : 'unpaid'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {semReg.hostelFeePaid ? (
            <CheckCircle size={14} style={{ color: '#15803D' }} />
          ) : (
            <XCircle size={14} style={{ color: '#DC2626' }} />
          )}
          <span style={{ color: semReg.hostelFeePaid ? '#15803D' : '#DC2626' }}>
            Hostel fee {semReg.hostelFeePaid ? 'paid' : 'unpaid'}
          </span>
        </div>
      </div>

      {/* Registration window info */}
      {semester?.registrationWindowStart && (
        <div
          className="px-5 py-2.5 flex items-center gap-2 text-xs"
          style={{
            background: isWindowOpen ? '#F0FDF4' : 'var(--bg)',
            borderBottom: '1px solid var(--border-subtle)',
            color: isWindowOpen ? '#15803D' : 'var(--text-muted)',
          }}
        >
          <Info size={12} />
          Registration window:{' '}
          {new Date(semester.registrationWindowStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' – '}
          {semester.registrationWindowEnd
            ? new Date(semester.registrationWindowEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : '—'}
          {isWindowOpen && <span className="badge badge-green ml-2">Open</span>}
        </div>
      )}

      {/* Registered subjects */}
      {enrichedSubRegs.length > 0 ? (
        <table className="erp-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course</th>
              <th>Credits</th>
              <th>Type</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {enrichedSubRegs.map(({ sr, course, offering }) => (
              <tr key={sr.id}>
                <td>
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                    {course?.code ?? `Offering #${sr.courseOfferingId}`}
                  </span>
                </td>
                <td className="font-medium text-sm">{course?.name ?? '—'}</td>
                <td className="text-sm tabular-nums">{course?.credits ?? '—'}</td>
                <td>
                  {course && (
                    <span className={`badge ${course.courseType === 'core' ? 'badge-blue' : 'badge-purple'}`}>
                      {course.courseType}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`badge ${sr.isBacklog ? 'badge-red' : 'badge-gray'}`}>
                    {sr.isBacklog ? 'Backlog' : 'Regular'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          No subjects registered for this semester.
        </div>
      )}
    </div>
  )
}

export default function StudentRegistration() {
  const { token } = useAuth()
  const { profileId, loading: profileLoading } = useStudentProfile()

  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([])
  const [coursesMap, setCoursesMap] = useState<Map<number, Course>>(new Map())
  const [offeringsMap, setOfferingsMap] = useState<Map<number, CourseOffering>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !profileId) return
    loadRegistrations()
  }, [token, profileId])

  async function loadRegistrations() {
    setLoading(true)
    setError(null)
    try {
      // Get student's registrations
      const regsRes = await gqlRequest<{ getMySemesterRegistrations: SemesterRegistration[] }>(
        `query { getMySemesterRegistrations {
          id studentId semesterId instituteFeePaid hostelFeePaid totalCredits status
        } }`,
        {}, token!
      ).catch(() => ({ getMySemesterRegistrations: [] }))
      const foundRegs = regsRes.getMySemesterRegistrations

      // Fetch semesters, courses, offerings in parallel
      const [semestersRes, coursesRes, offeringsRes] = await Promise.all([
        gqlRequest<{ getSemesters: Semester[] }>(
          'query { getSemesters { id programId number startDate endDate isCurrent registrationWindowStart registrationWindowEnd } }',
          {}, token!
        ).catch(() => ({ getSemesters: [] })),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name credits courseType description } }',
          {}, token!
        ).catch(() => ({ getCourses: [] })),
        gqlRequest<{ getCourseOfferings: CourseOffering[] }>(
          'query { getCourseOfferings { id courseId semesterId batchId syllabusUrl } }',
          {}, token!
        ).catch(() => ({ getCourseOfferings: [] })),
      ])

      const semMap = new Map(semestersRes.getSemesters.map(s => [s.id, s]))
      const cMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))
      const oMap = new Map(offeringsRes.getCourseOfferings.map(o => [o.id, o]))
      setCoursesMap(cMap)
      setOfferingsMap(oMap)

      // For each reg, get subject registrations
      const enriched: EnrichedRegistration[] = await Promise.all(
        foundRegs.map(async semReg => {
          const subRegsRes = await gqlRequest<{ getSubjectRegistrations: SubjectRegistration[] }>(
            `query { getSubjectRegistrations(registrationId: ${semReg.id}) { id registrationId courseOfferingId isBacklog } }`,
            {}, token!
          ).catch(() => ({ getSubjectRegistrations: [] }))

          return {
            semReg,
            semester: semMap.get(semReg.semesterId) ?? null,
            subRegs: subRegsRes.getSubjectRegistrations,
            courses: [],
          }
        })
      )

      // Sort: current first, then by semester number desc
      enriched.sort((a, b) => {
        if (a.semester?.isCurrent && !b.semester?.isCurrent) return -1
        if (!a.semester?.isCurrent && b.semester?.isCurrent) return 1
        return (b.semester?.number ?? 0) - (a.semester?.number ?? 0)
      })

      setRegistrations(enriched)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading

  const currentReg = registrations.find(r => r.semester?.isCurrent)
  const approvedCount = registrations.filter(r => r.semReg.status === 'approved').length
  const totalSubjects = registrations.reduce((sum, r) => sum + r.subRegs.length, 0)
  const currentSubjects = currentReg?.subRegs.length ?? 0

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Registration' }]} />
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Current Semester</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {isLoading ? '—' : currentReg ? (
                <span className={`badge ${STATUS_CONFIG[currentReg.semReg.status]?.badgeClass ?? 'badge-gray'}`} style={{ fontSize: 13 }}>
                  {STATUS_CONFIG[currentReg.semReg.status]?.label ?? currentReg.semReg.status}
                </span>
              ) : '—'}
            </div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
              {currentReg ? `Sem ${currentReg.semester?.number}` : 'No current registration'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Subjects This Sem</div>
            <div className="stat-value">{isLoading ? '—' : currentSubjects}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>registered courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved Semesters</div>
            <div className="stat-value">{isLoading ? '—' : approvedCount}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>of {registrations.length} total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Subjects</div>
            <div className="stat-value">{isLoading ? '—' : totalSubjects}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>all semesters</div>
          </div>
        </div>

        {/* Registration window notice */}
        {currentReg?.semester?.registrationWindowStart && (
          (() => {
            const now = new Date()
            const start = new Date(currentReg.semester!.registrationWindowStart!)
            const end = currentReg.semester?.registrationWindowEnd ? new Date(currentReg.semester.registrationWindowEnd) : null
            const isOpen = now >= start && (!end || now <= end)
            const isUpcoming = now < start

            if (isOpen) {
              return (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #86EFAC' }}>
                  <CheckCircle size={16} style={{ color: '#15803D', marginTop: 1 }} />
                  <div className="text-sm">
                    <span className="font-semibold" style={{ color: '#166534' }}>Registration window is open. </span>
                    <span style={{ color: '#15803D' }}>
                      You can register for next semester courses until{' '}
                      {end ? end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'further notice'}.
                    </span>
                  </div>
                </div>
              )
            }
            if (isUpcoming) {
              return (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <Clock size={16} style={{ color: '#1D4ED8', marginTop: 1 }} />
                  <div className="text-sm">
                    <span className="font-semibold" style={{ color: '#1E40AF' }}>Registration opens soon. </span>
                    <span style={{ color: '#1D4ED8' }}>
                      Registration window opens on{' '}
                      {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
                    </span>
                  </div>
                </div>
              )
            }
            return null
          })()
        )}

        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading registrations…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>{error}</div>
        ) : registrations.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <ClipboardList size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No registrations found</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              No semester registrations have been found for your account.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map(er => (
              <RegistrationCard
                key={er.semReg.id}
                er={er}
                coursesMap={coursesMap}
                offeringsMap={offeringsMap}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
