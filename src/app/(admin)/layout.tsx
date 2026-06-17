import { Sidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-base flex">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <AdminHeader />
        <main
          className="flex-1 px-6 md:px-8 pb-16 overflow-y-auto bg-mesh-gradient"
          style={{ paddingTop: "6rem" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
