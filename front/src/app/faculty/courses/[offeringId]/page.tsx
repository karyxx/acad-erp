'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { CheckCircle2, AlertTriangle, Save, Plus } from 'lucide-react'

// Tabs
type Tab = 'students' | 'attendance' | 'assessments' | 'marks'

const MOCK_STUDENTS = [
  { id: 1, roll: '22CS0101', name: 'Aryan Mehta', attendance: 88, quiz1: 18, midterm: 35, assignment: 9 },
  { id: 2, roll: '22CS0047', name: 'Rohan Das', attendance: 68, quiz1: 14, midterm: 28, assignment: 7 },
  { id: 3, roll: '22CS0089', name: 'Sneha Agarwal', attendance: 71, quiz1: 16, midterm: 31, assignment: 8 },
  { id: 4, roll: '22CS0112', name: 'Vikram Iyer', attendance: 74, quiz1: 15, midterm: 30, assignment: 6 },
  { id: 5, roll: '22CS0198', name: 'Divya Pillai', attendance: 92, quiz1: 19, midterm: 38, assignment: 10 },
  { id: 6, roll: '22CS0061', name: 'Kiran Reddy', attendance: 85, quiz1: 17, midterm: 34, assignment: 9 },
]

type StudentRow = typeof MOCK_STUDENTS[number]

