'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { BookOpen, Search, Plus, Filter, X } from 'lucide-react'

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
  const [showModal, setShowModal] = useState(false)
  const [newCourse, setNewCourse] = useState({ code: '', name: '', dept: 'CSE', credits: 4, type: 'core' })

  const filtered = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault()
    setCourses([...courses, { ...newCourse, id: Date.now() }])
    setShowModal(false)
    setNewCourse({ code: '', name: '', dept: 'CSE', credits: 4, type: 'core' })
  }

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Courses' }]} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Academic Lifecycle</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage courses, programs, and curriculum updates.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add New Course</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Course Code</label>
                <input required type="text" className="erp-input w-full" value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} placeholder="e.g. CS605" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Course Name</label>
                <input required type="text" className="erp-input w-full" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} placeholder="e.g. Machine Learning" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Department</label>
                  <select className="erp-input w-full" value={newCourse.dept} onChange={e => setNewCourse({...newCourse, dept: e.target.value})}>
                    <option value="CSE">CSE</option>
                    <option value="EE">EE</option>
                    <option value="MA">MA</option>
                    <option value="HS">HS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Credits</label>
                  <input required type="number" min="1" max="6" className="erp-input w-full" value={newCourse.credits} onChange={e => setNewCourse({...newCourse, credits: parseInt(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Course Type</label>
                <select className="erp-input w-full" value={newCourse.type} onChange={e => setNewCourse({...newCourse, type: e.target.value})}>
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
