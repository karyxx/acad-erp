'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Search, Filter } from 'lucide-react'

const ALL_STUDENTS = [
  { roll: '22CS0101', name: 'Aryan Mehta', course: 'CS601', batch: 'B.Tech CSE 2022', attendance: 88, cgpa: 8.74 },
  { roll: '22CS0047', name: 'Rohan Das', course: 'CS601', batch: 'B.Tech CSE 2022', attendance: 68, cgpa: 7.12 },
  { roll: '22CS0089', name: 'Sneha Agarwal', course: 'CS601', batch: 'B.Tech CSE 2022', attendance: 71, cgpa: 7.80 },
  { roll: '22CS0112', name: 'Vikram Iyer', course: 'CS601', batch: 'B.Tech CSE 2022', attendance: 74, cgpa: 6.95 },
  { roll: '22CS0198', name: 'Divya Pillai', course: 'CS601', batch: 'B.Tech CSE 2022', attendance: 92, cgpa: 9.21 },
  { roll: '22CS0061', name: 'Kiran Reddy', course: 'CS603', batch: 'B.Tech CSE 2022', attendance: 85, cgpa: 8.43 },
  { roll: '22CS0220', name: 'Neha Gupta', course: 'CS603', batch: 'B.Tech CSE 2022', attendance: 79, cgpa: 8.17 },
  { roll: '22EE0034', name: 'Priya Nair', course: 'CS691', batch: 'B.Tech EE 2022', attendance: 95, cgpa: 9.04 },
  { roll: '22EE0056', name: 'Rahul Singh', course: 'CS691', batch: 'B.Tech EE 2022', attendance: 87, cgpa: 8.56 },
]

export default function FacultyStudents() {
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('All')

  const courses = ['All', 'CS601', 'CS603', 'CS691']

  const filtered = ALL_STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.includes(search)
    const matchCourse = courseFilter === 'All' || s.course === courseFilter
    return matchSearch && matchCourse
  })

  return (
    <AuthGuard requiredRole="Faculty">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Students' }]} />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Students</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              All students enrolled in your courses
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or roll no."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="erp-input pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {courses.map(c => (
              <button
                key={c}
                onClick={() => setCourseFilter(c)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: courseFilter === c ? 'var(--accent)' : 'var(--bg-card)',
                  color: courseFilter === c ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${courseFilter === c ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Attendance</th>
                <th>CGPA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.roll}>
                  <td><span className="font-mono text-xs">{s.roll}</span></td>
                  <td className="font-medium text-sm">{s.name}</td>
                  <td>
                    <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{s.course}</span>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.batch}</td>
                  <td><AttPill pct={s.attendance} /></td>
                  <td>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: s.cgpa >= 8.5 ? '#15803D' : s.cgpa >= 7 ? 'var(--text-primary)' : '#B45309' }}
                    >
                      {s.cgpa.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center" style={{ color: 'var(--text-muted)', padding: '32px' }}>
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  )
}

function AttPill({ pct }: { pct: number }) {
  const color = pct >= 85 ? '#15803D' : pct >= 75 ? '#B45309' : '#B91C1C'
  const bg = pct >= 85 ? '#F0FDF4' : pct >= 75 ? '#FFFBEB' : '#FEF2F2'
  return <span className="badge" style={{ background: bg, color }}>{pct}%</span>
}
