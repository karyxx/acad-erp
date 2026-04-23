import Sidebar from '@/components/layout/Sidebar'

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
