"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Search, UserPlus, Edit2, Trash2, X, SearchX, AlertTriangle, Users, Mail, Phone, IdCard } from "lucide-react"
import { Modal } from "@/components/ui/modal"

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [nombres, setNombres] = useState("")
  const [dni, setDni] = useState("")
  const [correo, setCorreo] = useState("")
  const [celular, setCelular] = useState("")
  const [saving, setSaving] = useState(false)

  // Delete state
  const [studentToDelete, setStudentToDelete] = useState<any>(null)

  const supabase = createClient()

  const fetchEstudiantes = async () => {
    setLoading(true)
    let query = supabase.from("estudiantes").select("*").order("created_at", { ascending: false })

    if (search) {
      query = query.or(`nombres.ilike.%${search}%,dni.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      toast.error("Error al cargar estudiantes")
    } else {
      setEstudiantes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEstudiantes()
  }, [search])

  const handleOpenModal = (student: any = null) => {
    if (student) {
      setEditingId(student.id)
      setNombres(student.nombres)
      setDni(student.dni)
      setCorreo(student.correo)
      setCelular(student.celular || "")
    } else {
      setEditingId(null)
      setNombres("")
      setDni("")
      setCorreo("")
      setCelular("")
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = { nombres, dni, correo, celular }

    if (editingId) {
      const { error } = await supabase.from("estudiantes").update(payload).eq("id", editingId)
      if (error) toast.error("Error al actualizar: " + error.message)
      else {
        toast.success("Solicitante actualizado")
        setIsModalOpen(false)
        fetchEstudiantes()
      }
    } else {
      const { error } = await supabase.from("estudiantes").insert([payload])
      if (error) toast.error("Error al crear: " + error.message)
      else {
        toast.success("Solicitante registrado")
        setIsModalOpen(false)
        fetchEstudiantes()
      }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return
    const { error } = await supabase.from("estudiantes").delete().eq("id", studentToDelete.id)
    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Solicitante eliminado")
      setStudentToDelete(null)
      fetchEstudiantes()
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
            placeholder="Buscar por DNI o nombre..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 text-sm font-semibold px-5 h-10 rounded-xl shadow-sm shadow-primary-600/30 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Solicitante
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-border-default overflow-hidden shadow-card flex flex-col">
          <div className="px-6 py-5 border-b border-border-light flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-600 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-text-primary">Cargando datos...</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated border-b border-border-light">
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-border-default rounded animate-pulse" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-bg-elevated rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-default shadow-card flex flex-col items-center justify-center p-12 min-h-[400px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center mb-5">
            <SearchX className="w-7 h-7 text-primary-600" />
          </div>
          <h4 className="text-lg font-bold text-text-primary mb-2">No se encontraron resultados</h4>
          <p className="text-sm text-text-tertiary max-w-sm mb-6">
            No hay solicitantes que coincidan con los criterios de búsqueda actuales.
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
              <h3 className="text-base font-bold text-text-primary">Lista de Solicitantes</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Personas registradas en el sistema</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              Total: {estudiantes.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-light">
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">DNI</th>
                  <th className="px-6 py-3.5">Correo Electrónico</th>
                  <th className="px-6 py-3.5">Celular</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm text-text-secondary">
                {estudiantes.map((est) => (
                  <tr key={est.id} className="border-b border-border-light hover:bg-bg-elevated/40 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                          {est.nombres?.charAt(0).toUpperCase()}
                        </div>
                        {est.nombres}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-tertiary font-mono text-xs">{est.dni}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-text-muted" />
                        {est.correo}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-tertiary">
                      {est.celular ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-text-muted" />
                          {est.celular}
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(est)}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(est)}
                          className="p-2 text-text-tertiary hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Solicitante" : "Nuevo Solicitante"}
        description={editingId ? "Modifica los datos de la persona" : "Registra una nueva persona en el sistema"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <Users className="w-3.5 h-3.5 text-text-tertiary" />
              Nombres <span className="text-danger-500">*</span>
            </label>
            <input
              required
              type="text"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <IdCard className="w-3.5 h-3.5 text-text-tertiary" />
              DNI <span className="text-danger-500">*</span>
            </label>
            <input
              required
              type="text"
              value={dni}
              onChange={e => setDni(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <Mail className="w-3.5 h-3.5 text-text-tertiary" />
              Correo Electrónico <span className="text-danger-500">*</span>
            </label>
            <input
              required
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <Phone className="w-3.5 h-3.5 text-text-tertiary" />
              Celular <span className="text-text-muted font-normal text-xs">(Opcional)</span>
            </label>
            <input
              type="tel"
              value={celular}
              onChange={e => setCelular(e.target.value)}
              placeholder="+51"
              className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
            />
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
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingId ? "Guardar Cambios" : "Crear Solicitante"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Confirmar Eliminación"
        size="sm"
        variant="danger"
      >
        <div className="text-center -mt-2">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-danger-600" />
          </div>
          <p className="text-sm text-text-tertiary mb-6">
            ¿Estás seguro que deseas eliminar a <strong className="text-text-primary">{studentToDelete?.nombres}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setStudentToDelete(null)}
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
