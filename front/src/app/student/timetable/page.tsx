'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Calendar, Clock, MapPin } from 'lucide-react'

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

interface TimetableSlot {
  id: number
  offeringId: number
  roomId: number | null
  dayOfWeek: number
  startTime: string
  endTime: string
  effectiveFrom: string
  effectiveTo: string | null
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

interface Room {
  id: number
  code: string
  building: string | null
  capacity: number
}

interface EnrichedSlot {
  slot: TimetableSlot
  course: Course
  room: Room | null
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatTime(t: string) {
  // t is "HH:MM:SS" from backend
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function todayDayOfWeek() {
  // JS: 0=Sun,1=Mon,...; backend: 1=Mon,...,7=Sun
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

// Generate time slots from 8:00 to 20:00
const TIME_GRID = Array.from({ length: 25 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2)
  const min = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${min}`
}).filter((_, i) => i <= 24)

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const SLOT_COLORS = [
  { bg: '#EEF0FF', border: '#5B4DCC', text: '#3730A3' },
  { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
  { bg: '#FFF7ED', border: '#EA580C', text: '#C2410C' },
  { bg: '#FDF4FF', border: '#A21CAF', text: '#86198F' },
  { bg: '#F0F9FF', border: '#0284C7', text: '#0369A1' },
  { bg: '#FFFBEB', border: '#D97706', text: '#B45309' },
  { bg: '#FFF1F2', border: '#E11D48', text: '#BE123C' },
]

export default function StudentTimetable() {
  const { token } = useAuth()
  const { profileId, loading: profileLoading } = useStudentProfile()

  const [slots, setSlots] = useState<EnrichedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState(todayDayOfWeek())

  useEffect(() => {
    if (!token || !profileId) return
    loadTimetable()
  }, [token, profileId])

  async function loadTimetable() {
    setLoading(true)
    setError(null)
    try {
      // Get student's registrations
      const regsRes = await gqlRequest<{ getMySemesterRegistrations: SemesterRegistration[] }>(
        `query { getMySemesterRegistrations { id studentId semesterId status } }`,
        {}, token!
      ).catch(() => ({ getMySemesterRegistrations: [] }))
      const foundRegs = regsRes.getMySemesterRegistrations

      if (foundRegs.length === 0) { setLoading(false); return }

      // Get subject registrations for all sem regs
      const allSubRegs: SubjectRegistration[] = []
      await Promise.all(foundRegs.map(async reg => {
        const res = await gqlRequest<{ getSubjectRegistrations: SubjectRegistration[] }>(
          `query { getSubjectRegistrations(registrationId: ${reg.id}) { id registrationId courseOfferingId isBacklog } }`,
          {}, token!
        ).catch(() => ({ getSubjectRegistrations: [] }))
        allSubRegs.push(...res.getSubjectRegistrations)
      }))

      const offeringIds = [...new Set(allSubRegs.map(s => s.courseOfferingId))]
      if (offeringIds.length === 0) { setLoading(false); return }

      // Fetch all reference data in parallel
      const [offeringsRes, coursesRes, roomsRes] = await Promise.all([
        gqlRequest<{ getCourseOfferings: CourseOffering[] }>(
          'query { getCourseOfferings { id courseId semesterId batchId } }', {}, token!
        ).catch(() => ({ getCourseOfferings: [] })),
        gqlRequest<{ getCourses: Course[] }>(
          'query { getCourses { id code name credits courseType } }', {}, token!
        ).catch(() => ({ getCourses: [] })),
        gqlRequest<{ getRooms: Room[] }>(
          'query { getRooms { id code building capacity } }', {}, token!
        ).catch(() => ({ getRooms: [] })),
      ])

      const offeringsMap = new Map(offeringsRes.getCourseOfferings.map(o => [o.id, o]))
      const coursesMap = new Map(coursesRes.getCourses.map(c => [c.id, c]))
      const roomsMap = new Map(roomsRes.getRooms.map(r => [r.id, r]))

      // Fetch timetable slots for each offering
      const allEnriched: EnrichedSlot[] = []
      await Promise.all(offeringIds.map(async offeringId => {
        const offering = offeringsMap.get(offeringId)
        if (!offering) return
        const course = coursesMap.get(offering.courseId)
        if (!course) return

        const slotsRes = await gqlRequest<{ getTimetableSlots: TimetableSlot[] }>(
          `query { getTimetableSlots(offeringId: ${offeringId}) { id offeringId roomId dayOfWeek startTime endTime effectiveFrom effectiveTo } }`,
          {}, token!
        ).catch(() => ({ getTimetableSlots: [] }))

        for (const slot of slotsRes.getTimetableSlots) {
          allEnriched.push({
            slot,
            course,
            room: slot.roomId ? (roomsMap.get(slot.roomId) ?? null) : null,
          })
        }
      }))

      // Sort by day then time
      allEnriched.sort((a, b) => {
        if (a.slot.dayOfWeek !== b.slot.dayOfWeek) return a.slot.dayOfWeek - b.slot.dayOfWeek
        return timeToMinutes(a.slot.startTime) - timeToMinutes(b.slot.startTime)
      })

      setSlots(allEnriched)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading
  const today = todayDayOfWeek()

  // Build course → color index map
  const courseColorMap = new Map<number, number>()
  slots.forEach(es => {
    if (!courseColorMap.has(es.course.id)) {
      courseColorMap.set(es.course.id, courseColorMap.size % SLOT_COLORS.length)
    }
  })

  const daysWithSlots = [...new Set(slots.map(s => s.slot.dayOfWeek))].sort()
  const workDays = [1, 2, 3, 4, 5, 6].filter(d => daysWithSlots.includes(d) || d <= 5)

  const displayDays = viewMode === 'day' ? [selectedDay] : workDays

  return (
    <AuthGuard requiredRole="Student">
      <TopBar
        breadcrumbs={[{ label: 'AcadERP' }, { label: 'Timetable' }]}
        actions={
          <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1 text-xs font-medium capitalize transition-colors"
                style={{
                  background: viewMode === mode ? 'var(--accent)' : 'var(--bg-card)',
                  color: viewMode === mode ? 'white' : 'var(--text-secondary)',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        }
      />
      <div className="p-6 space-y-4">
        {/* Day picker for day view */}
        {viewMode === 'day' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: selectedDay === day ? 'var(--accent)' : 'var(--bg-card)',
                  color: selectedDay === day ? 'white' : today === day ? 'var(--accent)' : 'var(--text-secondary)',
                  border: `1px solid ${today === day && selectedDay !== day ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading timetable…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>{error}</div>
        ) : slots.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <Calendar size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No timetable slots found</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              No slots have been assigned for your enrolled courses yet.
            </div>
          </div>
        ) : (
          <>
            {/* Grid timetable */}
            <div className="card overflow-auto">
              <div style={{ minWidth: viewMode === 'week' ? 700 : 340 }}>
                {/* Header row */}
                <div
                  className="grid text-xs font-semibold uppercase tracking-wider"
                  style={{
                    gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)`,
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div className="px-3 py-3">Time</div>
                  {displayDays.map(d => (
                    <div
                      key={d}
                      className="px-3 py-3 text-center"
                      style={{ color: d === today ? 'var(--accent)' : undefined, fontWeight: d === today ? 700 : undefined }}
                    >
                      {DAY_SHORT[d]}
                      {d === today && (
                        <span className="ml-1 badge badge-purple" style={{ fontSize: 9, padding: '1px 4px' }}>Today</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Time rows */}
                {TIME_GRID.filter((_, i) => i < TIME_GRID.length - 1).map((timeStr, rowIdx) => {
                  const rowStart = timeToMinutes(timeStr)
                  const rowEnd = rowStart + 30

                  return (
                    <div
                      key={timeStr}
                      className="grid"
                      style={{
                        gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)`,
                        borderBottom: '1px solid var(--border-subtle)',
                        minHeight: 40,
                      }}
                    >
                      <div
                        className="px-3 flex items-start pt-1 text-xs tabular-nums"
                        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                      >
                        {timeStr}
                      </div>
                      {displayDays.map(day => {
                        const daySlots = slots.filter(es => {
                          const sStart = timeToMinutes(es.slot.startTime.slice(0, 5))
                          const sEnd = timeToMinutes(es.slot.endTime.slice(0, 5))
                          return es.slot.dayOfWeek === day && sStart < rowEnd && sEnd > rowStart
                        })
                        return (
                          <div
                            key={day}
                            className="px-1 py-0.5 relative"
                            style={{ borderLeft: '1px solid var(--border-subtle)' }}
                          >
                            {daySlots.map(es => {
                              const sStart = timeToMinutes(es.slot.startTime.slice(0, 5))
                              // Only render at the starting row
                              if (sStart !== rowStart) return null
                              const colorIdx = courseColorMap.get(es.course.id) ?? 0
                              const col = SLOT_COLORS[colorIdx]
                              const durationMins = timeToMinutes(es.slot.endTime.slice(0, 5)) - sStart
                              const rows = durationMins / 30
                              return (
                                <div
                                  key={es.slot.id}
                                  className="rounded-md px-2 py-1.5 text-xs overflow-hidden"
                                  style={{
                                    background: col.bg,
                                    borderLeft: `3px solid ${col.border}`,
                                    color: col.text,
                                    minHeight: rows * 40 - 4,
                                    position: rows > 1 ? 'absolute' : 'relative',
                                    left: rows > 1 ? 4 : undefined,
                                    right: rows > 1 ? 4 : undefined,
                                    zIndex: 1,
                                  }}
                                >
                                  <div className="font-semibold truncate">{es.course.code}</div>
                                  <div className="truncate opacity-80" style={{ fontSize: 10 }}>{es.course.name}</div>
                                  {es.room && (
                                    <div className="flex items-center gap-0.5 mt-0.5 opacity-70" style={{ fontSize: 10 }}>
                                      <MapPin size={9} />
                                      {es.room.code}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
              {[...courseColorMap.entries()].map(([courseId, colorIdx]) => {
                const course = slots.find(s => s.course.id === courseId)?.course
                if (!course) return null
                const col = SLOT_COLORS[colorIdx]
                return (
                  <div
                    key={courseId}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}
                  >
                    <div className="w-2 h-2 rounded-sm" style={{ background: col.border }} />
                    {course.code} — {course.name}
                  </div>
                )
              })}
            </div>

            {/* List view for the selected/current day */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {viewMode === 'day' ? DAY_NAMES[selectedDay] : `Today — ${DAY_NAMES[today]}`}
                </h2>
              </div>
              {(() => {
                const todaySlots = slots.filter(s => s.slot.dayOfWeek === (viewMode === 'day' ? selectedDay : today))
                if (todaySlots.length === 0) {
                  return (
                    <div className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                      No classes scheduled
                    </div>
                  )
                }
                return (
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {todaySlots.map(es => {
                      const colorIdx = courseColorMap.get(es.course.id) ?? 0
                      const col = SLOT_COLORS[colorIdx]
                      return (
                        <div key={es.slot.id} className="px-5 py-3 flex items-center gap-4">
                          <div
                            className="w-1 self-stretch rounded-full"
                            style={{ background: col.border, flexShrink: 0 }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold" style={{ color: col.text }}>
                                {es.course.code}
                              </span>
                              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {es.course.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(es.slot.startTime)} – {formatTime(es.slot.endTime)}
                              </span>
                              {es.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} />
                                  {es.room.code}{es.room.building ? `, ${es.room.building}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="badge badge-gray">{es.course.credits} cr</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  )
}
