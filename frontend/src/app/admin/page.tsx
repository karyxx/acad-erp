"use client";
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminDashboard() {
  const { user, loading } = useAuthGuard("Admin");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "var(--on-surface-variant)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.email?.split("@")[0]}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Administration Console</h1>
        <p className="text-muted">System Overview &amp; Management</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Identity Management</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
            <li className="flex-between"><span>Faculty Roles</span> <span className="text-muted">—</span></li>
            <li className="flex-between"><span>Student Profiles</span> <span className="text-muted">—</span></li>
            <li className="flex-between"><span>Admin Staff</span> <span className="text-muted">—</span></li>
          </ul>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Enrollment Control</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between">
              <span style={{ fontWeight: 500 }}>Spring 2026 Registration</span>
              <span className="chip" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>LOCKED</span>
            </div>
            <button className="btn-primary" style={{ padding: '0.5rem' }}>Open Registration Window</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Fee Administration</h3>
          <div className="flex-between" style={{ alignItems: 'flex-end', height: '100%' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>—</div>
              <div className="text-muted" style={{ fontWeight: 500, marginTop: '0.25rem' }}>Cleared Fee Status</div>
            </div>
            <button className="btn-primary" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--primary)', padding: '0.5rem 1rem' }}>View Defaults</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>Pending Grade Approvals</h3>
          <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>All pending final grades have been approved and published.</div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>Active Semesters &amp; Curriculum</h3>
          <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Showing active offerings across all programs.</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
