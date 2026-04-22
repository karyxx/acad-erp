'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { FileText, Calendar, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

interface SemesterRegistration {
  id: number
  studentId: number
  semesterId: number
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
  roomId: number | null
  examDate: string
  startTime: string
  endTime: string
}

interface ExamResult {
  id: number
  examScheduleId: number
  studentId: number
  marksObtained: number | null
  isAbsent: boolean
  isPublished: boolean
}

interface Course {
  id: number
  code: string
  name: string
  credits: number
}

interface Room {
  id: number
  code: string
  building: string | null
}

interface EnrichedExamItem {
  exam: Exam
  schedule: ExamSchedule
  course: Course
  room: Room | null
  result: ExamResult | null
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'badge-blue',
  ongoing: 'badge-amber',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  const days = Math.round(diff / 86400000)
  if (days < 0) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default function StudentExams() {
  const { token } = useAuth()
  const { profileId, loading: profileLoading } = useStudentProfile()

  const [items, setItems] = useState<EnrichedExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [expandedExam, setExpandedExam] = useState<number | null>(null)

  useEffect(() => {
    if (!token || !profileId) return
    loadExams()
  }, [token, profileId])

  async function loadExams() {
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

      const semesterIds = Array.from(new Set(foundRegs.map(r => r.semesterId)))

      // 2. Fetch all exams, courses, rooms in parallel
      const examFetches = semesterIds.map(sid =>
        gqlRequest<{ getExams: Exam[] }>(
          `query { getExams(semesterId: ${sid}) { id semesterId name examType status } }`,
          {}, token!
        ).catch(() => ({ getExams: [] }))
      )

      const [examResults, coursesRes, roomsRes] = await Promise.all([
        Promise.all(examFetches),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name credits } }', {}, token!
        ).catch(() => ({ getCourses: [] })),
        gqlRequest<{ getRooms: Room[] }>(
          'query { getRooms { id code building } }', {}, token!
        ).catch(() => ({ getRooms: [] })),
      ])

      const allExams = examResults.flatMap(r => r.getExams)
      const coursesMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))
      const roomsMap = new Map(roomsRes.getRooms.map(r => [r.id, r]))

      if (allExams.length === 0) { setLoading(false); return }

      // 3. Fetch schedules for each exam
      const schedulesFetches = allExams.map(exam =>
        gqlRequest<{ getExamSchedules: ExamSchedule[] }>(
          `query { getExamSchedules(examId: ${exam.id}) { id examId courseId roomId examDate startTime endTime } }`,
          {}, token!
        ).catch(() => ({ getExamSchedules: [] }))
      )
      const allScheduleResults = await Promise.all(schedulesFetches)
      const schedulesByExam = new Map(allExams.map((exam, i) => [exam.id, allScheduleResults[i].getExamSchedules]))

      // 4. Fetch exam results for each schedule (student can only see own)
      const allItems: EnrichedExamItem[] = []
      for (const exam of allExams) {
        const schedules = schedulesByExam.get(exam.id) ?? []
        for (const schedule of schedules) {
          const course = coursesMap.get(schedule.courseId)
          if (!course) continue

          const room = schedule.roomId ? (roomsMap.get(schedule.roomId) ?? null) : null

          // Fetch result for this schedule (student sees only own results)
          let result: ExamResult | null = null
          try {
            const resultRes = await gqlRequest<{ getExamResults: ExamResult[] }>(
              `query { getExamResults(examScheduleId: ${schedule.id}) { id examScheduleId studentId marksObtained isAbsent isPublished } }`,
              {}, token!
            )
            // Filter for this student
            result = resultRes.getExamResults.find(r => r.studentId === profileId) ?? null
          } catch {}

          allItems.push({ exam, schedule, course, room, result })
        }
      }

      // Sort by date descending (upcoming first)
      allItems.sort((a, b) => new Date(a.schedule.examDate).getTime() - new Date(b.schedule.examDate).getTime())
      setItems(allItems)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading
  const today = new Date().setHours(0, 0, 0, 0)

  const filtered = items.filter(item => {
    const itemDate = new Date(item.schedule.examDate).setHours(0, 0, 0, 0)
    if (filter === 'upcoming') return itemDate >= today
    if (filter === 'past') return itemDate < today
    return true
  })

  const upcoming = items.filter(i => new Date(i.schedule.examDate).setHours(0, 0, 0, 0) >= today)
  const withResults = items.filter(i => i.result?.isPublished && i.result.marksObtained !== null)

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Examinations' }]} />
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Total Exams</div>
            <div className="stat-value">{isLoading ? '—' : items.length}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>across all semesters</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Upcoming</div>
            <div className="stat-value" style={{ color: upcoming.length > 0 ? 'var(--accent)' : undefined }}>
              {isLoading ? '—' : upcoming.length}
            </div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>scheduled ahead</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Results Published</div>
            <div className="stat-value">{isLoading ? '—' : withResults.length}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>grades available</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Next Exam</div>
            <div className="stat-value" style={{ fontSize: 16 }}>
              {isLoading ? '—' : upcoming.length > 0 ? upcoming[0].course.code : '—'}
            </div>
            <div className="stat-sub" style={{ color: upcoming.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
              {upcoming.length > 0 ? daysUntil(upcoming[0].schedule.examDate) ?? '—' : 'No upcoming exams'}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex' }}>
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
              style={{
                background: filter === f ? 'var(--accent)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-secondary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Exam list */}
        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading exams…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <FileText size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No {filter !== 'all' ? filter : ''} exams found
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Exam</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const due = daysUntil(item.schedule.examDate)
                  const isPast = new Date(item.schedule.examDate).setHours(0, 0, 0, 0) < today
                  return (
                    <tr key={item.schedule.id}>
                      <td>
                        <div className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          {item.course.code}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.course.name}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.exam.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.exam.examType}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                          {formatDate(item.schedule.examDate)}
                        </div>
                        <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={11} />
                          {formatTime(item.schedule.startTime)} – {formatTime(item.schedule.endTime)}
                        </div>
                        {due && !isPast && (
                          <span className="badge badge-purple mt-1" style={{ fontSize: 10 }}>{due}</span>
                        )}
                      </td>
                      <td>
                        {item.room ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                            {item.room.code}
                            {item.room.building && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                , {item.room.building}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>TBA</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[item.exam.status] ?? 'badge-gray'}`}>
                          {item.exam.status.charAt(0).toUpperCase() + item.exam.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {item.result?.isPublished ? (
                          item.result.isAbsent ? (
                            <span className="badge badge-red">Absent</span>
                          ) : item.result.marksObtained !== null ? (
                            <span className="font-semibold tabular-nums text-sm" style={{ color: 'var(--text-primary)' }}>
                              {item.result.marksObtained}
                            </span>
                          ) : (
                            <span className="badge badge-gray">N/A</span>
                          )
                        ) : isPast ? (
                          <span className="badge badge-amber">Awaited</span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
