"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Clock, ChevronLeft, ChevronRight, Save, CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react"
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
  const [isFinishing, setIsFinishing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

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
        toast.error("¡Tiempo agotado!")
        handleFinalize(true)
      } else {
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

  const handleFinalize = async (autoFinalize = false) => {
    if (!autoFinalize && !confirm("¿Estás seguro de finalizar el examen? Revisa tus respuestas por última vez.")) return

    setIsFinishing(true)

    const { hasManual, totalScore } = await calculateAutoGrades()
    let newState = 'pendiente_revision'
    let isAprobado = false

    if (!hasManual) {
      if (totalScore >= asignacion.examenes.nota_minima) {
        newState = 'aprobado'
        isAprobado = true
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

  if (loading || !preguntas.length) {
    return (
      <div className="min-h-screen bg-bg-base bg-mesh-gradient flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center relative z-10 bg-white p-12 rounded-3xl shadow-elevated border border-border-default">
          <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin mb-6 shadow-md"></div>
          <div className="h-3 w-48 bg-bg-elevated rounded-full mb-2 animate-pulse" />
          <div className="h-2 w-32 bg-bg-elevated rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  const currentPregunta = preguntas[currentIdx]
  const progressPercent = Math.round((Object.keys(respuestas).length / preguntas.length) * 100)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  return (
    <div className="min-h-screen bg-bg-base bg-mesh-gradient text-text-primary font-sans relative flex flex-col overflow-x-hidden">

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-2xl border-b border-border-light shadow-soft">
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-md shadow-primary-600/30 text-white font-extrabold text-lg">
              {asignacion.examenes.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-text-primary tracking-tight text-base hidden sm:block">
                {asignacion.examenes.nombre}
              </h1>
              <h1 className="font-bold text-text-primary sm:hidden">Examen</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                </span>
                <p className="text-[10px] text-text-tertiary font-bold tracking-widest uppercase">En curso</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-border-default shadow-sm">
              <Clock className={`w-4 h-4 ${timeLeftStr === "00:00" ? 'text-danger-500' : 'text-primary-600 animate-pulse'}`} />
              <span className="font-mono font-bold text-text-primary text-base tracking-widest">{timeLeftStr}</span>
            </div>

            <button
              onClick={() => handleFinalize(false)}
              disabled={isFinishing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-danger-600 bg-danger-50 border border-danger-100 rounded-xl hover:bg-danger-500 hover:text-white hover:border-danger-500 transition-all disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Finalizar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto relative z-10 pt-6 pb-20 px-4 md:px-8 gap-6">

        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 bg-white/80 backdrop-blur-xl rounded-2xl border border-border-default p-5 shadow-card">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-light">
              <div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Tu Progreso</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary-600">{Object.keys(respuestas).length}</span>
                  <span className="text-sm font-bold text-text-muted">/ {preguntas.length}</span>
                </div>
              </div>

              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path strokeDasharray="100, 100" className="text-bg-elevated" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path strokeDasharray={`${progressPercent}, 100`} className="text-primary-600 drop-shadow-sm transition-all duration-1000" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
                </svg>
                <div className="absolute text-[10px] font-bold text-text-primary">{progressPercent}%</div>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
              {preguntas.map((p, idx) => {
                const isAnswered = !!respuestas[p.id]
                const isCurrent = currentIdx === idx

                return (
                  <button
                    key={p.id}
                    onClick={() => changeQuestion(idx)}
                    className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 ring-2 ring-primary-200 scale-105 z-10'
                        : isAnswered
                          ? 'bg-success-50 text-success-700 border border-success-500/30 hover:bg-success-100'
                          : 'bg-white text-text-tertiary border border-border-default hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className={`mt-5 flex items-center justify-center gap-2 text-[10px] font-bold py-2.5 px-3 rounded-xl uppercase tracking-widest transition-all ${savingState === 'saving' ? 'bg-info-50 text-info-600 border border-info-100' :
              savingState === 'saved' ? 'bg-success-50 text-success-700 border border-success-500/20' :
                'bg-bg-elevated text-text-muted border border-transparent'
              }`}>
              {savingState === 'saving' ? (
                <>
                  <Save className="w-3.5 h-3.5 animate-bounce" /> Guardando...
                </>
              ) : savingState === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizado
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Question Area */}
        <div className="flex-1 max-w-4xl flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3.5 py-1.5 rounded-full bg-white text-primary-700 font-bold text-xs tracking-widest border border-border-default shadow-sm">
              PREGUNTA {currentIdx + 1} DE {preguntas.length}
            </span>
            <span className="h-px bg-border-default flex-1"></span>
          </div>

          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            <div className="bg-white rounded-2xl border border-border-default shadow-card p-6 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary-50 to-transparent rounded-bl-[100%] pointer-events-none opacity-50" />

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary mb-8 leading-tight tracking-tight relative z-10">
                {currentPregunta.pregunta}
              </h2>

              <div className="space-y-3 relative z-10">
                {currentPregunta.tipo === 'multiple' && (
                  currentPregunta.opciones?.map((opt: any, i: number) => {
                    const isSelected = respuestas[currentPregunta.id] === opt.texto;
                    const letter = letters[i] || '?';

                    return (
                      <label
                        key={opt.id}
                        className={`group relative flex items-center gap-4 p-4 sm:p-5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-50 border-2 border-primary-500 shadow-md shadow-primary-500/10'
                            : 'bg-white border-2 border-border-light hover:border-primary-300 hover:bg-primary-50/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${currentPregunta.id}`}
                          className="peer sr-only"
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentPregunta.id, opt.texto)}
                        />

                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-base transition-all ${isSelected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-bg-elevated text-text-tertiary group-hover:bg-white group-hover:text-primary-600'
                          }`}>
                          {isSelected ? <CheckCircle2 className="w-5 h-5" /> : letter}
                        </div>

                        <span className={`text-base sm:text-lg font-medium transition-colors ${isSelected ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                          {opt.texto}
                        </span>
                      </label>
                    )
                  })
                )}

                {currentPregunta.tipo === 'verdadero_falso' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentPregunta.opciones?.map((opt: any) => {
                      const isSelected = respuestas[currentPregunta.id] === opt.texto;

                      return (
                        <label
                          key={opt.id}
                          className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer transition-all overflow-hidden ${isSelected
                            ? 'bg-primary-50 border-2 border-primary-500 shadow-md shadow-primary-500/10'
                            : 'bg-white border-2 border-border-light hover:border-primary-300 hover:bg-primary-50/30'
                            }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentPregunta.id}`}
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => handleAnswerChange(currentPregunta.id, opt.texto)}
                          />
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all ${isSelected ? 'bg-primary-600 text-white shadow-md' : 'bg-bg-elevated text-text-tertiary group-hover:bg-white group-hover:text-primary-600'}`}>
                            {opt.texto.toLowerCase() === 'verdadero' ? (
                              <CheckCircle2 className="w-7 h-7" />
                            ) : (
                              <X className="w-7 h-7" />
                            )}
                          </div>
                          <span className={`text-xl font-bold transition-colors ${isSelected ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary'}`}>
                            {opt.texto}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {(currentPregunta.tipo === 'corta' || currentPregunta.tipo === 'desarrollo') && (
                  <textarea
                    value={respuestas[currentPregunta.id] || ""}
                    onChange={(e) => handleAnswerChange(currentPregunta.id, e.target.value)}
                    placeholder="Desarrolla tu respuesta detalladamente aquí..."
                    className={`w-full rounded-xl border-2 border-border-light bg-bg-elevated/30 p-5 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all resize-y ${currentPregunta.tipo === 'corta' ? 'min-h-[180px]' : 'min-h-[260px]'
                      }`}
                  />
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => changeQuestion(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-text-secondary bg-white border border-border-default rounded-xl hover:text-text-primary hover:border-border-strong transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              {currentIdx < preguntas.length - 1 ? (
                <button
                  onClick={() => changeQuestion(Math.min(preguntas.length - 1, currentIdx + 1))}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-primary-600 rounded-xl shadow-md shadow-primary-600/30 hover:bg-primary-700 transition-all"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleFinalize(false)}
                  disabled={isFinishing}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black text-white bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl shadow-md shadow-primary-600/30 hover:shadow-lg transition-all uppercase tracking-wider"
                >
                  {isFinishing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Finalizar Examen
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
