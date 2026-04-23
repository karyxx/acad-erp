'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Link as LinkIcon, Plus } from 'lucide-react'

const MOCK_FORMS = [
  { id: 1, name: 'Mid-term Faculty Evaluation - CSE', link: 'https://forms.gle/xyz123', status: 'active', responses: 142 },
  { id: 2, name: 'End-term Course Feedback - EE', link: 'https://forms.gle/abc456', status: 'draft', responses: 0 },
  { id: 3, name: 'Lab Facilities Survey', link: 'https://forms.gle/lab789', status: 'closed', responses: 89 },
]

export default function AdminFeedback() {
  const [forms, setForms] = useState(MOCK_FORMS)

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Feedback Forms' }]} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Feedback Administration</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Generate and monitor feedback forms and review links.</p>
          </div>
          <button className="btn-primary">
            <Plus size={16} /> Create Form
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Status</th>
                <th>Responses</th>
                <th>Share Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(f => (
                <tr key={f.id}>
                  <td className="font-medium text-sm">{f.name}</td>
                  <td>
                    <span className="badge capitalize" style={{
                      background: f.status === 'active' ? '#F0FDF4' : f.status === 'draft' ? '#F3E8FF' : '#F8FAFC',
                      color: f.status === 'active' ? '#15803D' : f.status === 'draft' ? '#7E22CE' : '#475569'
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td className="tabular-nums text-sm">{f.responses}</td>
                  <td>
                    <a href={f.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                      <LinkIcon size={12} /> {f.link.replace('https://', '')}
                    </a>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-semibold text-gray-600 hover:text-black">Edit</button>
                      <span className="text-gray-300">|</span>
                      <button className="text-xs font-semibold text-red-600 hover:underline">Close Form</button>
                    </div>
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
