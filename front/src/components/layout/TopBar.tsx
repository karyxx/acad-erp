'use client'

interface TopBarProps {
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}

export default function TopBar({ title, breadcrumbs, actions }: TopBarProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <header
      className="h-12 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
        {breadcrumbs ? (
          breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : undefined, fontWeight: i === breadcrumbs.length - 1 ? 500 : undefined }}>
                {b.label}
              </span>
            </span>
          ))
        ) : (
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
      </div>
    </header>
  )
}
