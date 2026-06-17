"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle, Save, Award } from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RevisarAsignacionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const asignacionId = resolvedParams.id
  const router = useRouter()
  
  const [asignacion, setAsignacion] = useState<any>(null)
  const [intento, setIntento] = useState<any>(null)
  const [respuestas, setRespuestas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Local state for grading
  const [calificaciones, setCalificaciones] = useState<Record<string, { puntaje: string, observacion: string }>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchReviewData()
  }, [asignacionId])

  const fetchReviewData = async () => {
    setLoading(true)
    
    // 1. Fetch Asignación details
    const { data: asigData, error: asigError } = await supabase
      .from("asignaciones")
      .select("*, estudiantes(nombres, dni), examenes(nombre, nota_minima)")
      .eq("id", asignacionId)
      .single()
      
    if (asigError || !asigData) {
      toast.error("Error al cargar la asignación")
      return
    }
    setAsignacion(asigData)

    // 2. Fetch Intento
    const { data: intentoData } = await supabase
      .from("intentos")
      .select("*")
      .eq("asignacion_id", asignacionId)
      .order("fecha_inicio", { ascending: false })
      .limit(1)
      .single() as { data: any, error: any }

    if (!intentoData) {
      toast.error("El estudiante aún no ha completado el examen")
      setLoading(false)
      return
    }
    setIntento(intentoData)

    // 3. Fetch Respuestas con Preguntas
    const { data: respData } = await supabase
      .from("respuestas")
      .select("*, preguntas(*, opciones(*))")
      .eq("intento_id", intentoData.id)
      .order("preguntas(orden)", { ascending: true })

    if (respData) {
      setRespuestas(respData)
      
      // Initialize grading state
      const initialCalificaciones: Record<string, any> = {}
      respData.forEach((r: any) => {
        initialCalificaciones[r.id] = {
          puntaje: r.puntaje_obtenido?.toString() || "0",
          observacion: r.observacion || ""
        }
      })
      setCalificaciones(initialCalificaciones)
    }

    setLoading(false)
  }

  const handleCalificacionChange = (respuestaId: string, field: 'puntaje' | 'observacion', value: string) => {
    setCalificaciones(prev => ({
      ...prev,
      [respuestaId]: {
        ...prev[respuestaId],
        [field]: value
      }
    }))
  }

  const currentTotal = respuestas.reduce((sum, r) => {
    return sum + (parseFloat(calificaciones[r.id]?.puntaje) || 0)
  }, 0)

  const handleSaveGrades = async () => {
    setSaving(true)
    
    // Update all responses
    const updatePromises = Object.entries(calificaciones).map(([respId, data]) => {
      return (supabase.from("respuestas").update as any)({
        puntaje_obtenido: parseFloat(data.puntaje) || 0,
        observacion: data.observacion
      }).eq("id", respId)
    })

    await Promise.all(updatePromises)
    
    // Update Intento total score
    await (supabase.from("intentos").update as any)({ nota_final: currentTotal }).eq("id", intento.id)
    
    toast.success("Calificaciones guardadas correctamente")
    setSaving(false)
  }

  const handleFinalizeStatus = async (status: 'aprobado' | 'desaprobado') => {
    if (!confirm(`¿Estás seguro de marcar el examen como ${status.toUpperCase()}?`)) return
    
    setSaving(true)
    await handleSaveGrades() // Save grades first
    
    if (status === 'aprobado') {
      const { nanoid } = await import('nanoid')
      const codigo = nanoid(10).toUpperCase()
      
      // Check if already exists to avoid duplicates
      const { data: existingCert } = await supabase.from("certificados").select("id").eq("intento_id", intento.id).single()
      
      if (!existingCert) {
        await (supabase.from("certificados").insert as any)({
          estudiante_id: asignacion.estudiante_id,
          examen_id: asignacion.examen_id,
          intento_id: intento.id,
          codigo_verificacion: codigo
        })
      }
    }

    const { error } = await (supabase.from("asignaciones").update as any)({ estado: status }).eq("id", asignacionId)
    
    if (error) {
      toast.error("Error al actualizar estado")
    } else {
      toast.success(`Examen ${status.toUpperCase()}`)
      // Redirect back to assignments
      router.push("/asignaciones")
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center p-12 text-text-muted animate-pulse">Cargando revisión...</div>

  const isAprobadoSuggested = currentTotal >= (asignacion?.examenes?.nota_minima || 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/asignaciones" className="p-2 rounded-md hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Revisión Manual</h1>
          <p className="text-text-muted text-sm mt-1">Califica las respuestas de desarrollo del estudiante.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content: Answers List */}
        <div className="lg:col-span-3 space-y-6">
          {respuestas.map((resp, index) => {
            const p = resp.preguntas
            const isManual = p.tipo === 'corta' || p.tipo === 'desarrollo'
            
            return (
              <div key={resp.id} className="glass rounded-xl border border-border-subtle p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-sm font-medium text-text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded bg-bg-elevated text-text-muted uppercase tracking-wider font-medium">
                        {p.tipo.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-text-muted block">Puntaje Máximo: {p.puntaje} pts</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-text-primary mb-4">{p.pregunta}</h3>
                
                <div className="bg-bg-base border border-border-subtle rounded-lg p-4 mb-6">
                  <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Respuesta del Estudiante</span>
                  <p className="text-text-primary whitespace-pre-wrap">{resp.respuesta || <span className="italic opacity-50">Sin responder</span>}</p>
                </div>

                {isManual ? (
                  <div className="border-t border-border-subtle pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-text-primary mb-1 text-primary">Puntaje Otorgado</label>
                      <input 
                        type="number" 
                        min="0" 
                        max={p.puntaje} 
                        step="0.5"
                        value={calificaciones[resp.id]?.puntaje || ""}
                        onChange={(e) => handleCalificacionChange(resp.id, 'puntaje', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-1">Observaciones (Opcional)</label>
                      <textarea 
                        value={calificaciones[resp.id]?.observacion || ""}
                        onChange={(e) => handleCalificacionChange(resp.id, 'observacion', e.target.value)}
                        placeholder="Escribe un comentario sobre esta respuesta..."
                        className="flex w-full rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border-subtle pt-4 mt-4 flex items-center justify-between">
                    <div className="text-sm text-text-muted">
                      Calificación automática.
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">Puntaje:</span>
                      <span className={`font-bold ${parseFloat(calificaciones[resp.id]?.puntaje) > 0 ? 'text-accent' : 'text-danger'}`}>
                        {calificaciones[resp.id]?.puntaje} / {p.puntaje}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right Panel: Sticky Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 glass rounded-xl border border-border-subtle p-6 space-y-6">
            
            <div>
              <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">Estudiante</h2>
              <p className="font-semibold text-text-primary">{asignacion?.estudiantes?.nombres}</p>
              <p className="text-sm text-text-muted">DNI: {asignacion?.estudiantes?.dni}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">Examen</h2>
              <p className="font-semibold text-text-primary">{asignacion?.examenes?.nombre}</p>
              <p className="text-sm text-text-muted">Nota Mínima: {asignacion?.examenes?.nota_minima} pts</p>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-primary font-medium">Puntaje Actual:</span>
                <span className={`text-2xl font-bold ${isAprobadoSuggested ? 'text-accent' : 'text-danger'}`}>
                  {currentTotal}
                </span>
              </div>
              <p className="text-xs text-text-muted text-right">
                {isAprobadoSuggested ? 'Alcanza puntaje aprobatorio' : 'No alcanza puntaje aprobatorio'}
              </p>
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-3">
              <Button onClick={handleSaveGrades} variant="outline" className="w-full gap-2" isLoading={saving}>
                <Save className="w-4 h-4" /> Guardar Avance
              </Button>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  onClick={() => handleFinalizeStatus('aprobado')} 
                  variant="default" 
                  className="bg-accent hover:bg-emerald-600 text-white shadow-lg shadow-accent/20"
                  isLoading={saving}
                >
                  Aprobar
                </Button>
                <Button 
                  onClick={() => handleFinalizeStatus('desaprobado')} 
                  variant="danger"
                  isLoading={saving}
                >
                  Desaprobar
                </Button>
              </div>
              <p className="text-xs text-text-muted text-center leading-relaxed mt-2">
                Al Aprobar o Desaprobar, el examen se cerrará y el estudiante podrá ver su resultado.
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}
