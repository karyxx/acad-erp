'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { User, Phone, MapPin, CreditCard, Building2, Shield } from 'lucide-react'

interface StudentProfile {
  id: number
  firstName: string
  lastName: string
  rollNumber: string
  departmentId: number | null
  dateOfBirth: string | null
  gender: string | null
  phone: string | null
  bloodGroup: string | null
  category: string | null
  fatherName: string | null
  fatherProfession: string | null
  motherName: string | null
  motherProfession: string | null
  guardianName: string | null
  guardianPhone: string | null
  emergencyContactName: string | null
  emergencyContactMobile: string | null
  aadharNumber: string | null
  abcId: string | null
  localGuardian: string | null
  hostelName: string | null
  hostelRoomNo: string | null
  homeAddressCity: string | null
  homeAddressState: string | null
  bankName: string | null
  bankAccountNo: string | null
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || '—'}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function StudentProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    gqlRequest<{ getStudentProfile: StudentProfile }>(
      `query { getStudentProfile(profileId: 1) {
        id firstName lastName rollNumber departmentId dateOfBirth gender phone
        bloodGroup category fatherName fatherProfession motherName motherProfession
        guardianName guardianPhone emergencyContactName emergencyContactMobile
        aadharNumber abcId localGuardian hostelName hostelRoomNo
        homeAddressCity homeAddressState bankName bankAccountNo
      }}`,
      {},
      token
    )
      .then(d => setProfile(d.getStudentProfile))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const p = profile

  return (
    <AuthGuard requiredRole="Student">
      <TopBar breadcrumbs={[{ label: 'AcadERP' }, { label: 'My Profile' }]} />
      <div className="p-6">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            {p ? `${p.firstName[0]}${p.lastName[0]}` : '?'}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {p ? `${p.firstName} ${p.lastName}` : '—'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="badge badge-green">Active</span>
              <span className="badge badge-purple">{p?.rollNumber ?? '—'}</span>
              {p?.category && <span className="badge badge-gray">{p.category}</span>}
              {p?.bloodGroup && <span className="badge badge-red">{p.bloodGroup}</span>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading profile…</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Section title="Personal Information" icon={<User size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Date of birth" value={p?.dateOfBirth ?? 'Not set'} />
                <Field label="Gender" value={p?.gender} />
                <Field label="Category" value={p?.category} />
                <Field label="Blood group" value={p?.bloodGroup} />
                <Field label="Aadhar no." value={p?.aadharNumber ? `XXXX XXXX ${p.aadharNumber.slice(-4)}` : null} />
                <Field label="ABC ID" value={p?.abcId} />
                <Field label="Mobile" value={p?.phone} />
                <Field label="Hometown" value={p?.homeAddressCity && p?.homeAddressState ? `${p.homeAddressCity}, ${p.homeAddressState}` : p?.homeAddressCity} />
              </div>
            </Section>

            <Section title="Guardian & Emergency Contacts" icon={<Phone size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Father's name" value={p?.fatherName} />
                <Field label="Mother's name" value={p?.motherName} />
                <Field label="Father's profession" value={p?.fatherProfession} />
                <Field label="Mother's profession" value={p?.motherProfession} />
                <Field label="Local guardian" value={p?.localGuardian} />
                <Field label="Emergency contact" value={p?.emergencyContactName} />
                <Field label="Guardian phone" value={p?.guardianPhone} />
                <Field label="Emergency mobile" value={p?.emergencyContactMobile} />
              </div>
            </Section>

            <Section title="Hostel & Address" icon={<MapPin size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Hostel name" value={p?.hostelName} />
                <Field label="Room number" value={p?.hostelRoomNo} />
                <Field label="City" value={p?.homeAddressCity} />
                <Field label="State" value={p?.homeAddressState} />
              </div>
            </Section>

            <Section title="Finance & Banking" icon={<CreditCard size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Bank name" value={p?.bankName} />
                <Field label="Account number" value={p?.bankAccountNo ? `XXXX${p.bankAccountNo.slice(-4)}` : null} />
              </div>
            </Section>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
