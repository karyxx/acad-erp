'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { gqlRequest } from '@/lib/gql'

export interface StudentProfile {
  id: number
  userId: number
  rollNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string | null
  phone: string | null
  address: string | null
  departmentId: number | null
  targetCgpa: number | null
  guardianName: string | null
  guardianPhone: string | null
  bloodGroup: string | null
  familyAnnualIncome: number | null
  fatherName: string | null
  fatherProfession: string | null
  motherName: string | null
  motherProfession: string | null
  parentMobile: string | null
  parentEmail: string | null
  category: string | null
  maritalStatus: string | null
  religion: string | null
  homeAddressCity: string | null
  homeAddressDistrict: string | null
  homeAddressState: string | null
  homeAddressPincode: string | null
  residentialBackground: string | null
  hostelName: string | null
  hostelRoomNo: string | null
  aadharNumber: string | null
  abcId: string | null
  emergencyContactName: string | null
  emergencyContactMobile: string | null
  bankName: string | null
  bankAddress: string | null
  bankAccountNo: string | null
  localGuardian: string | null
  isActive: boolean
}

// The backend has no "getMyProfile" endpoint.
// We resolve profileId by probing ascending IDs until we find one
// whose userId matches the logged-in user. We cache it in sessionStorage.

const PROFILE_CACHE_KEY = 'acad_student_profile_id'

async function resolveProfileId(token: string): Promise<number | null> {
  const cached = sessionStorage.getItem(PROFILE_CACHE_KEY)
  if (cached) return parseInt(cached, 10)

  try {
    const res = await gqlRequest<{ getMyStudentProfile: { id: number } | null }>(
      'query { getMyStudentProfile { id } }',
      {},
      token
    )
    if (res.getMyStudentProfile) {
      sessionStorage.setItem(PROFILE_CACHE_KEY, String(res.getMyStudentProfile.id))
      return res.getMyStudentProfile.id
    }
  } catch {}
  return null
}

export function useStudentProfile() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const pid = await resolveProfileId(token!)
        if (!pid || cancelled) { setLoading(false); return }
        setProfileId(pid)

        const res = await gqlRequest<{ getMyStudentProfile: StudentProfile }>(
          `query {
            getMyStudentProfile {
              id userId rollNumber firstName lastName dateOfBirth gender phone
              address departmentId targetCgpa guardianName guardianPhone
              bloodGroup familyAnnualIncome fatherName fatherProfession
              motherName motherProfession parentMobile parentEmail
              category maritalStatus religion homeAddressCity homeAddressDistrict
              homeAddressState homeAddressPincode residentialBackground
              hostelName hostelRoomNo aadharNumber abcId
              emergencyContactName emergencyContactMobile
              bankName bankAddress bankAccountNo localGuardian isActive
            }
          }`,
          {},
          token!
        )
        if (!cancelled) setProfile(res.getMyStudentProfile)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [token, user])

  return { profile, profileId, loading, error }
}
