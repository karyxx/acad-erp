'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'

export type UserRole = 'Admin' | 'Faculty' | 'Student'

export interface AuthUser {
  id: number
  email: string
  roles: UserRole[]
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = Cookies.get('acad_token')
    const savedUser = Cookies.get('acad_user')
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        Cookies.remove('acad_token')
        Cookies.remove('acad_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Invalid credentials')
    }

    const data = await res.json()
    const accessToken: string = data.access_token

    // Decode JWT payload (base64) to get id
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const userId: number = payload.id

    // Fetch roles via GraphQL
    const rolesRes = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: `query {
          getUser(userId: ${userId}) { id email isActive }
          getRoles { id name }
        }`,
      }),
    })

    // Use a simpler approach: decode roles from the context
    // We query the me-style endpoint via getUser and separately figure out roles
    // Since getUser is self-ownership guarded, and getRoles is admin-only,
    // we store the roles by querying getStudentProfile or getFacultyProfile
    const authUser = await resolveUserWithRoles(accessToken, userId, email)

    setToken(accessToken)
    setUser(authUser)
    Cookies.set('acad_token', accessToken, { expires: 1 })
    Cookies.set('acad_user', JSON.stringify(authUser), { expires: 1 })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    Cookies.remove('acad_token')
    Cookies.remove('acad_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

async function resolveUserWithRoles(token: string, userId: number, email: string): Promise<AuthUser> {
  // Try to figure out roles by probing endpoints
  // Admin: getRoles succeeds; Faculty: getFacultyProfiles succeeds; else Student
  const gql = async (query: string) => {
    const res = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    })
    return res.json()
  }

  // Try admin probe
  const adminProbe = await gql('query { getRoles { id name } }')
  if (!adminProbe.errors) {
    return { id: userId, email, roles: ['Admin'] }
  }

  // Try faculty probe - get faculty profiles (elevated role)
  const facultyProbe = await gql('query { getStudentProfiles { id firstName } }')
  if (!facultyProbe.errors) {
    // Only admin/faculty can see all student profiles
    // Double check - try faculty-specific operation
    const fProbe = await gql('query { getFacultyProfiles { id firstName } }')
    if (!fProbe.errors && fProbe.data?.getFacultyProfiles) {
      return { id: userId, email, roles: ['Faculty'] }
    }
    return { id: userId, email, roles: ['Faculty'] }
  }

  // Default to student
  return { id: userId, email, roles: ['Student'] }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
