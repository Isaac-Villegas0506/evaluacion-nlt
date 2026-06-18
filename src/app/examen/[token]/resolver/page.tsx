"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Clock, ChevronLeft, ChevronRight, Save, CheckCircle2, AlertCircle, ArrowRight, X, LayoutGrid, ZoomIn, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"
import { differenceInSeconds } from "date-fns"

export default function ExamenResolverPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const token = resolvedParams.token
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [asignacion, setAsignacion] = useState<any>(null)
  const [intento, setIntento] = useState<any>(null)
  const [preguntas, setPreguntas] = useState<any[]>([])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [timeLeftStr, setTimeLeftStr] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showNavPanel, setShowNavPanel] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  useEffect(() => {
    fetchExamData()
  }, [token])

  const fetchExamData = async () => {
    setLoading(true)
    const { data: asigData, error: asigError } = await supabase
      .from("asignaciones")
      .select("*, examenes(*)")
      .eq("token_unico", token)
      .single()

    if (asigError || !asigData) {
      toast.error("Enlace inválido")
      router.replace(`/examen/${token}`)
      return
    }

    if (asigData.estado !== 'en_progreso') {
      router.replace(`/examen/${token}`)
      return
    }
    setAsignacion(asigData)

    const { data: intData } = await supabase
      .from("intentos")
      .select("*")
      .eq("asignacion_id", asigData.id)
      .order("fecha_inicio", { ascending: false })
      .limit(1)
      .single()

    if (!intData) {
      toast.error("No hay intento activo")
      router.replace(`/examen/${token}`)
      return
    }
    setIntento(intData)

    const { data: pregData } = await supabase
      .from("preguntas")
      .select("*, opciones(*)")
      .eq("examen_id", asigData.examen_id)
      .order("orden", { ascending: true })

    if (pregData) {
      setPreguntas(pregData)
    }

    const { data: respData } = await supabase
      .from("respuestas")
      .select("*")
      .eq("intento_id", intData.id)

    if (respData) {
      const prevResp: Record<string, string> = {}
      respData.forEach(r => {
        if (r.respuesta) prevResp[r.pregunta_id] = r.respuesta
      })
      setRespuestas(prevResp)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!intento || !asignacion) return

    const duracionSegundos = asignacion.examenes.duracion_minutos * 60
    const fechaInicio = new Date(intento.fecha_inicio)

    const interval = setInterval(() => {
      const segTranscurridos = differenceInSeconds(new Date(), fechaInicio)
      const segRestantes = duracionSegundos - segTranscurridos

      if (segRestantes <= 0) {
        clearInterval(interval)
        setTimeLeftStr("00:00")
        setIsUrgent(true)
        toast.error("¡Tiempo agotado!")
        handleFinalize(true)
      } else {
        setIsUrgent(segRestantes <= 120)
        const min = Math.floor(segRestantes / 60)
        const sec = segRestantes % 60
        setTimeLeftStr(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [intento, asignacion])

  const handleAnswerChange = (preguntaId: string, answer: string) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: answer }))

    setSavingState('saving')
    const timeoutId = setTimeout(async () => {
      const { data: existingResp } = await supabase
        .from("respuestas")
        .select("id")
        .eq("intento_id", intento.id)
        .eq("pregunta_id", preguntaId)
        .single()

      if (existingResp) {
        await supabase.from("respuestas").update({ respuesta: answer }).eq("id", existingResp.id)
      } else {
        await supabase.from("respuestas").insert({
          intento_id: intento.id,
          pregunta_id: preguntaId,
          respuesta: answer
        })
      }
      setSavingState('saved')
      setTimeout(() => {
        setSavingState(s => s === 'saved' ? 'idle' : s)
      }, 2000)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }

  const changeQuestion = (newIdx: number) => {
    setIsAnimating(true)
    setShowNavPanel(false)
    setTimeout(() => {
      setCurrentIdx(newIdx)
      setIsAnimating(false)
    }, 200)
  }

  const calculateAutoGrades = async () => {
    const { data: currentResps } = await supabase.from("respuestas").select("*").eq("intento_id", intento.id)
    if (!currentResps) return { hasManual: false, totalScore: 0 }

    let totalAutoScore = 0
    let hasManual = false

    for (const preg of preguntas) {
      if (preg.tipo === 'multiple' || preg.tipo === 'verdadero_falso') {
        const resp = currentResps.find(r => r.pregunta_id === preg.id)
        const correctOpt = preg.opciones.find((o: any) => o.es_correcta)

        if (resp && correctOpt && resp.respuesta === correctOpt.texto) {
          totalAutoScore += Number(preg.puntaje)
          await supabase.from("respuestas").update({ puntaje_obtenido: preg.puntaje }).eq("id", resp.id)
        }
      } else {
        hasManual = true
      }
    }

    return { hasManual, totalScore: totalAutoScore }
  }

  const executeFinalize = async (autoFinalize = false) => {
    setIsFinishing(true)
    setIsConfirmModalOpen(false)

    const { hasManual, totalScore } = await calculateAutoGrades()
    let newState = 'pendiente_revision'

    if (!hasManual) {
      if (totalScore >= asignacion.examenes.nota_minima) {
        newState = 'aprobado'
        const { nanoid } = await import('nanoid')
        const codigo = nanoid(10).toUpperCase()

        await supabase.from("certificados").insert({
          estudiante_id: asignacion.estudiante_id,
          examen_id: asignacion.examen_id,
          intento_id: intento.id,
          codigo_verificacion: codigo
        })
      } else {
        newState = 'desaprobado'
      }
      await supabase.from("intentos").update({ nota_final: totalScore, fecha_fin: new Date().toISOString() }).eq("id", intento.id)
    } else {
      await supabase.from("intentos").update({ nota_final: totalScore, fecha_fin: new Date().toISOString() }).eq("id", intento.id)
    }

    await supabase.from("asignaciones").update({ estado: newState }).eq("id", asignacion.id)
    router.replace(`/examen/${token}`)
  }

  const handleFinalize = (autoFinalize = false) => {
    if (autoFinalize) {
      executeFinalize(true)
      return
    }
    setIsConfirmModalOpen(true)
  }

  if (loading || !preguntas.length) {
    return (
      <div className="min-h-screen bg-bg-base bg-mesh-gradient flex items-center justify-center">
        <div className="flex flex-col items-center bg-white p-12 rounded-3xl shadow-elevated border border-border-default">
          <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin mb-6" />
          <p className="text-sm font-semibold text-text-secondary">Cargando evaluación...</p>
          <p className="text-xs text-text-muted mt-1">Por favor espera</p>
        </div>
      </div>
    )
  }

  const currentPregunta = preguntas[currentIdx]
  const answeredCount = Object.keys(respuestas).length
  const progressPercent = Math.round((answeredCount / preguntas.length) * 100)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  return (
    <div className="min-h-screen bg-bg-base bg-mesh-gradient text-text-primary font-sans flex flex-col overflow-x-hidden">

      {/* Zoom de imagen modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-elevated hover:bg-danger-50 transition-colors"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
            <Image
              src={zoomedImage}
              alt="Vista ampliada"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[88vh] object-contain rounded-2xl shadow-elevated"
            />
          </div>
        </div>
      )}

      {/* Modal Confirmación de Finalización */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)} />
          <div className="bg-white border border-border-default shadow-elevated rounded-2xl w-full pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] relative max-w-sm z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${answeredCount === preguntas.length ? 'from-success-500 to-accent-500' : 'from-warning-500 to-warning-400'}`}></div>
            <div className="flex items-start justify-between p-6 border-b border-border-light">
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">¿Finalizar Evaluación?</h2>
              </div>
              <button onClick={() => setIsConfirmModalOpen(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors -mt-1 -mr-1" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="text-center -mt-2">
                <p className="text-sm text-text-secondary mb-5 leading-relaxed">
                  Estás a punto de enviar tus respuestas. Una vez finalizado, no podrás realizar ningún cambio.
                </p>

                <div className={`rounded-xl p-4 mb-6 text-left ${answeredCount === preguntas.length ? 'bg-success-50 border border-success-200/50' : 'bg-warning-50 border border-warning-200/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Progreso</span>
                    <span className={`text-sm font-black ${answeredCount === preguntas.length ? 'text-success-700' : 'text-warning-700'}`}>
                      {answeredCount} / {preguntas.length}
                    </span>
                  </div>
                  {answeredCount < preguntas.length ? (
                    <p className="text-xs font-semibold text-warning-800">
                      Aún tienes {preguntas.length - answeredCount} pregunta(s) sin responder. Te sugerimos revisarlas antes de enviar.
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-success-800">
                      ¡Excelente! Has respondido todas las preguntas de la evaluación.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => executeFinalize(false)}
                    disabled={isFinishing}
                    className={`w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 h-11 rounded-xl transition-all shadow-sm ${answeredCount === preguntas.length ? 'bg-primary-600 hover:bg-primary-700' : 'bg-warning-600 hover:bg-warning-700'}`}
                  >
                    {isFinishing ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      "Sí, Enviar Examen"
                    )}
                  </button>
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="w-full inline-flex items-center justify-center text-sm font-semibold text-text-tertiary hover:text-text-primary hover:bg-bg-elevated px-4 h-11 rounded-xl transition-all"
                  >
                    Volver al examen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso global top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border-light">
        <div
          className="h-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-2xl border-b border-border-light shadow-soft">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-[68px] flex items-center justify-between gap-4">

          {/* Logo + nombre examen */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-md shadow-primary-600/20 text-white font-extrabold text-lg shrink-0">
              {asignacion.examenes.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Evaluación en curso</p>
              <h1 className="font-bold text-text-primary text-sm leading-tight truncate hidden sm:block">
                {asignacion.examenes.nombre}
              </h1>
              <h1 className="font-bold text-text-primary text-sm leading-tight sm:hidden">Examen</h1>
            </div>
          </div>

          {/* Controles derecha */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Guardado */}
            <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${savingState === 'saving' ? 'bg-info-50 text-info-600 border border-info-100' :
                savingState === 'saved' ? 'bg-success-50 text-success-600 border border-success-500/20' :
                  'bg-bg-elevated text-text-muted border border-transparent'
              }`}>
              {savingState === 'saving' ? (
                <><Save className="w-3 h-3 animate-bounce" /> Guardando</>
              ) : savingState === 'saved' ? (
                <><CheckCircle2 className="w-3 h-3" /> Guardado</>
              ) : (
                <><CheckCircle2 className="w-3 h-3" /> Sincronizado</>
              )}
            </div>

            {/* Temporizador */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono font-bold text-sm tracking-widest transition-all ${isUrgent
                ? 'bg-danger-50 text-danger-600 border-danger-200 animate-pulse shadow-sm shadow-danger-500/10'
                : 'bg-white text-text-primary border-border-default shadow-soft'
              }`}>
              <Clock className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-danger-500' : 'text-primary-600'}`} />
              {timeLeftStr}
            </div>

            {/* Botón finalizar */}
            <button
              onClick={() => handleFinalize(false)}
              disabled={isFinishing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-danger-600 bg-white border border-danger-200 rounded-xl hover:bg-danger-600 hover:text-white hover:border-danger-600 transition-all disabled:opacity-50 shadow-soft"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Finalizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Layout principal */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 pb-28 lg:pb-10 gap-6 relative z-10">

        {/* ─── SIDEBAR DESKTOP ─── */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
          <div className="sticky top-24 flex flex-col gap-4">

            {/* Card de progreso */}
            <div className="bg-white rounded-2xl border border-border-default shadow-card overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-accent-500"></div>
              {/* Header del card */}
              <div className="p-5 border-b border-border-light">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Tu Progreso</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-text-primary">{answeredCount}</span>
                      <span className="text-lg font-bold text-text-tertiary">/ {preguntas.length}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 font-medium">preguntas respondidas</p>
                  </div>
                  {/* Círculo de progreso */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-bg-elevated" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        className="stroke-primary-600"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${progressPercent} 100`}
                        style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-text-primary">{progressPercent}%</span>
                  </div>
                </div>

                {/* Mini barra */}
                <div className="mt-4 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-accent-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Grid de preguntas */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Navegación</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {preguntas.map((p, idx) => {
                    const isAnswered = !!respuestas[p.id]
                    const isCurrent = currentIdx === idx

                    return (
                      <button
                        key={p.id}
                        onClick={() => changeQuestion(idx)}
                        title={`Pregunta ${idx + 1}${isAnswered ? ' ✓' : ''}`}
                        className={`relative aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-200 ${isCurrent
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 scale-110 z-10'
                            : isAnswered
                              ? 'bg-success-50 text-success-700 border border-success-500/30 hover:bg-success-100'
                              : 'bg-bg-elevated text-text-tertiary hover:bg-primary-50 hover:text-primary-600'
                          }`}
                      >
                        {idx + 1}
                        {isAnswered && !isCurrent && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-500 border border-white" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Leyenda */}
              <div className="px-4 pb-4 flex items-center gap-4 text-[10px] text-text-muted font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-600 inline-block" /> Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success-500 inline-block" /> Respondida
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-bg-elevated border border-border-default inline-block" /> Pendiente
                </span>
              </div>
            </div>

            {/* Estado de guardado desktop */}
            <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${savingState === 'saving' ? 'bg-info-50 text-info-600 border-info-100' :
                savingState === 'saved' ? 'bg-success-50 text-success-600 border-success-500/20' :
                  'bg-white text-text-muted border-border-light'
              }`}>
              {savingState === 'saving' ? (
                <><Save className="w-3.5 h-3.5 animate-bounce" /> Guardando respuesta...</>
              ) : savingState === 'saved' ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Respuesta guardada</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Todo sincronizado</>
              )}
            </div>
          </div>
        </aside>

        {/* ─── ÁREA DE PREGUNTA ─── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Breadcrumb pregunta */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary-600 bg-primary-50 border border-primary-200/60 px-3 py-1.5 rounded-full uppercase tracking-widest">
                Pregunta {currentIdx + 1} de {preguntas.length}
              </span>
              {currentPregunta.puntaje && (
                <span className="text-[10px] font-bold text-text-muted bg-white border border-border-default px-3 py-1.5 rounded-full">
                  {currentPregunta.puntaje} pts
                </span>
              )}
            </div>
            <div className="h-px bg-gradient-to-r from-border-default to-transparent flex-1" />
          </div>

          {/* Card de pregunta */}
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
            <div className="bg-white rounded-2xl border border-border-default shadow-card overflow-hidden">

              {/* Banda de color superior según tipo */}
              <div className={`h-1 ${currentPregunta.tipo === 'multiple' ? 'bg-gradient-to-r from-primary-600 to-primary-400' :
                  currentPregunta.tipo === 'verdadero_falso' ? 'bg-gradient-to-r from-accent-500 to-accent-400' :
                    'bg-gradient-to-r from-violet to-pink'
                }`} />

              <div className="p-6 sm:p-8">
                {/* Texto de la pregunta */}
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary leading-relaxed mb-6">
                  {currentPregunta.pregunta}
                </h2>

                {/* Imagen de la pregunta (si existe) */}
                {currentPregunta.imagen_url && (
                  <div className="mb-7 group">
                    <div
                      className="relative rounded-xl overflow-hidden border border-border-default bg-bg-elevated cursor-zoom-in"
                      onClick={() => setZoomedImage(currentPregunta.imagen_url)}
                    >
                      <Image
                        src={currentPregunta.imagen_url}
                        alt={`Imagen de la pregunta ${currentIdx + 1}`}
                        width={900}
                        height={500}
                        className="w-full h-auto max-h-80 object-contain"
                        priority
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-md text-xs font-bold text-text-secondary">
                          <ZoomIn className="w-3.5 h-3.5" />
                          Ver imagen completa
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Opciones de respuesta */}
                <div className="space-y-3">

                  {/* Tipo: múltiple */}
                  {currentPregunta.tipo === 'multiple' && (
                    currentPregunta.opciones?.map((opt: any, i: number) => {
                      const isSelected = respuestas[currentPregunta.id] === opt.texto
                      const letter = letters[i] || '?'

                      return (
                        <label
                          key={opt.id}
                          className={`group flex items-center gap-4 p-4 sm:p-5 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                              ? 'bg-primary-50 border-2 border-primary-500 shadow-sm shadow-primary-500/10'
                              : 'bg-white border-2 border-border-light hover:border-primary-200 hover:bg-primary-50/20'
                            }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentPregunta.id}`}
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => handleAnswerChange(currentPregunta.id, opt.texto)}
                          />
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm transition-all ${isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-bg-elevated text-text-tertiary group-hover:bg-primary-100 group-hover:text-primary-700'
                            }`}>
                            {isSelected ? <CheckCircle2 className="w-4.5 h-4.5" /> : letter}
                          </div>
                          <span className={`text-sm sm:text-base font-medium leading-snug transition-colors ${isSelected ? 'text-primary-700' : 'text-text-secondary group-hover:text-text-primary'
                            }`}>
                            {opt.texto}
                          </span>
                        </label>
                      )
                    })
                  )}

                  {/* Tipo: verdadero/falso */}
                  {currentPregunta.tipo === 'verdadero_falso' && (
                    <div className="grid grid-cols-2 gap-4">
                      {currentPregunta.opciones?.map((opt: any) => {
                        const isSelected = respuestas[currentPregunta.id] === opt.texto
                        const isVerdadero = opt.texto.toLowerCase() === 'verdadero'

                        return (
                          <label
                            key={opt.id}
                            className={`group flex flex-col items-center justify-center p-7 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden relative ${isSelected
                                ? isVerdadero
                                  ? 'bg-success-50 border-2 border-success-500 shadow-md shadow-success-500/10'
                                  : 'bg-danger-50 border-2 border-danger-500 shadow-md shadow-danger-500/10'
                                : 'bg-white border-2 border-border-light hover:border-border-strong'
                              }`}
                          >
                            <input
                              type="radio"
                              name={`q_${currentPregunta.id}`}
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => handleAnswerChange(currentPregunta.id, opt.texto)}
                            />
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all ${isSelected
                                ? isVerdadero
                                  ? 'bg-success-500 text-white shadow-md'
                                  : 'bg-danger-500 text-white shadow-md'
                                : 'bg-bg-elevated text-text-muted group-hover:bg-white group-hover:text-text-secondary'
                              }`}>
                              {isVerdadero
                                ? <CheckCircle2 className="w-7 h-7" />
                                : <X className="w-7 h-7" />
                              }
                            </div>
                            <span className={`text-lg font-bold transition-colors ${isSelected
                                ? isVerdadero ? 'text-success-700' : 'text-danger-700'
                                : 'text-text-tertiary group-hover:text-text-secondary'
                              }`}>
                              {opt.texto}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Tipo: corta / desarrollo */}
                  {(currentPregunta.tipo === 'corta' || currentPregunta.tipo === 'desarrollo') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                          Tu respuesta
                        </label>
                        {respuestas[currentPregunta.id] && (
                          <span className="text-[10px] text-text-muted">
                            {respuestas[currentPregunta.id].length} caracteres
                          </span>
                        )}
                      </div>
                      <textarea
                        value={respuestas[currentPregunta.id] || ""}
                        onChange={(e) => handleAnswerChange(currentPregunta.id, e.target.value)}
                        placeholder="Desarrolla tu respuesta aquí..."
                        className={`w-full rounded-xl border-2 border-border-light bg-bg-elevated/40 p-4 sm:p-5 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all resize-y ${currentPregunta.tipo === 'corta' ? 'min-h-[180px]' : 'min-h-[260px]'
                          }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navegación entre preguntas */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() => changeQuestion(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-text-secondary bg-white border border-border-default rounded-xl hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-soft"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              {currentIdx < preguntas.length - 1 ? (
                <button
                  onClick={() => changeQuestion(Math.min(preguntas.length - 1, currentIdx + 1))}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary-600 rounded-xl shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-all"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleFinalize(false)}
                  disabled={isFinishing}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black text-white bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl shadow-md shadow-primary-600/20 hover:shadow-lg hover:opacity-95 transition-all uppercase tracking-wider disabled:opacity-60"
                >
                  {isFinishing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Finalizar Examen <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── BARRA INFERIOR MÓVIL / TABLET ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-border-light shadow-elevated">

        {/* Panel de navegación (se expande hacia arriba) */}
        {showNavPanel && (
          <div className="px-4 pt-4 pb-3 border-b border-border-light animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Preguntas</p>
              <button
                onClick={() => setShowNavPanel(false)}
                className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center hover:bg-border-default transition-colors"
              >
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
              {preguntas.map((p, idx) => {
                const isAnswered = !!respuestas[p.id]
                const isCurrent = currentIdx === idx
                return (
                  <button
                    key={p.id}
                    onClick={() => changeQuestion(idx)}
                    className={`relative aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${isCurrent
                        ? 'bg-primary-600 text-white shadow-md scale-110 z-10'
                        : isAnswered
                          ? 'bg-success-50 text-success-700 border border-success-500/30'
                          : 'bg-bg-elevated text-text-tertiary hover:bg-primary-50'
                      }`}
                  >
                    {idx + 1}
                    {isAnswered && !isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-500 border border-white" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Barra inferior principal */}
        <div className="px-4 py-3 flex items-center gap-3">

          {/* Botón de navegación */}
          <button
            onClick={() => setShowNavPanel(v => !v)}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${showNavPanel
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-text-secondary border-border-default'
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden xs:inline">{answeredCount}/{preguntas.length}</span>
          </button>

          {/* Mini barra de progreso */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-muted">Progreso</span>
              <span className="text-[10px] font-black text-primary-600">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-accent-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Navegación compacta */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => changeQuestion(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="w-10 h-10 rounded-xl bg-white border border-border-default flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>

            <span className="text-xs font-bold text-text-muted w-8 text-center">
              {currentIdx + 1}/{preguntas.length}
            </span>

            {currentIdx < preguntas.length - 1 ? (
              <button
                onClick={() => changeQuestion(Math.min(preguntas.length - 1, currentIdx + 1))}
                className="w-10 h-10 rounded-xl bg-primary-600 border border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                onClick={() => handleFinalize(false)}
                disabled={isFinishing}
                className="px-3 h-10 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-[10px] font-black uppercase tracking-wide disabled:opacity-60"
              >
                {isFinishing ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Enviar'}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
