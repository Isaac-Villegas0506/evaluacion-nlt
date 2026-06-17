"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import toast from "react-hot-toast"
import { CertificateDownloadButton } from "@/components/certificate/certificate-downloader"
import { AlertCircle, CheckCircle2, Clock, GraduationCap, IdCard, Loader2, PlayCircle, Sparkles, User, XCircle, FileText, Award } from "lucide-react"

export default function ExamenWelcomePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const token = resolvedParams.token
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [asignacion, setAsignacion] = useState<any>(null)
  const [certificado, setCertificado] = useState<any>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchAsignacion()
  }, [token])

  const fetchAsignacion = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("asignaciones")
      .select("*, estudiantes(nombres, dni), examenes(nombre, descripcion, duracion_minutos)")
      .eq("token_unico", token)
      .single()

    if (error || !data) {
      toast.error("Enlace no válido o expirado")
    } else {
      setAsignacion(data)

      if (data.estado === 'aprobado') {
        const { data: certData } = await supabase.from("certificados").select("codigo_verificacion").eq("asignacion_id", data.id).single()
        if (!certData) {
          const { data: altCert } = await supabase.from("certificados")
            .select("codigo_verificacion")
            .eq("estudiante_id", data.estudiante_id)
            .eq("examen_id", data.examen_id)
            .single()
          if (altCert) setCertificado(altCert)
        } else {
          setCertificado(certData)
        }
      }

      if (data.estado === 'en_progreso') {
        router.replace(`/examen/${token}/resolver`)
      }
    }
    setLoading(false)
  }

  const handleStartExam = async () => {
    setStarting(true)
    const { error: updError } = await supabase.from("asignaciones").update({ estado: 'en_progreso' }).eq("id", asignacion.id)
    if (updError) {
      toast.error("Error al iniciar el examen. Asegúrate de tener permisos o intenta nuevamente.")
      console.error(updError)
      setStarting(false)
      return
    }

    const { error: intError } = await supabase.from("intentos").insert({
      asignacion_id: asignacion.id,
      fecha_inicio: new Date().toISOString()
    })

    if (intError) {
      toast.error("Error al registrar el intento")
      console.error(intError)
      setStarting(false)
      return
    }

    router.replace(`/examen/${token}/resolver`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
          <p className="text-sm text-text-tertiary font-medium">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (!asignacion) {
    return (
      <div className="min-h-screen bg-bg-base bg-mesh-gradient flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-elevated border border-border-default p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-danger-600" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Enlace Inválido</h1>
          <p className="text-sm text-text-tertiary">
            El enlace del examen no existe o ha sido eliminado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base bg-mesh-gradient pt-6 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto relative z-10 mt-2 sm:mt-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl shadow-lg border border-border-default mb-4">
            <Image src="/logo.png" alt="Nicolas La Torre" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Nicolas La Torre</h1>
          <p className="text-text-tertiary mt-1 text-sm">Sistema de Nivelación Académica</p>
        </div>

        <div className="bg-white rounded-2xl border border-border-default p-5 sm:p-8 shadow-elevated">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              Bienvenido(a)
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-text-primary uppercase tracking-tight">{asignacion.estudiantes?.nombres}</p>
            <div className="inline-flex items-center gap-1.5 text-text-tertiary font-medium text-xs mt-1.5">
              <IdCard className="w-3.5 h-3.5" />
              DNI: {asignacion.estudiantes?.dni}
            </div>
          </div>

          <div className="bg-bg-elevated rounded-xl p-5 border border-border-light mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-text-primary mb-1">{asignacion.examenes?.nombre}</h3>
                {asignacion.examenes?.descripcion && (
                  <p className="text-xs text-text-tertiary leading-relaxed">{asignacion.examenes?.descripcion}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-light flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-primary bg-white px-3 py-1.5 rounded-lg border border-border-default">
                <Clock className="w-3.5 h-3.5 text-primary-600" />
                Duración: {asignacion.examenes?.duracion_minutos} min
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-primary bg-white px-3 py-1.5 rounded-lg border border-border-default">
                <Award className="w-3.5 h-3.5 text-primary-600" />
                Aprobatorio: {asignacion.examenes?.nota_minima} pts
              </div>
            </div>
          </div>

          {asignacion.estado === 'pendiente' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-warning-50 border border-warning-100 p-4 rounded-xl">
                <AlertCircle className="w-5 h-5 text-warning-600 shrink-0" />
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  Una vez que inicies el examen, comenzará el conteo de tiempo y <strong className="font-bold text-text-primary">no podrá pausarse</strong>.
                </p>
              </div>
              <button
                onClick={handleStartExam}
                disabled={starting}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white hover:shadow-lg text-base font-bold py-3.5 rounded-xl shadow-md shadow-primary-600/30 transition-all disabled:opacity-70"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Comenzar Evaluación
                  </>
                )}
              </button>
            </div>
          )}

          {asignacion.estado === 'pendiente_revision' && (
            <div className="text-center py-8 bg-warning-50 rounded-xl border border-warning-100">
              <div className="inline-flex p-3 rounded-2xl bg-white shadow-sm text-warning-600 mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Examen en Revisión</h3>
              <p className="text-sm text-text-tertiary max-w-sm mx-auto">Tus respuestas de desarrollo están siendo evaluadas. Vuelve más tarde para ver tus resultados.</p>
            </div>
          )}

          {asignacion.estado === 'aprobado' && (
            <div className="text-center py-8 bg-gradient-to-br from-success-50 to-accent-50 rounded-xl border border-success-500/20">
              <h3 className="text-2xl font-bold text-text-primary mb-2">¡Felicitaciones!</h3>
              <p className="text-sm text-text-tertiary mb-6 max-w-sm mx-auto">Has aprobado satisfactoriamente la evaluación.</p>
              <CertificateDownloadButton
                data={{
                  studentName: asignacion.estudiantes?.nombres || "",
                  studentDni: asignacion.estudiantes?.dni || "",
                  examName: asignacion.examenes?.nombre || "",
                  score: "Aprobado",
                  date: new Date().toLocaleDateString('es-PE'),
                  verificationCode: certificado?.codigo_verificacion || "POR-GENERAR",
                  verifyUrl: `${window.location.origin}/verificar/${certificado?.codigo_verificacion || ''}`,
                  qrDataUrl: ""
                }}
              />
            </div>
          )}

          {asignacion.estado === 'desaprobado' && (
            <div className="text-center py-8 bg-danger-50 rounded-xl border border-danger-100">
              <div className="inline-flex p-3 rounded-2xl bg-white shadow-sm text-danger-600 mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Examen No Aprobado</h3>
              <p className="text-sm text-text-tertiary max-w-sm mx-auto">No alcanzaste el puntaje mínimo. Comunícate con la institución para más información.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
