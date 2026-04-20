"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
}

const navItems: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Identity Management', href: '/admin' },
    { label: 'Academic Lifecycle', href: '/admin' },
    { label: 'Enrollment Control', href: '/admin' },
    { label: 'Fee Administration', href: '/admin' },
  ],
  student: [
    { label: 'Dashboard', href: '/student' },
    { label: 'My Timetable', href: '/student' },
    { label: 'Historical Results', href: '/student' },
    { label: 'Course Registration', href: '/student' },
  ],
  faculty: [
    { label: 'Dashboard', href: '/faculty' },
    { label: 'My Courses', href: '/faculty' },
    { label: 'Attendance', href: '/faculty' },
    { label: 'Enter Marks', href: '/faculty' },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  userName?: string;
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const router = useRouter();
  const items = navItems[role] ?? [];

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : role === 'admin' ? 'AD' : role === 'faculty' ? 'FA' : 'ST';

  const displayName = userName ?? (role === 'admin' ? 'Admin Console' : role === 'faculty' ? 'Faculty' : 'Student');

  function handleLogout() {
    clearToken();
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--surface-container-high)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.75rem 1rem',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 0.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Acad-ERP</div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
            {role} portal
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((item, i) => {
            const isFirst = i === 0;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isFirst ? 600 : 400,
                  color: isFirst ? 'var(--primary)' : 'var(--on-surface-variant)',
                  backgroundColor: isFirst ? 'var(--surface-container)' : 'transparent',
                  transition: 'background-color 0.15s',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--surface-container-high)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--danger)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Logout
          </button>
        </div>
      </aside>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top nav */}
        <header style={{
          height: '64px',
          flexShrink: 0,
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--surface-container-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 2rem',
          gap: '1rem',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
            {displayName}
          </span>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'var(--on-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            {initials}
          </div>
        </header>

        {/* Scrollable main */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
