import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatsCard } from "@/components/admin/stats-card"
import { ArrowRight, TrendingUp, ClipboardList } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalAsignados },
    { count: aprobados },
    { count: pendientes },
    { count: desaprobados },
    { data: ultimasAsignaciones }
  ] = await Promise.all([
    supabase.from("asignaciones").select("*", { count: "exact", head: true }),
    supabase.from("asignaciones").select("*", { count: "exact", head: true }).eq("estado", "aprobado"),
    supabase
      .from("asignaciones")
      .select("*", { count: "exact", head: true })
      .in("estado", ["pendiente", "en_progreso", "pendiente_revision"]),
    supabase.from("asignaciones").select("*", { count: "exact", head: true }).eq("estado", "desaprobado"),
    supabase
      .from("asignaciones")
      .select(`id, estado, fecha_asignacion, estudiantes (nombres, dni), examenes (nombre)`)
      .order("fecha_asignacion", { ascending: false })
      .limit(5)
  ])

  const estadoBadge = (estado: string) => {
    const map: Record<string, { bg: string, text: string, dot: string }> = {
      aprobado: { bg: "bg-success-50", text: "text-success-700", dot: "bg-success-500" },
      desaprobado: { bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500" },
      pendiente_revision: { bg: "bg-warning-50", text: "text-warning-600", dot: "bg-warning-500" },
      en_progreso: { bg: "bg-info-50", text: "text-info-600", dot: "bg-info-500" },
      pendiente: { bg: "bg-bg-elevated", text: "text-text-tertiary", dot: "bg-text-muted" },
    }
    return map[estado] ?? { bg: "bg-bg-elevated", text: "text-text-tertiary", dot: "bg-text-muted" }
  }

  const estadoLabel = (estado: string) =>
    estado.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-6 md:p-8 text-white shadow-elevated">

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold mb-3">
              <TrendingUp className="w-3 h-3" />
              Panel de Control
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">¡Bienvenido de nuevo!</h2>
            <p className="text-white/80 mt-1 text-sm md:text-base">Aquí tienes el resumen de actividad del sistema de nivelación.</p>
          </div>
          <Link
            href="/asignaciones"
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-white/95 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Nueva Solicitud
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Asignados"
          value={totalAsignados ?? 0}
          iconName="ClipboardList"
          colorClass="from-primary-500 to-violet"
        />
        <StatsCard
          title="Exámenes Aprobados"
          value={aprobados ?? 0}
          iconName="CheckCircle2"
          colorClass="from-success-500 to-emerald"
        />
        <StatsCard
          title="En Progreso / Pendientes"
          value={pendientes ?? 0}
          iconName="Clock"
          colorClass="from-warning-500 to-orange"
        />
        <StatsCard
          title="Exámenes Desaprobados"
          value={desaprobados ?? 0}
          iconName="XCircle"
          colorClass="from-danger-500 to-rose"
        />
      </div>

      {/* Recent Assignments Table */}
      <div className="bg-white rounded-2xl border border-border-default shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border-light flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Últimas Solicitudes</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Las 5 solicitudes más recientes</p>
          </div>
          <Link
            href="/asignaciones"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Ver todas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-text-tertiary uppercase tracking-wider bg-bg-elevated border-b border-border-light">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Solicitante</th>
                <th className="px-6 py-3.5 font-semibold">DNI</th>
                <th className="px-6 py-3.5 font-semibold">Examen</th>
                <th className="px-6 py-3.5 font-semibold">Estado</th>
                <th className="px-6 py-3.5 font-semibold text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {ultimasAsignaciones?.map((asignacion: any) => {
                const badge = estadoBadge(asignacion.estado)
                return (
                  <tr key={asignacion.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {asignacion.estudiantes?.nombres}
                    </td>
                    <td className="px-6 py-4 text-text-tertiary font-mono text-xs">
                      {asignacion.estudiantes?.dni}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {asignacion.examenes?.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {estadoLabel(asignacion.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-text-tertiary text-xs">
                      {new Date(asignacion.fecha_asignacion).toLocaleDateString("es-PE", {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                )
              })}
              {(!ultimasAsignaciones || ultimasAsignaciones.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="w-6 h-6 text-text-muted" />
                    </div>
                    <p className="text-sm font-semibold text-text-primary">No hay solicitudes recientes</p>
                    <p className="text-xs text-text-tertiary mt-1">Crea una nueva solicitud para empezar</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
