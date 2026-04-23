'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { BookOpen, Search, Plus, Filter } from 'lucide-react'

const MOCK_COURSES = [
  { id: 1, code: 'CS601', name: 'Compiler Design', dept: 'CSE', credits: 4, type: 'core' },
  { id: 2, code: 'CS603', name: 'Distributed Systems', dept: 'CSE', credits: 4, type: 'core' },
  { id: 3, code: 'EE401', name: 'Control Systems', dept: 'EE', credits: 3, type: 'elective' },
  { id: 4, code: 'MA201', name: 'Linear Algebra', dept: 'MA', credits: 4, type: 'core' },
  { id: 5, code: 'CS691', name: 'Systems Lab', dept: 'CSE', credits: 2, type: 'lab' },
]

export default function AdminCourses() {
  const [courses, setCourses] = useState(MOCK_COURSES)
  const [search, setSearch] = useState('')

  const filtered = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Courses' }]} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Academic Lifecycle</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage courses, programs, and curriculum updates.</p>
          </div>
          <button className="btn-primary">
            <Plus size={16} /> New Course
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="erp-input pl-9 text-sm"
                style={{ width: 300 }}
              />
            </div>
            <button className="btn-secondary">
              <Filter size={14} /> Filter Dept
            </button>
          </div>
          
          <table className="erp-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Department</th>
                <th>Credits</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-sm font-medium">{c.code}</td>
                  <td className="text-sm">{c.name}</td>
                  <td>{c.dept}</td>
                  <td>{c.credits}</td>
                  <td>
                    <span className="badge capitalize" style={{
                      background: c.type === 'core' ? '#EFF6FF' : c.type === 'lab' ? '#F3E8FF' : '#F8FAFC',
                      color: c.type === 'core' ? '#1D4ED8' : c.type === 'lab' ? '#7E22CE' : '#475569'
                    }}>
                      {c.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  )
}
