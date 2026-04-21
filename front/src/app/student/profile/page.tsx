'use client'

import { useStudentProfile } from '@/hooks/useStudentProfile'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
import { User, Phone, MapPin, CreditCard, Shield } from 'lucide-react'

function Field({ label, value, masked }: { label: string; value?: string | null; masked?: boolean }) {
  let display = value || '—'
  if (masked && value) {
    display = '•'.repeat(Math.max(0, value.length - 4)) + value.slice(-4)
  }
  return (
    <div>
      <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {display}
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
  const { profile, loading, error } = useStudentProfile()
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
            {p ? `${p.firstName[0]}${p.lastName?.[0] ?? ''}` : '?'}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {p ? `${p.firstName} ${p.lastName}` : loading ? 'Loading…' : '—'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {p?.isActive && <span className="badge badge-green">Active</span>}
              {p?.rollNumber && <span className="badge badge-purple">{p.rollNumber}</span>}
              {p?.category && <span className="badge badge-gray">{p.category}</span>}
              {p?.bloodGroup && <span className="badge badge-red">{p.bloodGroup}</span>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading profile…</div>
        ) : error ? (
          <div className="text-sm text-center py-8" style={{ color: '#B91C1C' }}>{error}</div>
        ) : !p ? (
          <div className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Profile not found.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Section title="Personal Information" icon={<User size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Date of birth" value={p.dateOfBirth} />
                <Field label="Gender" value={p.gender} />
                <Field label="Category" value={p.category} />
                <Field label="Blood group" value={p.bloodGroup} />
                <Field label="Religion" value={p.religion} />
                <Field label="Marital status" value={p.maritalStatus} />
                <Field label="Residential background" value={p.residentialBackground} />
                <Field label="Mobile" value={p.phone} />
              </div>
            </Section>

            <Section title="Identity Documents" icon={<Shield size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Aadhar number" value={p.aadharNumber} masked />
                <Field label="ABC ID" value={p.abcId} />
              </div>
            </Section>

            <Section title="Guardian & Emergency Contacts" icon={<Phone size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Father's name" value={p.fatherName} />
                <Field label="Mother's name" value={p.motherName} />
                <Field label="Father's profession" value={p.fatherProfession} />
                <Field label="Mother's profession" value={p.motherProfession} />
                <Field label="Parent mobile" value={p.parentMobile} />
                <Field label="Parent email" value={p.parentEmail} />
                <Field label="Guardian name" value={p.guardianName} />
                <Field label="Guardian phone" value={p.guardianPhone} />
                <Field label="Local guardian" value={p.localGuardian} />
                <Field label="Emergency contact" value={p.emergencyContactName} />
                <Field label="Emergency mobile" value={p.emergencyContactMobile} />
                <Field label="Family income" value={p.familyAnnualIncome !== null ? `₹${p.familyAnnualIncome.toLocaleString('en-IN')}` : null} />
              </div>
            </Section>

            <Section title="Hostel & Address" icon={<MapPin size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Hostel name" value={p.hostelName} />
                <Field label="Room number" value={p.hostelRoomNo} />
                <Field label="City" value={p.homeAddressCity} />
                <Field label="District" value={p.homeAddressDistrict} />
                <Field label="State" value={p.homeAddressState} />
                <Field label="Pincode" value={p.homeAddressPincode} />
              </div>
            </Section>

            <Section title="Finance & Banking" icon={<CreditCard size={14} />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Bank name" value={p.bankName} />
                <Field label="Bank address" value={p.bankAddress} />
                <Field label="Account number" value={p.bankAccountNo} masked />
              </div>
            </Section>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
