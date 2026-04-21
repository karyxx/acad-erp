'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Award, TrendingUp } from 'lucide-react'

interface StudentMark {
  id: number
  componentId: number
  studentId: number
  marksObtained: number | null
  isAbsent: boolean
}

interface SemesterResult {
  id: number
  semesterId: number
  sgpa: number | null
  cgpa: number | null
  totalCreditsEarned: number | null
}

// Mock historical data for display
const MOCK_HISTORY = [
  { sem: 'Sem I', sgpa: 8.83, cgpa: 8.83, credits: 24 },
  { sem: 'Sem II', sgpa: 8.96, cgpa: 8.90, credits: 24 },
  { sem: 'Sem III', sgpa: 8.65, cgpa: 8.81, credits: 24 },
  { sem: 'Sem IV', sgpa: 9.04, cgpa: 8.87, credits: 24 },
  { sem: 'Sem V', sgpa: 8.74, cgpa: 8.84, credits: 22 },
]

const MOCK_MARKS = [
  { course: 'CS601 - Compiler Design', components: [
    { name: 'Quiz 1', max: 20, obtained: 18 },
    { name: 'Mid-term', max: 40, obtained: 35 },
    { name: 'Assignment', max: 10, obtained: 9 },
  ]},
  { course: 'CS603 - Distributed Systems', components: [
    { name: 'Quiz 1', max: 20, obtained: 16 },
    { name: 'Mid-term', max: 40, obtained: 28 },
  ]},
  { course: 'CS605 - ML Fundamentals', components: [
    { name: 'Quiz 1', max: 20, obtained: 17 },
    { name: 'Lab Eval 1', max: 30, obtained: 26 },
  ]},
]

function GradeBar({ obtained, max }: { obtained: number; max: number }) {
  const pct = (obtained / max) * 100
  const color = pct >= 80 ? '#15803D' : pct >= 60 ? '#B45309' : '#B91C1C'
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar flex-1" style={{ width: 80 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-secondary)', minWidth: 40 }}>
        {obtained}/{max}
      </span>
    </div>
  )
}

export default function StudentGrades() {
  const { token } = useAuth()
  const [marks, setMarks] = useState<StudentMark[]>([])
  const [result, setResult] = useState<SemesterResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      gqlRequest<{ getStudentMarks: StudentMark[] }>(
        'query { getStudentMarks(studentId: 1) { id componentId studentId marksObtained isAbsent } }',
        {}, token
      ).catch(() => ({ getStudentMarks: [] })),
      gqlRequest<{ getStudentSemesterResult: SemesterResult | null }>(
        'query { getStudentSemesterResult(studentId: 1, semesterId: 1) { id semesterId sgpa cgpa totalCreditsEarned } }',
        {}, token
      ).catch(() => ({ getStudentSemesterResult: null })),
    ]).then(([marksRes, resultRes]) => {
      setMarks(marksRes.getStudentMarks)
      setResult(resultRes.getStudentSemesterResult)
    }).finally(() => setLoading(false))
  }, [token])

  const currentCgpa = result?.cgpa ?? MOCK_HISTORY[MOCK_HISTORY.length - 1].cgpa

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Grades & GPA' }]} />
      <div className="p-6 space-y-5">
        {/* CGPA summary */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Current CGPA</div>
            <div className="stat-value">{currentCgpa.toFixed(2)}</div>
            <div className="stat-sub"><Award size={13} style={{ color: 'var(--accent)' }} /> out of 10.00</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Latest SGPA</div>
            <div className="stat-value">{(result?.sgpa ?? 8.74).toFixed(2)}</div>
            <div className="stat-sub"><TrendingUp size={13} style={{ color: '#15803D' }} /> Semester V</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Credits Earned</div>
            <div className="stat-value">{result?.totalCreditsEarned ?? 118}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>of 160 total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Backlogs</div>
            <div className="stat-value">1</div>
            <div className="stat-sub" style={{ color: '#B45309' }}>1 course pending</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Semester history */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Semester History</h2>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>SGPA</th>
                  <th>CGPA</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORY.map((row) => (
                  <tr key={row.sem}>
                    <td className="font-medium text-sm">{row.sem}</td>
                    <td>
                      <span
                        className="font-semibold tabular-nums text-sm"
                        style={{ color: row.sgpa >= 9 ? '#15803D' : row.sgpa >= 8 ? 'var(--text-primary)' : '#B45309' }}
                      >
                        {row.sgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="tabular-nums text-sm">{row.cgpa.toFixed(2)}</td>
                    <td className="text-sm">{row.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Current semester marks */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Current Semester Marks
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Semester VI — in progress
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {MOCK_MARKS.map((course) => (
                <div key={course.course} className="px-5 py-3.5">
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {course.course}
                  </div>
                  <div className="space-y-2">
                    {course.components.map((comp) => (
                      <div key={comp.name} className="flex items-center justify-between gap-4">
                        <span className="text-xs" style={{ color: 'var(--text-muted)', minWidth: 80 }}>{comp.name}</span>
                        <GradeBar obtained={comp.obtained} max={comp.max} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* From actual backend if available */}
              {marks.length > 0 && (
                <div className="px-5 py-3.5">
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    CS101 - Intro to CS (from DB)
                  </div>
                  {marks.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-4">
                      <span className="text-xs" style={{ color: 'var(--text-muted)', minWidth: 80 }}>
                        Component #{m.componentId}
                      </span>
                      {m.isAbsent ? (
                        <span className="badge badge-red">Absent</span>
                      ) : (
                        <GradeBar obtained={m.marksObtained ?? 0} max={100} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
