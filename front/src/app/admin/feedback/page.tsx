'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Link as LinkIcon, Plus, X } from 'lucide-react'

const MOCK_FORMS = [
  { id: 1, name: 'Mid-term Faculty Evaluation - CSE', link: 'https://forms.gle/xyz123', status: 'active', responses: 142 },
  { id: 2, name: 'End-term Course Feedback - EE', link: 'https://forms.gle/abc456', status: 'draft', responses: 0 },
  { id: 3, name: 'Lab Facilities Survey', link: 'https://forms.gle/lab789', status: 'closed', responses: 89 },
]

export default function AdminFeedback() {
  const [forms, setForms] = useState(MOCK_FORMS)
  const [showModal, setShowModal] = useState(false)
  const [editingForm, setEditingForm] = useState<{ id?: number, name: string, link: string, status: string } | null>(null)

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingForm) return

    if (editingForm.id) {
      setForms(forms.map(f => f.id === editingForm.id ? { ...f, ...editingForm } as typeof f : f))
    } else {
      setForms([...forms, { ...editingForm, id: Date.now(), responses: 0 } as typeof forms[0]])
    }
    setShowModal(false)
    setEditingForm(null)
  }

  const openCreateModal = () => {
    setEditingForm({ name: '', link: '', status: 'draft' })
    setShowModal(true)
  }

  const openEditModal = (form: typeof forms[0]) => {
    setEditingForm({ ...form })
    setShowModal(true)
  }

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Feedback Forms' }]} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Feedback Administration</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Generate and monitor feedback forms and review links.</p>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
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
                      <button className="text-xs font-semibold text-gray-600 hover:text-black" onClick={() => openEditModal(f)}>Edit</button>
                      {f.status !== 'closed' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => setForms(forms.map(form => form.id === f.id ? { ...form, status: 'closed' } : form))}>Close Form</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{editingForm.id ? 'Edit' : 'Create'} Feedback Form</h2>
              <button onClick={() => { setShowModal(false); setEditingForm(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Form Name</label>
                <input required type="text" className="erp-input w-full" value={editingForm.name} onChange={e => setEditingForm({...editingForm, name: e.target.value})} placeholder="e.g. End-term Course Feedback" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Google Forms Link</label>
                <input required type="url" className="erp-input w-full" value={editingForm.link} onChange={e => setEditingForm({...editingForm, link: e.target.value})} placeholder="https://forms.gle/..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <select className="erp-input w-full" value={editingForm.status} onChange={e => setEditingForm({...editingForm, status: e.target.value})}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingForm(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Form</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
