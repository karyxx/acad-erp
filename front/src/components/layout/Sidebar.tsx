'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, UserRole } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  DollarSign,
  Shield,
  Building2,
  LogOut,
  BarChart3,
  Clock,
  Award,
} from 'lucide-react'
import clsx from 'clsx'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavSection {
  label: string
  items: NavItem[]
}

function getNavSections(role: UserRole, basePath: string): NavSection[] {
  if (role === 'Student') {
    return [
      {
        label: 'My Academics',
        items: [
          { href: `${basePath}`, label: 'Overview', icon: <LayoutDashboard size={15} /> },
          { href: `${basePath}/profile`, label: 'My Profile', icon: <GraduationCap size={15} /> },
          { href: `${basePath}/courses`, label: 'My Courses', icon: <BookOpen size={15} /> },
          { href: `${basePath}/timetable`, label: 'Timetable', icon: <Calendar size={15} /> },
          { href: `${basePath}/grades`, label: 'Grades & GPA', icon: <Award size={15} /> },
          { href: `${basePath}/attendance`, label: 'Attendance', icon: <ClipboardList size={15} /> },
          { href: `${basePath}/exams`, label: 'Examinations', icon: <FileText size={15} /> },
        ],
      },
      {
        label: 'Account',
        items: [
          { href: `${basePath}/fees`, label: 'Fee Status', icon: <DollarSign size={15} /> },
          { href: `${basePath}/registration`, label: 'Registration', icon: <ClipboardList size={15} /> },
        ],
      },
    ]
  }

  if (role === 'Faculty') {
    return [
      {
        label: 'Academics',
        items: [
          { href: `${basePath}`, label: 'Overview', icon: <LayoutDashboard size={15} /> },
          { href: `${basePath}/courses`, label: 'My Courses', icon: <BookOpen size={15} /> },
          { href: `${basePath}/timetable`, label: 'Timetable', icon: <Calendar size={15} /> },
          { href: `${basePath}/students`, label: 'Students', icon: <Users size={15} /> },
        ],
      },
      {
        label: 'Operations',
        items: [
          { href: `${basePath}/attendance`, label: 'Attendance', icon: <ClipboardList size={15} /> },
          { href: `${basePath}/assessments`, label: 'Assessments', icon: <BarChart3 size={15} /> },
          { href: `${basePath}/exams`, label: 'Examinations', icon: <FileText size={15} /> },
        ],
      },
    ]
  }

  // Admin
  return [
    {
      label: 'Academics',
      items: [
        { href: `${basePath}`, label: 'Overview', icon: <LayoutDashboard size={15} /> },
        { href: `${basePath}/courses`, label: 'Courses', icon: <BookOpen size={15} /> },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: `${basePath}/registrations`, label: 'Registrations', icon: <ClipboardList size={15} /> },
        { href: `${basePath}/assessments`, label: 'Assessments', icon: <BarChart3 size={15} /> },
        { href: `${basePath}/examinations`, label: 'Examinations', icon: <FileText size={15} /> },
        { href: `${basePath}/feedback`, label: 'Feedback', icon: <ClipboardList size={15} /> },
      ],
    },
    {
      label: 'Admin',
      items: [
        { href: `${basePath}/finance`, label: 'Finance', icon: <DollarSign size={15} /> },
      ],
    },
  ]
}

function getRoleBasePath(role: UserRole): string {
  if (role === 'Admin') return '/admin'
  if (role === 'Faculty') return '/faculty'
  return '/student'
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const role = user.roles[0]
  const basePath = getRoleBasePath(role)
  const sections = getNavSections(role, basePath)

  const initials = user.email.substring(0, 2).toUpperCase()

  const isActive = (href: string) => {
    if (href === basePath) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          A
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AcadERP
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            ABV-IIITM
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx('nav-item', isActive(item.href) && 'active')}
              >
                <span className="opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / user */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user.email.split('@')[0]}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {role}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogOut size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
    </aside>
  )
}
