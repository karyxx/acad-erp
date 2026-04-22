'use client'
import AuthGuard from '@/components/layout/AuthGuard'
import TopBar from '@/components/layout/TopBar'
export default function Page() {
  return (
    <AuthGuard>
      <TopBar breadcrumbs={[{ label: "AcadERP" }, { label: "Coming Soon" }]} />
      <div className="p-6">
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>This page is under construction.</p>
        </div>
      </div>
    </AuthGuard>
  )
}