export default function CourseManage({ params }: { params: { offeringId: string } }) {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('students')
  const [students, setStudents] = useState(MOCK_STUDENTS)
  const [editingMarks, setEditingMarks] = useState<Record<number, Record<number, number>>>({})
  const [saved, setSaved] = useState(false)
  
  const [components, setComponents] = useState([
    { id: 1, name: 'Quiz 1', max: 20, weightage: 10 },
    { id: 2, name: 'Mid-term', max: 40, weightage: 30 },
    { id: 3, name: 'Assignment', max: 10, weightage: 10 },
  ])
  const [selectedCompId, setSelectedCompId] = useState<number>(1)
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0])

  const courseName = params.offeringId === '1' ? 'CS601 · Compiler Design'
    : params.offeringId === '2' ? 'CS603 · Distributed Systems'
    : 'CS691 · Systems Lab'

  const handleMarkChange = (studentId: number, compId: number, value: string) => {
    const num = parseFloat(value)
    setEditingMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [compId]: isNaN(num) ? 0 : num }
    }))
  }

  const getMarkValue = (student: StudentRow, compId: number) => {
    if (editingMarks[student.id]?.[compId] !== undefined) return editingMarks[student.id][compId]
    if (compId === 1) return student.quiz1
    if (compId === 2) return student.midterm
    if (compId === 3) return student.assignment
    return 0
  }

  const handleSaveMarks = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[
        { label: 'AcadERP' },
        { label: 'My Courses', href: '/faculty/courses' },
        { label: courseName },
      ]} />
      <div className="p-6 space-y-5">
        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {(['students', 'attendance', 'assessments', 'marks'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
              style={{
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t === 'marks' ? 'Enter Marks' : t === 'assessments' ? 'Structure' : t}
            </button>
          ))}
        </div>

        {/* Students tab */}
        {tab === 'students' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Enrolled Students · {students.length}
              </h2>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Attendance</th>
                  <th>Quiz 1</th>
                  <th>Mid-term</th>
                  <th>Assignment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const total = s.quiz1 + s.midterm + s.assignment
                  const maxTotal = 70
                  const pct = Math.round((total / maxTotal) * 100)
                  return (
                    <tr key={s.id}>
                      <td><span className="font-mono text-xs">{s.roll}</span></td>
                      <td className="font-medium text-sm">{s.name}</td>
                      <td><AttPill pct={s.attendance} /></td>
                      <td className="text-sm tabular-nums">{s.quiz1}/20</td>
                      <td className="text-sm tabular-nums">{s.midterm}/40</td>
                      <td className="text-sm tabular-nums">{s.assignment}/10</td>
                      <td>
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: pct >= 75 ? '#15803D' : pct >= 50 ? '#B45309' : '#B91C1C' }}
                        >
                          {total}/{maxTotal}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Attendance tab */}
        {tab === 'attendance' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Mark Attendance</h2>
                <input 
                  type="date"
                  value={attDate}
                  onChange={e => setAttDate(e.target.value)}
                  className="erp-input text-xs"
                  style={{ padding: '4px 8px', maxWidth: 150 }}
                />
              </div>
              <button className="btn-primary text-sm">
                <Save size={13} /> Save Attendance
              </button>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Overall %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono text-xs">{s.roll}</span></td>
                    <td className="font-medium text-sm">{s.name}</td>
                    <td><AttPill pct={s.attendance} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        {['present', 'absent', 'late'].map(status => (
                          <label key={status} className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name={`att-${s.id}`}
                              defaultChecked={status === 'present'}
                              style={{ accentColor: 'var(--accent)' }}
                            />
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assessments Structure tab */}
        {tab === 'assessments' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Assessment Structure</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Define the components and their weightage for this course.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Component Name</th>
                    <th>Max Marks</th>
                    <th>Weightage (%)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map(c => (
                    <tr key={c.id}>
                      <td>
                        <input 
                          className="erp-input text-sm" value={c.name} 
                          onChange={e => setComponents(prev => prev.map(p => p.id === c.id ? { ...p, name: e.target.value } : p))}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" min={0} className="erp-input text-sm tabular-nums" style={{ maxWidth: 100 }} value={c.max} 
                          onChange={e => setComponents(prev => prev.map(p => p.id === c.id ? { ...p, max: Number(e.target.value) } : p))}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" min={0} max={100} className="erp-input text-sm tabular-nums" style={{ maxWidth: 100 }} value={c.weightage} 
                          onChange={e => setComponents(prev => prev.map(p => p.id === c.id ? { ...p, weightage: Number(e.target.value) } : p))}
                        />
                      </td>
                      <td>
                        <button 
                          onClick={() => setComponents(prev => prev.filter(p => p.id !== c.id))}
                          className="text-red-600 text-xs font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {components.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>No components added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button 
                onClick={() => setComponents(prev => [...prev, { id: Date.now(), name: 'New Component', max: 100, weightage: 10 }])}
                className="btn-secondary text-xs"
              >
                <Plus size={14} /> Add Component
              </button>
            </div>
          </div>
        )}

        {/* Enter Marks tab */}
        {tab === 'marks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select Component:</span>
                 <select 
                   className="erp-input text-sm bg-white cursor-pointer" 
                   value={selectedCompId} 
                   onChange={e => setSelectedCompId(Number(e.target.value))}
                   style={{ minWidth: 200 }}
                 >
                   {components.length === 0 && <option value={0}>No components defined</option>}
                   {components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <div className="flex items-center gap-3">
                 {saved && (
                   <span className="flex items-center gap-1.5 text-sm" style={{ color: '#15803D' }}>
                     <CheckCircle2 size={14} /> Saved
                   </span>
                 )}
                 <button onClick={handleSaveMarks} disabled={components.length === 0} className="btn-primary">
                   <Save size={14} /> Save Marks
                 </button>
              </div>
            </div>

            {components.filter(c => c.id === selectedCompId).map(comp => (
              <div key={comp.id} className="card overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{comp.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Max marks: {comp.max} • Weightage: {comp.weightage}%</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Roll No.</th>
                        <th>Name</th>
                        <th>Marks / {comp.max}</th>
                        <th>Absent?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id}>
                          <td><span className="font-mono text-xs">{s.roll}</span></td>
                          <td className="font-medium text-sm">{s.name}</td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              max={comp.max}
                              value={getMarkValue(s, comp.id)}
                              onChange={e => handleMarkChange(s.id, comp.id, e.target.value)}
                              className="erp-input tabular-nums font-medium"
                              style={{ width: 90 }}
                            />
                          </td>
                          <td>
                            <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: 'var(--accent)' }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

function AttPill({ pct }: { pct: number }) {
  const color = pct >= 85 ? '#15803D' : pct >= 75 ? '#B45309' : '#B91C1C'
  const bg = pct >= 85 ? '#F0FDF4' : pct >= 75 ? '#FFFBEB' : '#FEF2F2'
  return <span className="badge" style={{ background: bg, color }}>{pct}%</span>
}
