"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Settings, Clock, Award, ListOrdered, FileText, X, Save, CheckCircle2, Circle, Type, AlignLeft, ChevronUp, ChevronDown, Loader2, BookOpen, ToggleLeft, ToggleRight, Edit2, ImagePlus, AlertTriangle, Calculator } from "lucide-react"
import { Modal } from "@/components/ui/modal"

export default function ExamBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const examId = resolvedParams.id

  const [exam, setExam] = useState<any>(null)
  const [preguntas, setPreguntas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  // Image Upload State
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Question Form State
  const [tipo, setTipo] = useState<'multiple' | 'verdadero_falso' | 'corta' | 'desarrollo'>('multiple')
  const [preguntaText, setPreguntaText] = useState("")
  const [puntaje, setPuntaje] = useState("1")
  const [opciones, setOpciones] = useState<{ texto: string, es_correcta: boolean }[]>([
    { texto: "", es_correcta: true },
    { texto: "", es_correcta: false }
  ])
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const fetchExamAndQuestions = async () => {
    setLoading(true)
    const { data: examData, error: examError } = await supabase.from("examenes").select("*").eq("id", examId).single()
    if (examError) {
      toast.error("Error al cargar el examen")
      return
    }
    setExam(examData)

    const { data: preguntasData, error: preguntasError } = await supabase
      .from("preguntas")
      .select("*, opciones(*)")
      .eq("examen_id", examId)
      .order("orden", { ascending: true })

    if (!preguntasError) {
      setPreguntas(preguntasData || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExamAndQuestions()
  }, [examId])

  const handleOpenModal = (pregunta: any = null) => {
    if (pregunta && pregunta.id) {
      setEditingQuestionId(pregunta.id)
      setTipo(pregunta.tipo)
      setPreguntaText(pregunta.pregunta)
      setPuntaje(pregunta.puntaje.toString())
      setImagenPreview(pregunta.imagen_url || null)
      setImagenFile(null)
      if (pregunta.tipo === 'multiple') {
        if (pregunta.opciones && pregunta.opciones.length > 0) {
          setOpciones(pregunta.opciones.map((o: any) => ({ texto: o.texto, es_correcta: o.es_correcta })))
        } else {
          setOpciones([
            { texto: "", es_correcta: true },
            { texto: "", es_correcta: false }
          ])
        }
      } else if (pregunta.tipo === 'verdadero_falso') {
        const isVerdaderoCorrect = pregunta.opciones?.find((o: any) => o.texto === 'Verdadero')?.es_correcta || false;
        setOpciones([
          { texto: "Verdadero", es_correcta: isVerdaderoCorrect },
          { texto: "Falso", es_correcta: !isVerdaderoCorrect }
        ])
      } else {
        setOpciones([
          { texto: "", es_correcta: true },
          { texto: "", es_correcta: false }
        ])
      }
    } else {
      setEditingQuestionId(null)
      setTipo('multiple')
      setPreguntaText("")
      setPuntaje("1")
      setImagenPreview(null)
      setImagenFile(null)
      setOpciones([
        { texto: "", es_correcta: true },
        { texto: "", es_correcta: false }
      ])
    }
    setIsModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImagenFile(file)
      setImagenPreview(URL.createObjectURL(file))
    }
  }

  const handleAddOption = () => {
    if (opciones.length >= 6) return
    setOpciones([...opciones, { texto: "", es_correcta: false }])
  }

  const handleRemoveOption = (index: number) => {
    if (opciones.length <= 2) return
    const newOpciones = [...opciones]
    newOpciones.splice(index, 1)
    if (newOpciones.every(o => !o.es_correcta) && newOpciones.length > 0) {
      newOpciones[0].es_correcta = true
    }
    setOpciones(newOpciones)
  }

  const handleSetCorrectOption = (index: number) => {
    setOpciones(opciones.map((opt, i) => ({
      ...opt,
      es_correcta: i === index
    })))
  }

  const handleOptionTextChange = (index: number, text: string) => {
    const newOpciones = [...opciones]
    newOpciones[index].texto = text
    setOpciones(newOpciones)
  }

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (tipo === 'multiple') {
      if (opciones.some(o => o.texto.trim() === "")) {
        toast.error("Todas las opciones deben tener texto")
        setSaving(false)
        return
      }
      if (!opciones.some(o => o.es_correcta)) {
        toast.error("Debe haber al menos una opción correcta")
        setSaving(false)
        return
      }
    }

    let finalImageUrl = imagenPreview;
    if (imagenPreview && !imagenPreview.startsWith('blob:') && !imagenFile) {
        finalImageUrl = imagenPreview;
    } else if (!imagenPreview) {
        finalImageUrl = null;
    }

    if (imagenFile) {
      setUploadingImage(true)
      const fileExt = imagenFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `preguntas/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('exam_images')
        .upload(filePath, imagenFile)

      if (uploadError) {
        toast.error("Error al subir la imagen")
        setSaving(false)
        setUploadingImage(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('exam_images').getPublicUrl(filePath)
      finalImageUrl = publicUrl
      setUploadingImage(false)
    }

    let questionId = editingQuestionId;

    if (editingQuestionId) {
      const { error: questionError } = await supabase.from("preguntas").update({
        tipo,
        pregunta: preguntaText,
        puntaje: parseFloat(puntaje),
        imagen_url: finalImageUrl,
      }).eq("id", editingQuestionId)

      if (questionError) {
        toast.error("Error al actualizar la pregunta")
        setSaving(false)
        return
      }

      // Delete existing options
      await supabase.from("opciones").delete().eq("pregunta_id", editingQuestionId);
    } else {
      const nextOrden = preguntas.length > 0 ? Math.max(...preguntas.map(p => p.orden)) + 1 : 0

      const { data: nuevaPregunta, error: questionError } = await supabase.from("preguntas").insert({
        examen_id: examId,
        tipo,
        pregunta: preguntaText,
        puntaje: parseFloat(puntaje),
        orden: nextOrden,
        imagen_url: finalImageUrl
      }).select().single()

      if (questionError) {
        toast.error("Error al guardar la pregunta")
        setSaving(false)
        return
      }
      questionId = nuevaPregunta.id;
    }

    if (tipo === 'multiple' || tipo === 'verdadero_falso') {
      let optsToInsert = opciones
      if (tipo === 'verdadero_falso') {
        optsToInsert = [
          { texto: "Verdadero", es_correcta: opciones[0].es_correcta },
          { texto: "Falso", es_correcta: !opciones[0].es_correcta }
        ]
      }

      const { error: optionsError } = await supabase.from("opciones").insert(
        optsToInsert.map(opt => ({
          pregunta_id: questionId,
          texto: opt.texto,
          es_correcta: opt.es_correcta
        }))
      )

      if (optionsError) {
        toast.error("Pregunta guardada pero error en opciones")
      }
    }

    toast.success(editingQuestionId ? "Pregunta actualizada" : "Pregunta agregada")
    setIsModalOpen(false)
    fetchExamAndQuestions()
    setSaving(false)
  }

  const handleAutoDistributePoints = async () => {
    if (preguntas.length === 0) return
    
    const basePuntaje = Math.floor((20 / preguntas.length) * 100) / 100;
    
    let remaining = 20;
    const updates = preguntas.map((p, index) => {
      let pScore = basePuntaje;
      if (index === preguntas.length - 1) {
        pScore = Number(remaining.toFixed(2));
      } else {
        remaining -= basePuntaje;
      }
      return { id: p.id, puntaje: pScore }
    });

    setLoading(true)
    await Promise.all(updates.map(u => 
      supabase.from("preguntas").update({ puntaje: u.puntaje }).eq("id", u.id)
    ))

    toast.success("Puntajes distribuidos a 20 pts")
    fetchExamAndQuestions()
  }

  const handleDeleteQuestion = async (id: string) => {
    if (confirm("¿Eliminar esta pregunta?")) {
      await supabase.from("preguntas").delete().eq("id", id)
      toast.success("Pregunta eliminada")
      fetchExamAndQuestions()
    }
  }

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === preguntas.length - 1) return

    const newPreguntas = [...preguntas]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    const tempOrden = newPreguntas[index].orden
    newPreguntas[index].orden = newPreguntas[swapIndex].orden
    newPreguntas[swapIndex].orden = tempOrden

    setPreguntas([...newPreguntas].sort((a, b) => a.orden - b.orden))

    await Promise.all([
      supabase.from("preguntas").update({ orden: newPreguntas[index].orden }).eq("id", newPreguntas[index].id),
      supabase.from("preguntas").update({ orden: newPreguntas[swapIndex].orden }).eq("id", newPreguntas[swapIndex].id)
    ])
  }

  const totalPuntaje = preguntas.reduce((sum, p) => sum + Number(p.puntaje), 0)

  if (loading && !exam) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
        <p className="text-sm text-text-tertiary font-medium">Cargando constructor de examen...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-20 gap-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-border-default shadow-card">
        <Link
          href="/examenes"
          className="p-2 rounded-xl border border-border-default hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
            <span>Exámenes</span>
            <span>/</span>
            <span className="text-text-secondary font-medium truncate">Constructor</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight truncate">{exam?.nombre}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Exam Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-border-default shadow-card p-6 sticky top-24">
            <h2 className="text-base font-bold flex items-center gap-2 mb-5 text-text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary-600" />
              </div>
              Detalles del Examen
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1.5">Descripción</span>
                <p className="text-text-secondary bg-bg-elevated p-3 rounded-xl text-xs leading-relaxed">{exam?.descripcion || "Sin descripción proporcionada"}</p>
              </div>
              <div className="flex justify-between items-center bg-bg-elevated p-3 rounded-xl">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Duración</span>
                <span className="font-semibold text-text-primary flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                  {exam?.duracion_minutos} min
                </span>
              </div>
              <div className="flex justify-between items-center bg-bg-elevated p-3 rounded-xl">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Nota Mínima</span>
                <span className="font-semibold text-text-primary flex items-center gap-1.5 text-xs">
                  <Award className="w-3.5 h-3.5 text-text-tertiary" />
                  {exam?.nota_minima} pts
                </span>
              </div>
              <div className="flex justify-between items-center bg-bg-elevated p-3 rounded-xl">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Preguntas</span>
                <span className="font-semibold text-text-primary flex items-center gap-1.5 text-xs">
                  <ListOrdered className="w-3.5 h-3.5 text-text-tertiary" />
                  {preguntas.length}
                </span>
              </div>
              <div className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${totalPuntaje === 20 ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${totalPuntaje === 20 ? 'text-success-700' : 'text-warning-700'}`}>Puntaje Total</span>
                  <span className={`font-bold text-base ${totalPuntaje === 20 ? 'text-success-700' : 'text-warning-700'}`}>{totalPuntaje} / 20 pts</span>
                </div>
                {totalPuntaje !== 20 && preguntas.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    <p className="text-xs text-warning-700 font-medium leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
                      El examen debe sumar exactamente 20 puntos.
                    </p>
                    <button
                      onClick={handleAutoDistributePoints}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-warning-600 hover:bg-warning-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Autocalcular a 20 pts
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Questions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border-default shadow-card p-6 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
              <div>
                <h2 className="text-base font-bold text-text-primary">Banco de Preguntas</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Configura las preguntas de la evaluación</p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 text-sm font-semibold px-4 h-10 rounded-xl shadow-sm shadow-primary-600/20 hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Añadir Pregunta
              </button>
            </div>

            {totalPuntaje !== 20 && preguntas.length > 0 && (
              <div className="mb-5 bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-warning-800">Puntaje total incorrecto ({totalPuntaje} / 20 pts)</h4>
                  <p className="text-xs text-warning-700 mt-1">El puntaje total de las preguntas debe sumar exactamente 20 puntos para que la evaluación sea válida. Puedes ajustar los puntajes manualmente editando cada pregunta o usar el botón de autocalcular en el panel izquierdo.</p>
                </div>
              </div>
            )}

            <div className="space-y-3 flex-1">
              {preguntas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-tertiary border-2 border-dashed border-border-default bg-bg-elevated/30 rounded-2xl p-12 text-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm border border-border-default">
                    <BookOpen className="w-7 h-7 text-text-muted" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-1.5">Sin Preguntas</h3>
                  <p className="text-sm max-w-sm mb-5">Aún no hay preguntas. Comienza a construir tu evaluación.</p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-white border border-border-default hover:bg-bg-elevated text-text-primary text-sm font-semibold px-4 h-10 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Crear primera pregunta
                  </button>
                </div>
              ) : (
                preguntas.map((p, index) => {
                  const tipoConfig = {
                    multiple: { label: 'Opción Múltiple', bg: 'bg-info-50', text: 'text-info-600' },
                    verdadero_falso: { label: 'Verdadero/Falso', bg: 'bg-success-50', text: 'text-success-700' },
                    corta: { label: 'Respuesta Corta', bg: 'bg-warning-50', text: 'text-warning-600' },
                    desarrollo: { label: 'Desarrollo', bg: 'bg-violet/10', text: 'text-violet' }
                  }
                  const tc = tipoConfig[p.tipo as keyof typeof tipoConfig] || tipoConfig.multiple
                  return (
                    <div key={p.id} className="bg-white border border-border-default rounded-xl p-4 flex gap-3 group hover:border-primary-300 hover:shadow-card transition-all">
                      <div className="flex flex-col items-center justify-center gap-1 pr-3 border-r border-border-light">
                        <button
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="text-text-muted hover:text-primary-600 disabled:opacity-30 p-0.5 rounded transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-text-primary bg-bg-elevated w-7 h-7 rounded-lg flex items-center justify-center">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === preguntas.length - 1}
                          className="text-text-muted hover:text-primary-600 disabled:opacity-30 p-0.5 rounded transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${tc.bg} ${tc.text} uppercase tracking-wider font-bold`}>
                            {tc.label}
                          </span>
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-primary-600 to-accent-500 px-2 py-0.5 rounded-md">
                            {p.puntaje} pts
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-text-primary mb-3">{p.pregunta}</p>

                        {p.imagen_url && (
                          <div className="mb-3 w-48 h-32 rounded-xl overflow-hidden border border-border-default bg-bg-elevated">
                            <img src={p.imagen_url} alt="Imagen adjunta" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}

                        {p.tipo === 'multiple' && (
                          <div className="space-y-1.5 bg-bg-elevated/40 p-2.5 rounded-lg">
                            {p.opciones?.map((opt: any) => (
                              <div key={opt.id} className={`text-xs flex items-center gap-2 p-1.5 rounded-md ${opt.es_correcta ? 'bg-success-50 border border-success-500/30' : 'bg-white border border-border-default'}`}>
                                {opt.es_correcta ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success-600 shrink-0" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                )}
                                <span className={`${opt.es_correcta ? 'text-success-700 font-semibold' : 'text-text-secondary'}`}>
                                  {opt.texto}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {p.tipo === 'verdadero_falso' && (
                          <div className="text-xs flex items-center gap-2 bg-success-50 border border-success-500/20 p-2 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />
                            <span className="text-text-secondary">Respuesta correcta:</span>
                            <span className="font-bold text-success-700">{p.opciones?.find((o: any) => o.es_correcta)?.texto}</span>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-1 pl-2 border-l border-border-light justify-center">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 text-text-tertiary hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          title="Editar Pregunta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(p.id)}
                          className="p-1.5 text-text-tertiary hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Eliminar Pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva Pregunta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestionId ? "Editar Pregunta" : "Añadir Nueva Pregunta"}
        description="Configura el enunciado, tipo y opciones de respuesta."
        size="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Tipo de Pregunta <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all appearance-none"
                >
                  <option value="multiple">Opción Múltiple</option>
                  <option value="verdadero_falso">Verdadero o Falso</option>
                  <option value="corta">Respuesta Corta (Revisión manual)</option>
                  <option value="desarrollo">Desarrollo (Revisión manual)</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Puntaje Asignado <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  required
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={puntaje}
                  onChange={e => setPuntaje(e.target.value)}
                  className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Enunciado de la Pregunta <span className="text-danger-500">*</span>
            </label>
            <textarea
              required
              value={preguntaText}
              onChange={e => setPreguntaText(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all resize-none min-h-[100px]"
              placeholder="Escribe la pregunta detalladamente aquí..."
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Imagen de la Pregunta (Opcional)
            </label>
            <div className="flex items-center gap-4">
              {imagenPreview ? (
                <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-border-default bg-bg-elevated">
                  <img src={imagenPreview} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagenFile(null)
                      setImagenPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-white text-danger-600 p-1.5 rounded-full hover:bg-danger-50 hover:text-danger-700 transition-colors shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-border-default flex flex-col items-center justify-center bg-bg-elevated/50 hover:bg-bg-elevated transition-colors relative cursor-pointer group">
                  <ImagePlus className="w-5 h-5 text-text-tertiary mb-1 group-hover:text-primary-500 transition-colors" />
                  <span className="text-xs font-medium text-text-secondary">Clic para subir imagen</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </div>
              )}
            </div>
          </div>

          {tipo === 'multiple' && (
            <div className="space-y-3 pt-4 border-t border-border-light">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-semibold text-text-primary">Opciones de Respuesta</label>
                  <p className="text-xs text-text-tertiary mt-0.5">Marca la opción correcta con el círculo</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={opciones.length >= 6}
                  className="inline-flex items-center gap-1 bg-bg-elevated text-text-primary hover:bg-border-default text-xs font-semibold px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir
                </button>
              </div>

              <div className="space-y-2">
                {opciones.map((opt, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${opt.es_correcta ? 'border-success-500 bg-success-50' : 'border-border-default bg-white hover:border-border-strong'}`}>
                    <button
                      type="button"
                      onClick={() => handleSetCorrectOption(idx)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${opt.es_correcta ? 'border-success-500 bg-success-500' : 'border-border-strong bg-white'}`}
                    >
                      {opt.es_correcta && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    <input
                      value={opt.texto}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`Opción ${idx + 1}`}
                      className="flex-1 bg-transparent border-none text-sm text-text-primary focus:ring-0 p-0 placeholder:text-text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={opciones.length <= 2}
                      className="text-text-tertiary hover:text-danger-600 disabled:opacity-30 p-1 rounded hover:bg-danger-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tipo === 'verdadero_falso' && (
            <div className="space-y-3 pt-4 border-t border-border-light">
              <label className="block text-sm font-semibold text-text-primary">¿Cuál es la respuesta correcta?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOpciones([{ texto: "Verdadero", es_correcta: true }, { texto: "Falso", es_correcta: false }])}
                  className={`flex items-center justify-center gap-2 cursor-pointer p-4 border rounded-xl transition-all ${opciones[0].es_correcta ? 'border-success-500 bg-success-50' : 'border-border-default bg-white hover:border-border-strong'}`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${opciones[0].es_correcta ? 'text-success-600' : 'text-text-muted'}`} />
                  <span className={`font-semibold ${opciones[0].es_correcta ? 'text-success-700' : 'text-text-primary'}`}>Verdadero</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpciones([{ texto: "Verdadero", es_correcta: false }, { texto: "Falso", es_correcta: true }])}
                  className={`flex items-center justify-center gap-2 cursor-pointer p-4 border rounded-xl transition-all ${!opciones[0].es_correcta ? 'border-success-500 bg-success-50' : 'border-border-default bg-white hover:border-border-strong'}`}
                >
                  <X className={`w-5 h-5 ${!opciones[0].es_correcta ? 'text-success-600' : 'text-text-muted'}`} />
                  <span className={`font-semibold ${!opciones[0].es_correcta ? 'text-success-700' : 'text-text-primary'}`}>Falso</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-border-light">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 h-10 rounded-xl text-sm font-semibold text-text-tertiary hover:bg-bg-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/20 disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingQuestionId ? "Guardar Cambios" : "Guardar Pregunta"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
