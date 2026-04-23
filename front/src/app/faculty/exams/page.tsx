'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Save, CheckCircle2, AlertTriangle } from 'lucide-react'

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

const MOCK_EXAMS = [
  {
    id: 1, name: 'Mid-term Examination', type: 'Mid-term', status: 'completed',
    schedules: [
      { id: 1, course: 'CS601 · Compiler Design', date: '2026-03-15', time: '9:00 – 12:00', room: 'LT-1' },
      { id: 2, course: 'CS603 · Distributed Systems', date: '2026-03-17', time: '9:00 – 12:00', room: 'LT-3' },
      { id: 6, course: 'CS691 · Systems Lab', date: '2026-03-20', time: '9:00 – 11:00', room: 'Lab-A' },
    ]
  },
  {
    id: 2, name: 'End-term Examination', type: 'End-term', status: 'scheduled',
    schedules: [
      { id: 3, course: 'CS601 · Compiler Design', date: '2026-05-10', time: '9:00 – 12:00', room: 'LT-1' },
      { id: 4, course: 'CS603 · Distributed Systems', date: '2026-05-12', time: '9:00 – 12:00', room: 'LT-3' },
      { id: 5, course: 'CS691 · Systems Lab', date: '2026-05-14', time: '9:00 – 11:00', room: 'Lab-A' },
    ]
  },
]

const STUDENTS = [
  { id: 1, roll: '22CS0101', name: 'Aryan Mehta' },
  { id: 2, roll: '22CS0047', name: 'Rohan Das' },
  { id: 3, roll: '22CS0089', name: 'Sneha Agarwal' },
  { id: 4, roll: '22CS0112', name: 'Vikram Iyer' },
  { id: 5, roll: '22CS0198', name: 'Divya Pillai' },
]

const MOCK_RESULTS: Record<number, Record<number, number | null>> = {
  1: { 1: 72, 2: 68 },
  2: { 1: 58, 2: 55 },
  3: { 1: 65, 2: 61 },
  4: { 1: 61, 2: 57 },
  5: { 1: 85, 2: 80 },
}

export default function FacultyExams() {
  const { token } = useAuth()
  const [selectedExam, setSelectedExam] = useState(MOCK_EXAMS[0])
  const [selectedSchedule, setSelectedSchedule] = useState(MOCK_EXAMS[0].schedules[0])
  const [results, setResults] = useState(MOCK_RESULTS)
  const [absent, setAbsent] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  const setResult = (studentId: number, scheduleId: number, val: string) => {
    const num = val === '' ? null : parseFloat(val)
    setResults(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [scheduleId]: num }
    }))
  }

  const handleSave = async () => {
    // In real app: recordExamResult mutations
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Examinations' }]} />
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Examinations</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            View exam schedule and enter results
          </p>
        </div>

        <div
          className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}
        >
          <AlertTriangle size={14} />
          Exam results must be submitted to Administration for official publication.
        </div>

        {/* Exam selector */}
        <div className="flex items-center gap-2">
          {MOCK_EXAMS.map(e => (
            <button
              key={e.id}
              onClick={() => { setSelectedExam(e); setSelectedSchedule(e.schedules[0]) }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedExam.id === e.id ? 'var(--accent)' : 'var(--bg-card)',
                color: selectedExam.id === e.id ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${selectedExam.id === e.id ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {e.name}
              <span className={`ml-2 badge ${e.status === 'completed' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: 10 }}>
                {e.status}
              </span>
            </button>
          ))}
        </div>

        {/* Schedules */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Exam Schedule</h2>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Date</th>
                <th>Time</th>
                <th>Room</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedExam.schedules.map(s => (
                <tr
                  key={s.id}
                  style={{ cursor: 'pointer', background: selectedSchedule.id === s.id ? 'var(--accent-light)' : undefined }}
                  onClick={() => setSelectedSchedule(s)}
                >
                  <td className="font-medium text-sm">{s.course}</td>
                  <td className="text-sm">{new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="text-sm">{s.time}</td>
                  <td><span className="badge badge-gray">{s.room}</span></td>
                  <td>
                    <span className="text-xs" style={{ color: 'var(--accent)' }}>
                      {selectedSchedule.id === s.id ? 'Selected ↓' : 'Select'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results entry */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Results — {selectedSchedule.course}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Max: 100 marks</p>
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: '#15803D' }}>
                  <CheckCircle2 size={14} /> Saved
                </span>
              )}
              <button onClick={handleSave} className="btn-primary text-sm">
                <Save size={13} /> Save Results
              </button>
            </div>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Marks / 100</th>
                <th>Absent?</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {STUDENTS.map(s => {
                const marks = results[s.id]?.[selectedSchedule.id] ?? null
                const isAbs = absent[`${s.id}-${selectedSchedule.id}`] ?? false
                const grade = marks === null ? '—' : marks >= 90 ? 'O' : marks >= 80 ? 'A+' : marks >= 70 ? 'A' : marks >= 60 ? 'B+' : marks >= 50 ? 'B' : 'F'
                const gradeColor = grade === 'F' ? '#B91C1C' : grade === '—' ? 'var(--text-muted)' : '#15803D'
                
                const isFuture = selectedExam.status === 'scheduled'
                const isCompleted = selectedExam.status === 'completed'
                
                return (
                  <tr key={s.id}>
                    <td><span className="font-mono text-xs">{s.roll}</span></td>
                    <td className="font-medium text-sm">{s.name}</td>
                    <td>
                      {isFuture ? (
                        <span className="text-xs text-gray-400">Not Conducted</span>
                      ) : isAbs ? (
                        <span className="badge badge-red">Absent</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={marks ?? ''}
                          placeholder="—"
                          onChange={e => setResult(s.id, selectedSchedule.id, e.target.value)}
                          className="erp-input tabular-nums"
                          style={{ width: 90 }}
                          disabled={!isCompleted}
                        />
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={isAbs}
                        disabled={isFuture}
                        className="cursor-pointer disabled:cursor-not-allowed"
                        onChange={() => setAbsent(prev => ({ ...prev, [`${s.id}-${selectedSchedule.id}`]: !isAbs }))}
                        style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                      />
                    </td>
                    <td>
                      <span className="text-sm font-semibold" style={{ color: gradeColor }}>{isFuture ? '—' : grade}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  )
}
