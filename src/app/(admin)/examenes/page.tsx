"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Search, Plus, Edit2, Trash2, X, SearchX, AlertTriangle, FileText, Clock, Award, ListOrdered, Timer, GraduationCap, CheckCircle2, ArrowRight, Settings2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"

export default function ExamenesPage() {
  const router = useRouter()
  const [examenes, setExamenes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [duracion, setDuracion] = useState("45")
  const [notaMinima, setNotaMinima] = useState("15")
  const [saving, setSaving] = useState(false)

  // Delete state
  const [examToDelete, setExamToDelete] = useState<any>(null)

  const supabase = createClient()

  const fetchExamenes = async () => {
    setLoading(true)
    let query = supabase
      .from("examenes")
      .select("*, preguntas(count), asignaciones(count)")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.ilike("nombre", `%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      toast.error("Error al cargar exámenes")
    } else {
      setExamenes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExamenes()
  }, [search])

  const handleOpenModal = (examen: any = null) => {
    if (examen) {
      setEditingId(examen.id)
      setNombre(examen.nombre)
      setDescripcion(examen.descripcion || "")
      setDuracion(examen.duracion_minutos.toString())
      setNotaMinima(examen.nota_minima.toString())
    } else {
      setEditingId(null)
      setNombre("")
      setDescripcion("")
      setDuracion("45")
      setNotaMinima("15")
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      nombre,
      descripcion,
      duracion_minutos: parseInt(duracion),
      nota_minima: parseFloat(notaMinima)
    }

    if (editingId) {
      const { error } = await supabase.from("examenes").update(payload).eq("id", editingId)
      if (error) toast.error("Error al actualizar: " + error.message)
      else {
        toast.success("Examen actualizado")
        setIsModalOpen(false)
        fetchExamenes()
      }
    } else {
      const { data, error } = await supabase.from("examenes").insert([payload]).select().single()
      if (error) toast.error("Error al crear: " + error.message)
      else {
        toast.success("Examen creado")
        setIsModalOpen(false)
        router.push(`/examenes/${data.id}`)
      }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!examToDelete) return
    const { error } = await supabase.from("examenes").delete().eq("id", examToDelete.id)
    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Examen eliminado")
      setExamToDelete(null)
      fetchExamenes()
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-border-default shadow-card gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full pl-10 pr-4 h-10 bg-bg-elevated border border-transparent rounded-xl text-sm text-text-primary focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-text-muted"
            placeholder="Buscar exámenes..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 text-sm font-semibold px-5 h-10 rounded-xl shadow-sm shadow-primary-600/30 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          Crear Nuevo Examen
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-border-default overflow-hidden shadow-card flex flex-col">
          <div className="px-6 py-5 border-b border-border-light flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-600 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-text-primary">Cargando exámenes...</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated border-b border-border-light">
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-border-default rounded animate-pulse" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-bg-elevated rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : examenes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-default shadow-card flex flex-col items-center justify-center p-12 min-h-[400px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center mb-5">
            <SearchX className="w-7 h-7 text-primary-600" />
          </div>
          <h4 className="text-lg font-bold text-text-primary mb-2">No se encontraron exámenes</h4>
          <p className="text-sm text-text-tertiary max-w-sm mb-6">
            Crea un nuevo examen para empezar a construir evaluaciones.
          </p>
          <button
            onClick={() => setSearch("")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-default shadow-card overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-border-light flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-text-primary">Lista de Exámenes</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Configuración de evaluaciones registradas</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full">
              <FileText className="w-3.5 h-3.5" />
              Total: {examenes.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-light">
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">Duración</th>
                  <th className="px-6 py-3.5">Nota Mínima</th>
                  <th className="px-6 py-3.5">Preguntas</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm text-text-secondary">
                {examenes.map((exam) => {
                  const numPreguntas = exam.preguntas?.[0]?.count || 0;
                  const isActivo = numPreguntas > 0;
                  return (
                    <tr key={exam.id} className="border-b border-border-light hover:bg-bg-elevated/40 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet/20 to-pink/20 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-violet" />
                          </div>
                          <div>
                            {exam.nombre}
                            {exam.descripcion && (
                              <p className="text-xs text-text-tertiary font-normal truncate max-w-[220px] mt-0.5">{exam.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-tertiary">
                        <div className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {exam.duracion_minutos} min
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-tertiary">
                        <div className="inline-flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          {exam.nota_minima} pts
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActivo ? 'bg-info-50 text-info-600' : 'bg-bg-elevated text-text-tertiary'}`}>
                          <ListOrdered className="w-3.5 h-3.5" />
                          {numPreguntas}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActivo ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-success-500' : 'bg-warning-500'}`}></span>
                          {isActivo ? 'Activo' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/examenes/${exam.id}`)}
                            className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Gestionar Preguntas"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(exam)}
                            className="p-2 text-text-tertiary hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExamToDelete(exam)}
                            className="p-2 text-text-tertiary hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Examen" : "Crear Nuevo Examen"}
        description="Configura los parámetros básicos del instrumento de evaluación."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Nombre del Examen <span className="text-danger-500">*</span>
            </label>
            <input
              required
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Evaluación de React Avanzado"
              className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe el propósito y contenido general del examen..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Duración (minutos) <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Timer className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  required
                  type="number"
                  min="1"
                  value={duracion}
                  onChange={e => setDuracion(e.target.value)}
                  placeholder="60"
                  className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Nota Mínima Aprobatoria <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={notaMinima}
                  onChange={e => setNotaMinima(e.target.value)}
                  placeholder="75"
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted font-semibold">%</span>
              </div>
            </div>
          </div>

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
                  {editingId ? "Guardar Cambios" : "Guardar y Continuar"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        title="Confirmar Eliminación"
        size="sm"
        variant="danger"
      >
        <div className="text-center -mt-2">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-danger-600" />
          </div>
          <p className="text-sm text-text-tertiary mb-6">
            ¿Eliminar el examen <strong className="text-text-primary">{examToDelete?.nombre}</strong>?
            Se eliminarán también sus preguntas y asignaciones vinculadas.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setExamToDelete(null)}
              className="px-4 h-10 rounded-xl text-sm font-semibold text-text-tertiary hover:bg-bg-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-danger-500 text-white text-sm font-semibold hover:bg-danger-600 transition-all shadow-sm shadow-danger-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
