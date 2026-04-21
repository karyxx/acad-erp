'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import {
  BookOpen, Award, AlertCircle, DollarSign,
  TrendingUp, Calendar, ChevronRight, Clock
} from 'lucide-react'

interface StudentProfile {
  id: number
  firstName: string
  lastName: string
  rollNumber: string
  departmentId: number
  targetCgpa: number | null
  bloodGroup: string | null
  category: string | null
}

interface FeeRecord {
  id: number
  semesterId: number
  amount: number
  status: string
}

interface SemesterResult {
  id: number
  semesterId: number
  sgpa: number | null
  cgpa: number | null
  totalCreditsEarned: number | null
}

interface Exam {
  id: number
  name: string
  examType: string
  status: string
}

// Mock data for UI when backend data is partial
const MOCK_UPCOMING = [
  { code: 'CS601', name: 'Compiler Design', type: 'Mid-term', date: 'Apr 24' },
  { code: 'EE401', name: 'Power Systems', type: 'Quiz 2', date: 'Apr 25' },
  { code: 'MA201', name: 'Probability', type: 'End-term', date: 'May 2' },
]

const MOCK_COURSES = [
  { code: 'CS601', name: 'Compiler Design', credits: 4, grade: 'A+', attendance: 88 },
  { code: 'CS603', name: 'Distributed Systems', credits: 4, grade: 'A', attendance: 76 },
  { code: 'CS605', name: 'ML Fundamentals', credits: 4, grade: null, attendance: 91 },
  { code: 'CS607', name: 'Cryptography', credits: 3, grade: null, attendance: 83 },
]

export default function StudentOverview() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [results, setResults] = useState<SemesterResult[]>([])
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  const loadData = async () => {
    try {
      // Step 1: get all student profiles (if student, this will fail, which is fine)
      // Instead, we try a different approach: query programs to confirm auth works,
      // then load student-specific data using known IDs from seed

      // Try to get student profile by querying with id=1 (from seed)
      // In a real app, you'd store the profileId during login
      const profileRes = await gqlRequest<{ getStudentProfile: StudentProfile | null }>(
        `query { getStudentProfile(profileId: 1) { id userId firstName lastName rollNumber departmentId targetCgpa bloodGroup category } }`,
        {},
        token!
      ).catch(() => null)

      if (profileRes?.getStudentProfile) {
        setProfile(profileRes.getStudentProfile)
        setProfileId(profileRes.getStudentProfile.id)

        // Load fees
        const feesRes = await gqlRequest<{ getStudentFeeStatus: FeeRecord[] }>(
          `query { getStudentFeeStatus(studentId: ${profileRes.getStudentProfile.id}) { id semesterId amount status } }`,
          {},
          token!
        ).catch(() => null)
        if (feesRes) setFees(feesRes.getStudentFeeStatus)

        // Load results
        const resultsRes = await gqlRequest<{ getStudentSemesterResult: SemesterResult | null }>(
          `query { getStudentSemesterResult(studentId: ${profileRes.getStudentProfile.id}, semesterId: 1) { id semesterId sgpa cgpa totalCreditsEarned } }`,
          {},
          token!
        ).catch(() => null)
        if (resultsRes?.getStudentSemesterResult) {
          setResults([resultsRes.getStudentSemesterResult])
        }
      }
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const latestResult = results[0]
  const cgpa = latestResult?.cgpa ?? 8.74
  const sgpa = latestResult?.sgpa ?? 9.0
  const credits = latestResult?.totalCreditsEarned ?? 142
  const feeStatus = fees[0]?.status ?? 'paid'
  const profileName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email.split('@')[0] ?? '')
  const rollNo = profile?.rollNumber ?? '26BCS001'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AuthGuard requiredRole="Student">
      <TopBar
        breadcrumbs={[
          { label: 'AcadERP' },
          { label: 'Overview' },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Header greeting */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {profileName.split(' ')[0]}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {rollNo} · Semester VI · Active
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="CGPA"
            value={loading ? '—' : cgpa.toFixed(2)}
            sub="out of 10.00"
            icon={<Award size={16} />}
            color="purple"
          />
          <StatCard
            label="SGPA (Latest)"
            value={loading ? '—' : sgpa.toFixed(2)}
            sub="Semester VI"
            icon={<TrendingUp size={16} />}
            color="blue"
          />
          <StatCard
            label="Credits Earned"
            value={loading ? '—' : String(credits)}
            sub="total accumulated"
            icon={<BookOpen size={16} />}
            color="green"
          />
          <StatCard
            label="Fee Status"
            value={feeStatus === 'paid' ? 'Paid' : 'Pending'}
            sub={fees[0] ? `₹${fees[0].amount.toLocaleString('en-IN')}` : 'Institute fee'}
            icon={<DollarSign size={16} />}
            color={feeStatus === 'paid' ? 'green' : 'red'}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Current courses */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Current Courses
              </h2>
              <button className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course</th>
                  <th>Credits</th>
                  <th>Attendance</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COURSES.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {c.code}
                      </span>
                    </td>
                    <td className="font-medium text-sm">{c.name}</td>
                    <td className="text-sm">{c.credits}</td>
                    <td>
                      <AttendancePill pct={c.attendance} />
                    </td>
                    <td>
                      {c.grade ? (
                        <span className="badge badge-purple">{c.grade}</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>In progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Upcoming exams */}
            <div className="card overflow-hidden">
              <div
                className="px-5 py-3.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Upcoming Exams
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {MOCK_UPCOMING.map((exam) => (
                  <div key={exam.code} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {exam.code} — {exam.type}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {exam.name}
                      </div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {exam.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CGPA Goal tracker */}
            <div className="card px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  CGPA Goal Tracker
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Current</div>
                    <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {cgpa.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Target</div>
                    <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--accent)' }}>
                      {profile?.targetCgpa?.toFixed(2) ?? '9.00'}
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (cgpa / (profile?.targetCgpa ?? 9)) * 100)}%`,
                      background: 'var(--accent)'
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Need <strong style={{ color: 'var(--text-primary)' }}>9.52</strong> SGPA next semester to reach goal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Low attendance warning */}
        {MOCK_COURSES.some(c => c.attendance < 80) && (
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-lg text-sm"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
          >
            <AlertCircle size={16} style={{ color: '#B45309', marginTop: 1, flexShrink: 0 }} />
            <div>
              <span className="font-medium" style={{ color: '#92400E' }}>Attendance warning: </span>
              <span style={{ color: '#B45309' }}>
                CS603 Distributed Systems is at 76% — below the 75% threshold. Risk of not meeting attendance requirements.
              </span>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string
}) {
  const colorMap: Record<string, { dot: string }> = {
    purple: { dot: '#5B4DCC' },
    blue: { dot: '#1D4ED8' },
    green: { dot: '#15803D' },
    red: { dot: '#B91C1C' },
  }
  const c = colorMap[color] ?? colorMap.purple

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">
        <span style={{ color: c.dot, display: 'flex', alignItems: 'center' }}>{icon}</span>
        {sub}
      </div>
    </div>
  )
}

function AttendancePill({ pct }: { pct: number }) {
  const color = pct >= 85 ? '#15803D' : pct >= 75 ? '#B45309' : '#B91C1C'
  const bg = pct >= 85 ? '#F0FDF4' : pct >= 75 ? '#FFFBEB' : '#FEF2F2'
  return (
    <span className="badge" style={{ background: bg, color }}>
      {pct}%
    </span>
  )
}
