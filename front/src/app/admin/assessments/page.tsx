'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react'

// Mock grade data for the submitted course
const MOCK_GRADE_DETAILS: Record<number, { students: { roll: string; name: string; a1: number; quiz: number; midterm: number; total: number; grade: string }[] }> = {
  1: {
    students: [
      { roll: '22CS0101', name: 'Aryan Mehta',   a1: 18, quiz: 25, midterm: 82, total: 79, grade: 'A+' },
      { roll: '22CS0047', name: 'Rohan Das',     a1: 14, quiz: 18, midterm: 65, total: 61, grade: 'B+' },
      { roll: '22CS0089', name: 'Sneha Agarwal', a1: 16, quiz: 22, midterm: 75, total: 72, grade: 'A'  },
      { roll: '22CS0112', name: 'Vikram Iyer',   a1: 15, quiz: 20, midterm: 70, total: 68, grade: 'B+' },
      { roll: '22CS0198', name: 'Divya Pillai',  a1: 19, quiz: 27, midterm: 91, total: 88, grade: 'A+' },
      { roll: '22CS0061', name: 'Kiran Reddy',   a1: 17, quiz: 24, midterm: 80, total: 77, grade: 'A'  },
    ]
  }
}

const GRADE_COLOR: Record<string, { bg: string; color: string }> = {
  'O':  { bg: '#F0FDF4', color: '#15803D' },
  'A+': { bg: '#F0FDF4', color: '#15803D' },
  'A':  { bg: '#EFF6FF', color: '#1D4ED8' },
  'B+': { bg: '#EFF6FF', color: '#1D4ED8' },
  'B':  { bg: '#FFFBEB', color: '#B45309' },
  'C':  { bg: '#FFFBEB', color: '#B45309' },
  'F':  { bg: '#FEF2F2', color: '#B91C1C' },
}

const MOCK_SUBMISSIONS = [
  { id: 1, course: 'CS601 · Compiler Design',   faculty: 'Dr. Rahul Sharma',  status: 'submitted', date: '2026-04-20', hasGrades: true  },
  { id: 2, course: 'EE401 · Control Systems',   faculty: 'Dr. Ananya Verma',  status: 'approved',  date: '2026-04-18', hasGrades: true  },
  { id: 3, course: 'MA201 · Linear Algebra',    faculty: 'Dr. Suresh Gupta',  status: 'pending',   date: null,        hasGrades: false },
]

export default function AdminAssessments() {
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleAction = (id: number, action: 'approved' | 'revision_requested') => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s))
    if (action === 'approved') setExpandedId(null)
  }

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Grade Approvals' }]} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Grade Approvals</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Review student grades submitted by faculty and publish or send back for revision.
          </p>
        </div>

        <div className="card overflow-hidden">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Instructor</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Review</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <>
                  <tr key={s.id} style={{ background: expandedId === s.id ? 'var(--bg-subtle, #F8FAFC)' : '' }}>
                    <td className="font-medium text-sm">{s.course}</td>
                    <td className="text-sm">{s.faculty}</td>
                    <td className="text-sm">{s.date || '--'}</td>
                    <td>
                      {s.status === 'submitted' && (
                        <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                          <Clock size={12} className="inline mr-1" />Pending Review
                        </span>
                      )}
                      {s.status === 'approved' && (
                        <span className="badge" style={{ background: '#F0FDF4', color: '#15803D' }}>
                          <CheckCircle2 size={12} className="inline mr-1" />Published
                        </span>
                      )}
                      {s.status === 'revision_requested' && (
                        <span className="badge" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                          <XCircle size={12} className="inline mr-1" />Revision Requested
                        </span>
                      )}
                      {s.status === 'pending' && (
                        <span className="badge" style={{ background: '#F9FAFB', color: '#6B7280' }}>Awaiting Submission</span>
                      )}
                    </td>
                    <td>
                      {s.hasGrades ? (
                        <button
                          onClick={() => toggleExpand(s.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Eye size={13} />
                          {expandedId === s.id ? 'Hide Grades' : 'View Grades'}
                          {expandedId === s.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No grades yet</span>
                      )}
                    </td>
                    <td>
                      {s.status === 'submitted' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(s.id, 'approved')}
                            className="text-xs font-semibold text-green-700 hover:underline"
                          >
                            Approve & Publish
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleAction(s.id, 'revision_requested')}
                            className="text-xs font-semibold text-red-700 hover:underline"
                          >
                            Request Revision
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded grade detail panel */}
                  {expandedId === s.id && MOCK_GRADE_DETAILS[s.id] && (
                    <tr key={`${s.id}-detail`}>
                      <td colSpan={6} style={{ padding: 0, background: 'var(--bg-subtle, #F8FAFC)' }}>
                        <div className="px-6 py-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Student Grade Breakdown — {s.course}
                          </h3>
                          <table className="erp-table" style={{ background: 'white' }}>
                            <thead>
                              <tr>
                                <th>Roll No.</th>
                                <th>Name</th>
                                <th>Assignment 1 <span className="font-normal text-gray-400">/20</span></th>
                                <th>Quiz 1 <span className="font-normal text-gray-400">/30</span></th>
                                <th>Midterm <span className="font-normal text-gray-400">/100</span></th>
                                <th>Weighted Total</th>
                                <th>Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {MOCK_GRADE_DETAILS[s.id].students.map(stu => (
                                <tr key={stu.roll}>
                                  <td className="font-mono text-xs">{stu.roll}</td>
                                  <td className="font-medium text-sm">{stu.name}</td>
                                  <td className="tabular-nums">{stu.a1}</td>
                                  <td className="tabular-nums">{stu.quiz}</td>
                                  <td className="tabular-nums">{stu.midterm}</td>
                                  <td className="tabular-nums font-semibold">{stu.total}%</td>
                                  <td>
                                    <span
                                      className="badge font-bold"
                                      style={GRADE_COLOR[stu.grade] ?? { bg: '#F3F4F6', color: '#374151' }}
                                    >
                                      {stu.grade}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {s.status === 'submitted' && (
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                onClick={() => handleAction(s.id, 'approved')}
                                className="btn-primary"
                              >
                                <CheckCircle2 size={14} /> Approve & Publish Grades
                              </button>
                              <button
                                onClick={() => handleAction(s.id, 'revision_requested')}
                                className="btn-secondary"
                                style={{ borderColor: '#FCA5A5', color: '#B91C1C' }}
                              >
                                <XCircle size={14} /> Request Revision from Faculty
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  )
}
