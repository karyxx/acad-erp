'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Save, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'

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

const COURSES = [
  { offeringId: 1, code: 'CS601', name: 'Compiler Design' },
  { offeringId: 2, code: 'CS603', name: 'Distributed Systems' },
  { offeringId: 3, code: 'CS691', name: 'Systems Lab' },
]

const STUDENTS = [
  { id: 1, roll: '22CS0101', name: 'Aryan Mehta' },
  { id: 2, roll: '22CS0047', name: 'Rohan Das' },
  { id: 3, roll: '22CS0089', name: 'Sneha Agarwal' },
  { id: 4, roll: '22CS0112', name: 'Vikram Iyer' },
  { id: 5, roll: '22CS0198', name: 'Divya Pillai' },
  { id: 6, roll: '22CS0061', name: 'Kiran Reddy' },
]

const MOCK_COMPONENTS: Record<number, { id: number; name: string; maxMarks: number; weightage: number }[]> = {
  1: [
    { id: 1, name: 'Quiz 1', maxMarks: 20, weightage: 10 },
    { id: 2, name: 'Mid-term', maxMarks: 40, weightage: 30 },
    { id: 3, name: 'Assignment 1', maxMarks: 10, weightage: 5 },
    { id: 4, name: 'End-term', maxMarks: 60, weightage: 55 },
  ],
  2: [
    { id: 5, name: 'Quiz 1', maxMarks: 20, weightage: 10 },
    { id: 6, name: 'Mid-term', maxMarks: 40, weightage: 30 },
    { id: 7, name: 'Lab Exam', maxMarks: 30, weightage: 60 },
  ],
  3: [
    { id: 8, name: 'Lab Eval 1', maxMarks: 30, weightage: 30 },
    { id: 9, name: 'Lab Eval 2', maxMarks: 30, weightage: 30 },
    { id: 10, name: 'Viva', maxMarks: 40, weightage: 40 },
  ],
}

// Initial marks: studentId -> componentId -> marks
const INITIAL_MARKS: Record<number, Record<number, number | null>> = {
  1: { 1: 18, 2: 35, 3: 9, 4: null, 5: 17, 6: 32, 7: null, 8: 25, 9: null, 10: null },
  2: { 1: 14, 2: 28, 3: 7, 4: null, 5: 13, 6: 25, 7: null, 8: 20, 9: null, 10: null },
  3: { 1: 16, 2: 31, 3: 8, 4: null, 5: 15, 6: 28, 7: null, 8: 22, 9: null, 10: null },
  4: { 1: 15, 2: 30, 3: 6, 4: null, 5: 12, 6: 26, 7: null, 8: 18, 9: null, 10: null },
  5: { 1: 19, 2: 38, 3: 10, 4: null, 5: 18, 6: 36, 7: null, 8: 28, 9: null, 10: null },
  6: { 1: 17, 2: 34, 3: 9, 4: null, 5: 16, 6: 30, 7: null, 8: 24, 9: null, 10: null },
}

export default function FacultyAssessments() {
  const { token } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0])
  const [marks, setMarks] = useState(INITIAL_MARKS)
  const [absent, setAbsent] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [realComponents, setRealComponents] = useState<AssessmentComponent[]>([])

  const components = MOCK_COMPONENTS[selectedCourse.offeringId] ?? []

  useEffect(() => {
    if (!token) return
    // Try to load real components from backend
    gqlRequest<{ getAssessmentComponents: AssessmentComponent[] }>(
      `query { getAssessmentComponents(offeringId: ${selectedCourse.offeringId}) {
        id offeringId name maxMarks weightagePct conductedOn
      }}`,
      {}, token
    ).then(d => {
      if (d.getAssessmentComponents?.length) setRealComponents(d.getAssessmentComponents)
    }).catch(() => {})
  }, [token, selectedCourse.offeringId])

  const getMark = (studentId: number, componentId: number) =>
    marks[studentId]?.[componentId] ?? null

  const getMetrics = (compId: number) => {
    const componentMarks = STUDENTS.map(s => getMark(s.id, compId)).filter(m => m !== null) as number[]
    if (componentMarks.length === 0) return { avg: '—', max: '—' }
    const sum = componentMarks.reduce((a, b) => a + b, 0)
    const avg = (sum / componentMarks.length).toFixed(1)
    const max = Math.max(...componentMarks)
    return { avg, max }
  }

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Assessments Analytics' }]} />
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Assessments Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              View class performance metrics and individual marks for all components
            </p>
          </div>
        </div>

        {/* Course tabs */}
        <div className="flex items-center gap-2">
          {COURSES.map(c => (
            <button
              key={c.offeringId}
              onClick={() => setSelectedCourse(c)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedCourse.offeringId === c.offeringId ? 'var(--accent)' : 'var(--bg-card)',
                color: selectedCourse.offeringId === c.offeringId ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${selectedCourse.offeringId === c.offeringId ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {c.code}
            </button>
          ))}
        </div>

        {/* Marks grid */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedCourse.code} · {selectedCourse.name}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {components.length} assessment components
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }}>Roll No.</th>
                  <th style={{ minWidth: 140 }}>Name</th>
                  {components.map(c => {
                    const metrics = getMetrics(c.id)
                    return (
                      <th key={c.id} style={{ minWidth: 110 }}>
                        {c.name}
                        <span className="block font-normal mt-1" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                          Max: {c.maxMarks} · Wt: {c.weightage}%
                        </span>
                        <div className="mt-2 p-1.5 rounded" style={{ background: 'var(--bg-default)', border: '1px solid var(--border)' }}>
                          <div className="flex justify-between items-center text-[10px]">
                            <span style={{ color: 'var(--text-muted)' }}>Avg:</span>
                            <span className="font-semibold text-blue-600">{metrics.avg}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] mt-0.5">
                            <span style={{ color: 'var(--text-muted)' }}>Max:</span>
                            <span className="font-semibold text-green-600">{metrics.max}</span>
                          </div>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {STUDENTS.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono text-xs">{s.roll}</span></td>
                    <td className="font-medium text-sm">{s.name}</td>
                    {components.map(c => {
                      const isAbs = absent[`${s.id}-${c.id}`] ?? false
                      const val = getMark(s.id, c.id)
                      return (
                        <td key={c.id}>
                          {isAbs ? (
                            <span className="badge badge-red text-xs">Absent</span>
                          ) : val !== null ? (
                            <span className="text-sm font-medium tabular-nums">{val}</span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
