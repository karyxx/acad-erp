'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { DollarSign, Download, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface StudentFee {
  id: number
  studentId: number
  semesterId: number
  amount: number
  status: string
  receiptUrl: string | null
}

interface Semester {
  id: number
  programId: number
  number: number
  startDate: string
  endDate: string
  isCurrent: boolean
}

interface EnrichedFee {
  fee: StudentFee
  semester: Semester | null
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'paid') return <CheckCircle size={16} style={{ color: '#15803D' }} />
  if (status === 'partial') return <AlertCircle size={16} style={{ color: '#D97706' }} />
  return <XCircle size={16} style={{ color: '#DC2626' }} />
}

function statusBadgeClass(status: string) {
  if (status === 'paid') return 'badge-green'
  if (status === 'partial') return 'badge-amber'
  return 'badge-red'
}

export default function StudentFees() {
  const { token } = useAuth()
  const { profileId, loading: profileLoading } = useStudentProfile()

  const [fees, setFees] = useState<EnrichedFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !profileId) return
    loadFees()
  }, [token, profileId])

  async function loadFees() {
    setLoading(true)
    setError(null)
    try {
      const [feesRes, semestersRes] = await Promise.all([
        gqlRequest<{ getStudentFeeStatus: StudentFee[] }>(
          `query { getStudentFeeStatus(studentId: ${profileId}) { id studentId semesterId amount status receiptUrl } }`,
          {}, token!
        ).catch(() => ({ getStudentFeeStatus: [] })),
        gqlRequest<{ getSemesters: Semester[] }>(
          'query { getSemesters { id programId number startDate endDate isCurrent } }',
          {}, token!
        ).catch(() => ({ getSemesters: [] })),
      ])

      const semMap = new Map(semestersRes.getSemesters.map(s => [s.id, s]))

      const enriched: EnrichedFee[] = feesRes.getStudentFeeStatus.map(fee => ({
        fee,
        semester: semMap.get(fee.semesterId) ?? null,
      }))

      // Sort: current semester first, then by semester number
      enriched.sort((a, b) => {
        if (a.semester?.isCurrent && !b.semester?.isCurrent) return -1
        if (!a.semester?.isCurrent && b.semester?.isCurrent) return 1
        return (b.semester?.number ?? 0) - (a.semester?.number ?? 0)
      })

      setFees(enriched)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fee records')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = profileLoading || loading

  const totalPaid = fees.filter(e => e.fee.status === 'paid').reduce((s, e) => s + e.fee.amount, 0)
  const totalDue = fees.filter(e => e.fee.status !== 'paid').reduce((s, e) => s + e.fee.amount, 0)
  const currentSemFee = fees.find(e => e.semester?.isCurrent)

  function formatINR(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'Fee Status' }]} />
      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Current Semester</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {isLoading ? '—' : currentSemFee ? (
                <span className={`badge ${statusBadgeClass(currentSemFee.fee.status)}`} style={{ fontSize: 14 }}>
                  {currentSemFee.fee.status.charAt(0).toUpperCase() + currentSemFee.fee.status.slice(1)}
                </span>
              ) : '—'}
            </div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
              {currentSemFee ? formatINR(currentSemFee.fee.amount) : 'No data'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Paid</div>
            <div className="stat-value" style={{ fontSize: 20, color: '#15803D' }}>
              {isLoading ? '—' : formatINR(totalPaid)}
            </div>
            <div className="stat-sub"><CheckCircle size={12} style={{ color: '#15803D' }} /> all time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Outstanding Dues</div>
            <div className="stat-value" style={{ fontSize: 20, color: totalDue > 0 ? '#DC2626' : 'var(--text-primary)' }}>
              {isLoading ? '—' : formatINR(totalDue)}
            </div>
            <div className="stat-sub" style={{ color: totalDue > 0 ? '#DC2626' : 'var(--text-muted)' }}>
              {totalDue > 0 ? 'Payment pending' : 'All clear'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fee Records</div>
            <div className="stat-value">{isLoading ? '—' : fees.length}</div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>semesters</div>
          </div>
        </div>

        {/* Unpaid warning */}
        {totalDue > 0 && !isLoading && (
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-lg"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <AlertCircle size={16} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
            <div className="text-sm">
              <span className="font-semibold" style={{ color: '#991B1B' }}>Outstanding fees: </span>
              <span style={{ color: '#B91C1C' }}>
                You have pending dues of {formatINR(totalDue)}. Please clear your fees to avoid registration blocks.
              </span>
            </div>
          </div>
        )}

        {/* Fee table */}
        {isLoading ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading fee records…
          </div>
        ) : error ? (
          <div className="card px-5 py-8 text-center text-sm" style={{ color: '#B91C1C' }}>{error}</div>
        ) : fees.length === 0 ? (
          <div className="card px-5 py-12 text-center">
            <DollarSign size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No fee records found</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              No fee entries have been created for your account yet.
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Fee History</h2>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(({ fee, semester }) => (
                  <tr key={fee.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          Semester {semester?.number ?? fee.semesterId}
                        </span>
                        {semester?.isCurrent && (
                          <span className="badge badge-purple" style={{ fontSize: 10 }}>Current</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {semester ? (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(semester.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          {' – '}
                          {new Date(semester.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold tabular-nums text-sm" style={{ color: 'var(--text-primary)' }}>
                        {formatINR(fee.amount)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={fee.status} />
                        <span className={`badge ${statusBadgeClass(fee.status)}`}>
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {fee.receiptUrl ? (
                        <a
                          href={fee.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: 'var(--accent)' }}
                        >
                          <Download size={12} />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Receipt archive - only entries with receipts */}
        {fees.some(e => e.fee.receiptUrl) && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Receipt Archive</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Downloadable fee receipts</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {fees.filter(e => e.fee.receiptUrl).map(({ fee, semester }) => (
                <div key={fee.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Semester {semester?.number ?? fee.semesterId} Receipt
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatINR(fee.amount)} · {fee.status}
                    </div>
                  </div>
                  <a
                    href={fee.receiptUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs"
                  >
                    <Download size={13} />
                    Download PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
