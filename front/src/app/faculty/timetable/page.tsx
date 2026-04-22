'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Calendar, Clock, MapPin } from 'lucide-react'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const TIME_GRID = Array.from({ length: 25 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2)
  const min = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${min}`
}).filter((_, i) => i <= 24)

const SLOT_COLORS = [
  { bg: '#EEF0FF', border: '#5B4DCC', text: '#3730A3' },
  { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
  { bg: '#FFF7ED', border: '#EA580C', text: '#C2410C' },
  { bg: '#FDF4FF', border: '#A21CAF', text: '#86198F' },
]

// Mock data for Faculty timetable
const MOCK_SLOTS = [
  {
    id: 1,
    course: { id: 1, code: 'CS601', name: 'Compiler Design', credits: 4 },
    room: { code: 'LT-1' },
    dayOfWeek: 1, // Mon
    startTime: '09:00:00',
    endTime: '11:00:00',
  },
  {
    id: 2,
    course: { id: 2, code: 'CS603', name: 'Distributed Systems', credits: 3 },
    room: { code: 'LT-3' },
    dayOfWeek: 2, // Tue
    startTime: '11:00:00',
    endTime: '12:30:00',
  },
  {
    id: 3,
    course: { id: 3, code: 'CS691', name: 'Systems Lab', credits: 2 },
    room: { code: 'Lab-A' },
    dayOfWeek: 3, // Wed
    startTime: '14:00:00',
    endTime: '17:00:00',
  },
  {
    id: 4,
    course: { id: 1, code: 'CS601', name: 'Compiler Design', credits: 4 },
    room: { code: 'LT-1' },
    dayOfWeek: 4, // Thu
    startTime: '09:00:00',
    endTime: '11:00:00',
  },
  {
    id: 5,
    course: { id: 2, code: 'CS603', name: 'Distributed Systems', credits: 3 },
    room: { code: 'LT-3' },
    dayOfWeek: 5, // Fri
    startTime: '11:00:00',
    endTime: '12:30:00',
  },
]

function todayDayOfWeek() {
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

export default function FacultyTimetable() {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState(todayDayOfWeek())

  const today = todayDayOfWeek()

  // Build course → color index map
  const courseColorMap = new Map<number, number>()
  MOCK_SLOTS.forEach(s => {
    if (!courseColorMap.has(s.course.id)) {
      courseColorMap.set(s.course.id, courseColorMap.size % SLOT_COLORS.length)
    }
  })

  // Fixed 5 working days + Sat if needed
  const displayDays = viewMode === 'day' ? [selectedDay] : [1, 2, 3, 4, 5]

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar
        breadcrumbs={[{ label: 'AcadERP' }, { label: 'My Timetable' }]}
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
                    const daySlots = MOCK_SLOTS.filter(s => {
                      const sStart = timeToMinutes(s.startTime.slice(0, 5))
                      const sEnd = timeToMinutes(s.endTime.slice(0, 5))
                      return s.dayOfWeek === day && sStart < rowEnd && sEnd > rowStart
                    })
                    return (
                      <div
                        key={day}
                        className="px-1 py-0.5 relative"
                        style={{ borderLeft: '1px solid var(--border-subtle)' }}
                      >
                        {daySlots.map(es => {
                          const sStart = timeToMinutes(es.startTime.slice(0, 5))
                          if (sStart !== rowStart) return null
                          const colorIdx = courseColorMap.get(es.course.id) ?? 0
                          const col = SLOT_COLORS[colorIdx]
                          const durationMins = timeToMinutes(es.endTime.slice(0, 5)) - sStart
                          const rows = durationMins / 30
                          return (
                            <div
                              key={es.id}
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
                              <div className="flex items-center gap-0.5 mt-0.5 opacity-70" style={{ fontSize: 10 }}>
                                <MapPin size={9} />
                                {es.room.code}
                              </div>
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
          {Array.from(courseColorMap.entries()).map(([courseId, colorIdx]) => {
            const course = MOCK_SLOTS.find(s => s.course.id === courseId)?.course
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
            const todaySlots = MOCK_SLOTS.filter(s => s.dayOfWeek === (viewMode === 'day' ? selectedDay : today))
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
                    <div key={es.id} className="px-5 py-3 flex items-center gap-4">
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
                            {formatTime(es.startTime)} – {formatTime(es.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {es.room.code}
                          </span>
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
      </div>
    </AuthGuard>
  )
}
