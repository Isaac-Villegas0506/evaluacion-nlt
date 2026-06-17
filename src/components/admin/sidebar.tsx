"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { LayoutDashboard, Users, FileText, ClipboardList, LogOut, GraduationCap } from "lucide-react"
import { cn } from "@/components/ui/input"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "from-primary-500 to-violet" },
  { icon: Users, label: "Solicitantes", href: "/estudiantes", color: "from-accent-500 to-sky" },
  { icon: FileText, label: "Exámenes", href: "/examenes", color: "from-violet to-pink" },
  { icon: ClipboardList, label: "Solicitudes", href: "/asignaciones", color: "from-orange to-rose" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("Sesión cerrada")
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-full z-40 bg-white border-r border-border-default shadow-soft">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-border-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-border-default overflow-hidden p-1">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-text-primary font-bold text-base tracking-tight block leading-tight">Nivelación</span>
            <span className="text-text-tertiary text-[10px] font-semibold uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Navegación</p>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 shadow-sm"
                  : "text-text-tertiary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary-600 to-accent-500 rounded-r-full" />
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isActive
                  ? `bg-gradient-to-br ${item.color} text-white shadow-sm`
                  : "bg-bg-elevated text-text-tertiary group-hover:bg-white group-hover:text-text-primary"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-border-light">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-text-tertiary hover:bg-danger-50 hover:text-danger-600 rounded-xl transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-danger-100 flex items-center justify-center transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}
