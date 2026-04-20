"use client";
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { gql } from '@/lib/api';

interface FacultyProfile {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
}

export default function FacultyDashboard() {
  const { user, loading: authLoading } = useAuthGuard("Faculty");
  const [profile, setProfile] = useState<FacultyProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    gql<{ getMyFacultyProfile: FacultyProfile }>(`
      query {
        getMyFacultyProfile {
          id
          firstName
          lastName
          title
        }
      }
    `).then(({ getMyFacultyProfile }) => {
      setProfile(getMyFacultyProfile);
    }).catch(() => {});
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "var(--on-surface-variant)" }}>Loading…</p>
      </div>
    );
  }

  const fullName = profile ? `${profile.title ? profile.title + ' ' : ''}${profile.firstName} ${profile.lastName}` : undefined;

  return (
    <DashboardLayout role="faculty" userName={fullName}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Faculty Workspace</h1>
        <p className="text-muted">{fullName ?? 'Faculty'} • Department of Computer Science</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Low Attendance Alerts</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Students in your courses who have slipped below the 75% threshold will appear here.
          </p>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: 'var(--surface-container)', color: 'var(--danger)' }}>View Flagged Students</button>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Pending Evaluations</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Any pending mark-entry deadlines for your courses will appear here.
          </p>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Enter Marks Now</button>
        </div>
      </div>

      <div className="grid-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>Assigned Courses</h3>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-container-low)', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Course list not yet connected</p>
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>
              Your assigned course offerings for this semester will appear here.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>Today's Lectures</h3>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-container-low)', borderRadius: '8px', textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>
              Timetable not yet connected.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
