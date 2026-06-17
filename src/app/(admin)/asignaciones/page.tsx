"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import Link from "next/link"
import { Search, Plus, Trash2, X, SearchX, AlertTriangle, ClipboardList, Edit2, Copy, Eye, Send, CheckCircle2, Sparkles, IdCard, User, Phone, Mail, BookOpen, ChevronDown, XCircle, ArrowRight, ExternalLink } from "lucide-react"
import { Modal } from "@/components/ui/modal"

export default function SolicitudesPage() {
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [examenes, setExamenes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successData, setSuccessData] = useState<{ token: string, celular: string, nombre: string } | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null)
  const [asigToDelete, setAsigToDelete] = useState<any | null>(null)

  // Form state
  const [dni, setDni] = useState("")
  const [nombres, setNombres] = useState("")
  const [correo, setCorreo] = useState("")
  const [celular, setCelular] = useState("")
  const [selectedExamen, setSelectedExamen] = useState("")
  const [saving, setSaving] = useState(false)
  const [isSearchingDni, setIsSearchingDni] = useState(false)

  const supabase = createClient()

  const fetchInitialData = async () => {
    const { data: exRes } = await supabase.from("examenes").select("id, nombre").order("nombre")
    setExamenes(exRes || [])
  }

  const fetchAsignaciones = async () => {
    setLoading(true)
    let query = supabase.from("asignaciones")
      .select("*, estudiantes(nombres, dni, celular, correo), examenes(nombre)")
      .order("fecha_asignacion", { ascending: false })

    const { data, error } = await query

    if (error) {
      toast.error("Error al cargar solicitudes")
    } else {
      let filteredData = data || []
      if (search) {
        const s = search.toLowerCase()
        filteredData = filteredData.filter((a: any) =>
          a.estudiantes?.nombres?.toLowerCase().includes(s) ||
          a.estudiantes?.dni?.includes(s) ||
          a.examenes?.nombre?.toLowerCase().includes(s)
        )
      }
      setAsignaciones(filteredData)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchAsignaciones()
  }, [search])

  const handleSearchDni = async (searchDni: string) => {
    if (searchDni.length !== 8) return;
    setIsSearchingDni(true);
    try {
      const res = await fetch(`https://api.perudevs.com/api/v1/dni/simple?document=${searchDni}&key=cGVydWRldnMucHJvZHVjdGlvbi5maXRjb2RlcnMuNmEzMTYzZTcxYzlhY2M1YmI0MjI2YzJj`);
      const data = await res.json();
      if (data.estado) {
        setNombres(data.resultado.nombre_completo);
        toast.success("Datos encontrados");
      } else {
        toast.error("DNI no encontrado en el sistema");
        setNombres("");
      }
    } catch (error) {
      toast.error("Error al consultar DNI");
    } finally {
      setIsSearchingDni(false);
    }
  };

  useEffect(() => {
    if (dni.length === 8) {
      handleSearchDni(dni);
    } else {
      setNombres("");
    }
  }, [dni]);

  const handleOpenModal = () => {
    setDni("")
    setNombres("")
    setCorreo("")
    setCelular("")
    setSelectedExamen("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dni || !nombres || !selectedExamen || !celular) {
      toast.error("Faltan datos obligatorios")
      return
    }

    const emailToSave = correo.trim() || `${dni}@sin-correo.com`

    setSaving(true)

    let estudianteId = null
    const { data: existingEstudiante } = await supabase.from("estudiantes").select("id").eq("dni", dni).single()

    if (existingEstudiante) {
      estudianteId = existingEstudiante.id
      const updateData: any = {}
      if (correo.trim()) updateData.correo = emailToSave
      if (celular.trim()) updateData.celular = celular
      if (nombres.trim()) updateData.nombres = nombres

      if (Object.keys(updateData).length > 0) {
        await supabase.from("estudiantes").update(updateData).eq("id", estudianteId)
      }
    } else {
      const { data: newEstudiante, error: estError } = await supabase.from("estudiantes").insert([{
        dni, nombres, correo: emailToSave, celular
      }]).select().single()

      if (estError || !newEstudiante) {
        toast.error("Error al registrar datos de la persona")
        setSaving(false)
        return
      }
      estudianteId = newEstudiante.id
    }

    const { data: existingAsig } = await supabase.from("asignaciones")
      .select("id")
      .eq("estudiante_id", estudianteId)
      .eq("examen_id", selectedExamen)
      .single()

    if (existingAsig) {
      toast.error("La persona ya tiene asignado este examen")
      setSaving(false)
      return
    }

    const { data: nuevaAsignacion, error } = await supabase.from("asignaciones").insert([{
      estudiante_id: estudianteId,
      examen_id: selectedExamen
    }]).select().single()

    if (error || !nuevaAsignacion) {
      toast.error("Error al crear solicitud")
    } else {
      setIsModalOpen(false)
      setSuccessData({ token: nuevaAsignacion.token_unico, celular, nombre: nombres })
      fetchAsignaciones()
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!asigToDelete) return
    const { error } = await supabase.from("asignaciones").delete().eq("id", asigToDelete.id)
    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Solicitud eliminada")
      setAsigToDelete(null)
      fetchAsignaciones()
    }
  }

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/examen/${token}`
    navigator.clipboard.writeText(url)
    toast.success("Enlace copiado al portapapeles")
  }

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

  return (
    <div className="flex flex-col gap-6 pb-20 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-border-default shadow-card gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full pl-10 pr-4 h-10 bg-bg-elevated border border-transparent rounded-xl text-sm text-text-primary focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-text-muted"
            placeholder="Buscar por DNI, nombres o examen..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={handleOpenModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 text-sm font-semibold px-5 h-10 rounded-xl shadow-sm shadow-primary-600/30 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Solicitud
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-border-default overflow-hidden shadow-card flex flex-col">
          <div className="px-6 py-5 border-b border-border-light flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary-600 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-text-primary">Cargando solicitudes...</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated border-b border-border-light">
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-border-default rounded animate-pulse" /></th>
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-border-default rounded animate-pulse" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="px-6 py-4"><div className="h-8 w-48 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-bg-elevated rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-bg-elevated rounded-full animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-32 bg-bg-elevated rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-default shadow-card flex flex-col items-center justify-center p-12 min-h-[400px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center mb-5">
            <SearchX className="w-7 h-7 text-primary-600" />
          </div>
          <h4 className="text-lg font-bold text-text-primary mb-2">No se encontraron solicitudes</h4>
          <p className="text-sm text-text-tertiary max-w-sm mb-6">
            Crea una nueva solicitud para asignar un examen a un postulante.
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
              <h3 className="text-base font-bold text-text-primary">Lista de Solicitudes</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Solicitudes y enlaces generados</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full">
              <ClipboardList className="w-3.5 h-3.5" />
              Total: {asignaciones.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-light">
                  <th className="px-6 py-3.5">Solicitante / DNI</th>
                  <th className="px-6 py-3.5">Examen</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5">Enlace Único</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm text-text-secondary">
                {asignaciones.map((asig) => {
                  const badge = estadoBadge(asig.estado)
                  return (
                    <tr key={asig.id} className="border-b border-border-light hover:bg-bg-elevated/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                            {asig.estudiantes?.nombres?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{asig.estudiantes?.nombres}</div>
                            <div className="text-xs text-text-tertiary font-mono mt-0.5">{asig.estudiantes?.dni}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-medium">{asig.examenes?.nombre}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {asig.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-bg-elevated px-2.5 py-1.5 rounded-lg text-text-tertiary font-mono">
                            ...{asig.token_unico.slice(-8)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(asig.token_unico)}
                            className="p-1.5 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                            title="Copiar Enlace"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1 items-center">
                          <button
                            onClick={() => setSelectedDetails(asig)}
                            className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {asig.estado === 'pendiente_revision' && (
                            <Link
                              href={`/asignaciones/${asig.id}/revisar`}
                              className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-bold bg-warning-500 text-white rounded-lg hover:bg-warning-600 transition-colors shadow-sm"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Revisar
                            </Link>
                          )}
                          <button
                            onClick={() => setAsigToDelete(asig)}
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

      {/* Modal Nueva Solicitud */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Solicitud"
        description="Ingresa el DNI para generar una nueva asignación de examen."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <IdCard className="w-3.5 h-3.5 text-text-tertiary" />
              DNI <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                required
                maxLength={8}
                placeholder="Ingrese DNI (8 dígitos)"
                value={dni}
                onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all font-mono pr-10"
              />
              {isSearchingDni && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              )}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <User className="w-3.5 h-3.5 text-text-tertiary" />
              Nombres y Apellidos <span className="text-danger-500">*</span>
            </label>
            <input
              required
              placeholder={isSearchingDni ? "Buscando en la base de datos..." : "Se completará automáticamente si existe el DNI"}
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              disabled={isSearchingDni}
              className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-bg-elevated text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 focus:bg-white transition-all disabled:opacity-70"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
                <Phone className="w-3.5 h-3.5 text-text-tertiary" />
                Celular <span className="text-danger-500">*</span>
              </label>
              <input
                required
                type="tel"
                placeholder="Para enviar por WhatsApp"
                value={celular}
                onChange={e => setCelular(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
                <Mail className="w-3.5 h-3.5 text-text-tertiary" />
                Correo <span className="text-text-muted font-normal text-xs">(Opcional)</span>
              </label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-text-tertiary" />
              Examen a Asignar <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={selectedExamen}
                onChange={e => setSelectedExamen(e.target.value)}
                className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition-all appearance-none"
              >
                <option value="" disabled>Selecciona un examen de la lista...</option>
                {examenes.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
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
                  Generar Solicitud
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Éxito */}
      <Modal
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        title="¡Solicitud Generada!"
        size="sm"
        variant="success"
      >
        <div className="text-center -mt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-emerald flex items-center justify-center mx-auto mb-4 shadow-lg shadow-success-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-text-tertiary mb-1">
            Evaluación asignada correctamente a
          </p>
          <p className="text-base font-bold text-text-primary mb-5">
            {successData?.nombre}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => copyToClipboard(successData!.token)}
              className="w-full inline-flex items-center justify-center gap-2 bg-text-primary text-white hover:bg-text-secondary text-sm font-semibold px-4 h-11 rounded-xl transition-all shadow-sm"
            >
              <Copy className="w-4 h-4" />
              Copiar Enlace
            </button>
            <button
              onClick={() => {
                if (successData?.celular) {
                  const url = `${window.location.origin}/examen/${successData.token}`
                  const text = encodeURIComponent(`Hola, se ha generado tu evaluación. Puedes acceder aquí: ${url}`)
                  let cleanPhone = successData.celular.replace(/\D/g, '')
                  if (!cleanPhone.startsWith('51') && cleanPhone.length === 9) {
                    cleanPhone = '51' + cleanPhone;
                  }
                  window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank")
                } else {
                  toast.error("No se ingresó número de celular para enviar")
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#1DA851] text-sm font-semibold px-4 h-11 rounded-xl transition-all shadow-sm shadow-[#25D366]/30"
            >
              <ExternalLink className="w-4 h-4" />
              Enviar por WhatsApp
            </button>
            <button
              onClick={() => setSuccessData(null)}
              className="w-full inline-flex items-center justify-center text-sm font-semibold text-text-tertiary hover:text-text-primary hover:bg-bg-elevated px-4 h-11 rounded-xl transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalles */}
      <Modal
        isOpen={!!selectedDetails}
        onClose={() => setSelectedDetails(null)}
        title="Detalles de la Solicitud"
        description="Información completa de la asignación."
        size="xl"
      >
        {selectedDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-bg-elevated p-4 rounded-xl">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">DNI</p>
                <p className="font-semibold text-text-primary text-sm">{selectedDetails.estudiantes?.dni}</p>
              </div>
              <div className="bg-bg-elevated p-4 rounded-xl md:col-span-2">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Solicitante</p>
                <p className="font-semibold text-text-primary text-sm">{selectedDetails.estudiantes?.nombres}</p>
              </div>
              <div className="bg-bg-elevated p-4 rounded-xl">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Estado</p>
                <p className={`font-semibold text-sm capitalize ${selectedDetails.estado === 'aprobado' ? 'text-success-700' :
                  selectedDetails.estado === 'desaprobado' ? 'text-danger-600' :
                    selectedDetails.estado === 'pendiente_revision' ? 'text-warning-600' :
                      selectedDetails.estado === 'en_progreso' ? 'text-info-600' :
                        'text-text-tertiary'
                  }`}>
                  {selectedDetails.estado.replace('_', ' ')}
                </p>
              </div>
              <div className="bg-bg-elevated p-4 rounded-xl">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Celular</p>
                <p className="font-semibold text-text-primary text-sm">{selectedDetails.estudiantes?.celular || "No registrado"}</p>
              </div>
              <div className="bg-bg-elevated p-4 rounded-xl">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Correo</p>
                <p className="font-semibold text-text-primary text-sm truncate" title={selectedDetails.estudiantes?.correo}>{selectedDetails.estudiantes?.correo}</p>
              </div>
              <div className="bg-bg-elevated p-4 rounded-xl md:col-span-2">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Examen Asignado</p>
                <p className="font-semibold text-text-primary text-sm">{selectedDetails.examenes?.nombre}</p>
              </div>
              <div className="bg-bg-elevated p-4 rounded-xl">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Fecha de Asignación</p>
                <p className="font-semibold text-text-primary text-sm">{new Date(selectedDetails.fecha_asignacion).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-light">
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Enlace Directo Seguro</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-bg-elevated px-3.5 py-3 rounded-xl text-xs text-text-secondary break-all font-mono">
                  {`${window.location.origin}/examen/${selectedDetails.token_unico}`}
                </code>
                <button
                  onClick={() => copyToClipboard(selectedDetails.token_unico)}
                  className="p-3 bg-white border border-border-default text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-border-light">
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-5 h-10 bg-white border border-border-default text-text-secondary font-semibold text-sm rounded-xl hover:bg-bg-elevated transition-colors"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!asigToDelete}
        onClose={() => setAsigToDelete(null)}
        title="Confirmar Eliminación"
        size="sm"
        variant="danger"
      >
        <div className="text-center -mt-2">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-danger-600" />
          </div>
          <p className="text-sm text-text-tertiary mb-6">
            ¿Eliminar la solicitud de <strong className="text-text-primary">{asigToDelete?.estudiantes?.nombres}</strong>?
            El postulante ya no podrá acceder a la evaluación.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setAsigToDelete(null)}
              className="px-4 h-10 rounded-xl text-sm font-semibold text-text-tertiary hover:bg-bg-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-danger-500 text-white text-sm font-semibold hover:bg-danger-600 transition-all shadow-sm shadow-danger-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Solicitud
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
