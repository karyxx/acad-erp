'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { Check, X, Search, FileText } from 'lucide-react'

const MOCK_FEES = [
  { id: 1, student: 'Aryan Mehta', roll: '22CS0101', semester: 6, amount: 125000, status: 'paid', receipt: 'RCPT-001.pdf' },
  { id: 2, student: 'Rohan Das', roll: '22CS0047', semester: 6, amount: 125000, status: 'pending', receipt: null },
  { id: 3, student: 'Sneha Agarwal', roll: '22CS0089', semester: 6, amount: 125000, status: 'partial', receipt: 'RCPT-003.pdf' },
  { id: 4, student: 'Priya Nair', roll: '22EE0012', semester: 6, amount: 125000, status: 'paid', receipt: 'RCPT-004.pdf' },
  { id: 5, student: 'Vikram Iyer', roll: '22CE0098', semester: 6, amount: 125000, status: 'unpaid', receipt: null },
]

export default function AdminFinance() {
  const [fees, setFees] = useState(MOCK_FEES)
  const [search, setSearch] = useState('')

  const handleUpdateStatus = (id: number, status: string) => {
    setFees(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }

  const filtered = fees.filter(f => f.student.toLowerCase().includes(search.toLowerCase()) || f.roll.toLowerCase().includes(search.toLowerCase()))

  return (
    <AuthGuard requiredRole="Admin">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Admin' }, { label: 'Finance' }]} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Financial Administration</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Verify student fee payments and receipts.</p>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="erp-input pl-9 text-sm"
                style={{ width: 300 }}
              />
            </div>
            <div className="flex gap-2">
              <span className="badge" style={{ background: '#F0FDF4', color: '#15803D' }}>{fees.filter(f => f.status === 'paid').length} Paid</span>
              <span className="badge" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{fees.filter(f => f.status !== 'paid').length} Pending</span>
            </div>
          </div>
          
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student Name</th>
                <th>Semester</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="font-mono text-xs">{f.roll}</td>
                  <td className="font-medium text-sm">{f.student}</td>
                  <td>{f.semester}</td>
                  <td className="tabular-nums">₹{f.amount.toLocaleString()}</td>
                  <td>
                    <span className="badge capitalize" style={{
                      background: f.status === 'paid' ? '#F0FDF4' : f.status === 'partial' ? '#FFFBEB' : '#FEF2F2',
                      color: f.status === 'paid' ? '#15803D' : f.status === 'partial' ? '#B45309' : '#B91C1C'
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    {f.receipt ? (
                      <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                        <FileText size={14} /> View
                      </button>
                    ) : <span className="text-xs text-gray-400">None</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <select 
                        className="erp-input text-xs py-1 px-2 h-7" 
                        value={f.status}
                        onChange={e => handleUpdateStatus(f.id, e.target.value)}
                      >
                        <option value="paid">Mark Paid</option>
                        <option value="partial">Mark Partial</option>
                        <option value="pending">Mark Pending</option>
                        <option value="unpaid">Mark Unpaid</option>
                      </select>
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
