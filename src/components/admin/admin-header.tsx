"use client"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { LogOut, Menu } from "lucide-react"

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/estudiantes": "Solicitantes",
  "/examenes": "Exámenes",
  "/asignaciones": "Solicitudes",
  "/certificados": "Certificados",
}

const routeSubtitles: Record<string, string> = {
  "/dashboard": "Resumen general de actividad",
  "/estudiantes": "Gestión de personas registradas",
  "/examenes": "Configuración de evaluaciones",
  "/asignaciones": "Solicitudes y enlaces generados",
  "/certificados": "Documentos emitidos",
}

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const currentLabel =
    Object.entries(routeLabels).find(([key]) => pathname.startsWith(key))?.[1] ?? "Panel"

  const currentSubtitle =
    Object.entries(routeSubtitles).find(([key]) => pathname.startsWith(key))?.[1] ?? ""

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("Sesión cerrada")
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="fixed top-0 w-full md:w-[calc(100%-16rem)] z-30 flex justify-between items-center px-6 md:px-8 h-20 bg-white/80 backdrop-blur-xl border-b border-border-light">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-text-tertiary hover:text-text-primary p-2 rounded-lg hover:bg-bg-elevated transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight leading-tight">{currentLabel}</h1>
          {currentSubtitle && (
            <p className="text-xs text-text-tertiary hidden sm:block mt-0.5">{currentSubtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-danger-600 hover:text-white bg-danger-50 hover:bg-danger-500 border border-danger-100 hover:border-danger-500 rounded-xl transition-all"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  )
}
