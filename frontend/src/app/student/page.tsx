"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { gql } from "@/lib/api";

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  rollNumber: string;
  targetCgpa: number | null;
}

interface SemesterResult {
  semesterId: number;
  sgpa: number | null;
  cgpa: number | null;
  totalCreditsEarned: number | null;
}

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuthGuard("Student");

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [latestResult, setLatestResult] = useState<SemesterResult | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [requiredSgpa, setRequiredSgpa] = useState<number | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        // Fetch student profile
        const profileData = await gql<{ getMyStudentProfile: StudentProfile }>(`
          query {
            getMyStudentProfile {
              id
              firstName
              lastName
              rollNumber
              targetCgpa
            }
          }
        `);
        const p = profileData.getMyStudentProfile;
        setProfile(p);
        if (p?.targetCgpa) {
          setTargetInput(String(p.targetCgpa));
        }

        // Fetch latest semester result — try the most recent semesters
        // We'll get all results by querying semester 1-8 and find the latest non-null
        if (p?.id) {
          // Try fetching last few semester results by checking multiple semesters
          // Since we can't list all at once, fetch the most recent known ones
          for (let semId = 8; semId >= 1; semId--) {
            try {
              const resultData = await gql<{ getStudentSemesterResult: SemesterResult | null }>(`
                query {
                  getStudentSemesterResult(studentId: ${p.id}, semesterId: ${semId}) {
                    semesterId
                    sgpa
                    cgpa
                    totalCreditsEarned
                  }
                }
              `);
              if (resultData.getStudentSemesterResult?.cgpa !== null && resultData.getStudentSemesterResult !== null) {
                setLatestResult(resultData.getStudentSemesterResult);
                break;
              }
            } catch {
              // skip
            }
          }
        }
      } catch (e) {
        console.error("Failed to load student data", e);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function handleGoalUpdate() {
    const parsed = parseFloat(targetInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      setGoalError("Please enter a valid CGPA between 0 and 10.");
      return;
    }
    setGoalError("");
    setGoalSaving(true);

    try {
      // 1. Save target CGPA to profile
      await gql(`
        mutation {
          updateTargetCgpa(targetCgpa: ${parsed}) {
            id
            targetCgpa
          }
        }
      `);

      // 2. Compute required SGPA if we have profile ID and semester data
      if (profile?.id && latestResult?.totalCreditsEarned) {
        const nextSemCredits = 20; // default — typical semester credits
        const calcData = await gql<{ calculateTargetSgpa: number | null }>(`
          query {
            calculateTargetSgpa(
              studentId: ${profile.id},
              targetCgpa: ${parsed},
              nextSemesterCredits: ${nextSemCredits}
            )
          }
        `);
        setRequiredSgpa(calcData.calculateTargetSgpa);
      } else {
        // No history — required SGPA equals target CGPA
        setRequiredSgpa(parsed);
      }

      setProfile((prev) => prev ? { ...prev, targetCgpa: parsed } : prev);
    } catch (e: any) {
      setGoalError(e.message ?? "Failed to save goal.");
    } finally {
      setGoalSaving(false);
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "var(--on-surface-variant)" }}>Loading…</p>
      </div>
    );
  }

  const firstName = profile?.firstName ?? user?.email?.split("@")[0] ?? "Student";
  const currentCgpa = latestResult?.cgpa ?? null;
  const lastSgpa = latestResult?.sgpa ?? null;
  const targetCgpa = profile?.targetCgpa ?? null;

  // Colour for required SGPA
  function sgpaColour(val: number | null) {
    if (val === null) return "var(--on-surface-variant)";
    if (val > 10) return "var(--danger)";
    if (val > 9) return "var(--warning)";
    return "var(--success)";
  }

  return (
    <DashboardLayout role="student" userName={profile ? `${profile.firstName} ${profile.lastName}` : undefined}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem" }}>Welcome back, {firstName}.</h1>
        <p className="text-muted">
          {profile?.rollNumber ? `${profile.rollNumber} • ` : ""}
          Student Portal
        </p>
      </div>

      {/* Academic Performance + Goal Tracking */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* Current Academic Performance */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", color: "var(--on-surface-variant)", marginBottom: "1rem" }}>
            Academic Performance
          </h3>
          {currentCgpa !== null ? (
            <div className="flex-between">
              <div>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--primary)", lineHeight: 1 }}>
                  {currentCgpa.toFixed(2)}
                </div>
                <div className="text-muted" style={{ fontWeight: 500, marginTop: "0.25rem" }}>CGPA / 10.00</div>
              </div>
              {lastSgpa !== null && (
                <div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--on-surface)", lineHeight: 1 }}>
                    {lastSgpa.toFixed(2)}
                  </div>
                  <div className="text-muted" style={{ fontWeight: 500, marginTop: "0.25rem" }}>Last SGPA / 10.00</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>
              No semester results published yet.
            </p>
          )}
        </div>

        {/* Goal Tracking */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", color: "var(--on-surface-variant)", marginBottom: "1rem" }}>
            Goal Tracking System
          </h3>

          {/* Target input row */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", display: "block", marginBottom: "0.35rem" }}>
                Target CGPA (out of 10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                className="input-field"
                placeholder={targetCgpa ? String(targetCgpa) : "e.g. 9.00"}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleGoalUpdate}
              disabled={goalSaving}
              style={{ marginTop: "1.4rem", padding: "0.625rem 1rem", opacity: goalSaving ? 0.7 : 1 }}
            >
              {goalSaving ? "Saving…" : "Set Goal"}
            </button>
          </div>

          {goalError && (
            <p style={{ color: "var(--danger)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>{goalError}</p>
          )}

          {/* Required SGPA result */}
          {(requiredSgpa !== null || targetCgpa !== null) && (
            <div style={{
              padding: "1rem",
              backgroundColor: "var(--surface-container-low)",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginBottom: "0.25rem" }}>
                  Target CGPA
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  {targetCgpa?.toFixed(2) ?? parseFloat(targetInput).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginBottom: "0.25rem" }}>
                  Required SGPA Next Sem
                </div>
                <div style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: sgpaColour(requiredSgpa),
                }}>
                  {requiredSgpa !== null
                    ? requiredSgpa > 10
                      ? "Not Achievable"
                      : `${requiredSgpa.toFixed(2)}+`
                    : "—"}
                </div>
              </div>
            </div>
          )}

          {!targetCgpa && requiredSgpa === null && (
            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Set a target CGPA to see the required SGPA calculation.
            </p>
          )}
        </div>
      </div>

      {/* Timetable + Feedback row */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: "1rem", color: "var(--on-surface-variant)", marginBottom: "1rem" }}>
            Personal Timetable
          </h3>
          <div style={{ padding: "1.5rem", backgroundColor: "var(--surface-container-low)", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Timetable not yet connected</p>
            <p className="text-muted" style={{ fontSize: "0.75rem" }}>
              Course scheduling data will appear here once your semester enrollment is confirmed.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1rem", color: "var(--on-surface-variant)", marginBottom: "1rem" }}>
            Pending Course Feedback
          </h3>
          <div style={{ padding: "1.5rem", backgroundColor: "var(--surface-container-highest)", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>No pending evaluations</p>
            <p className="text-muted" style={{ fontSize: "0.75rem" }}>
              You have completed all mandatory feedback forms for the current session.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
