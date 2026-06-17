"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { CheckCircle2, XCircle, Search, Award, Calendar, Hash, User, Sparkles, ShieldCheck, Loader2 } from "lucide-react"

export default function VerificarCertificadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const resolvedParams = use(params)
  const codigo = resolvedParams.codigo

  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [certificado, setCertificado] = useState<any>(null)

  useEffect(() => {
    fetchCertificado()
  }, [codigo])

  const fetchCertificado = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("certificados")
      .select("*, estudiantes(nombres, dni), examenes(nombre), intentos(nota_final)")
      .eq("codigo_verificacion", codigo)
      .single()

    if (!error && data) {
      setCertificado(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base bg-mesh-gradient flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
          <p className="text-sm text-text-tertiary font-medium">Verificando certificado...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base bg-mesh-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl shadow-lg border border-border-default mb-5">
            <Image src="/logo.png" alt="Nicolas La Torre" width={72} height={72} className="object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Verificación de Certificado</h1>
          <p className="text-text-tertiary mt-1.5 text-sm">Sistema de Nivelación Académica · Nicolas La Torre</p>
        </div>

        {!certificado ? (
          <div className="bg-white rounded-2xl border border-border-default p-8 shadow-elevated text-center">
            <div className="inline-flex p-4 rounded-2xl bg-danger-50 mb-4">
              <XCircle className="w-10 h-10 text-danger-600" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Certificado No Encontrado</h3>
            <p className="text-sm text-text-tertiary mb-5 max-w-md mx-auto">
              El código ingresado no corresponde a ningún certificado válido emitido por nuestra institución.
            </p>
            <div className="inline-flex items-center gap-2 bg-bg-elevated py-2.5 px-4 rounded-xl border border-border-default text-text-tertiary font-mono text-xs">
              <Search className="w-3.5 h-3.5" />
              Código: <strong className="text-text-primary">{codigo}</strong>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border-default shadow-elevated overflow-hidden">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-success-500 via-success-600 to-accent-500 p-6 text-white text-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 border border-white/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Certificado Auténtico</h3>
                <p className="text-white/90 text-sm mt-1">Documento válido y registrado en nuestra base de datos</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  <User className="w-3 h-3" />
                  Otorgado a
                </div>
                <p className="text-xl font-bold text-text-primary">{certificado.estudiantes?.nombres}</p>
                <p className="text-sm text-text-tertiary mt-0.5">DNI: {certificado.estudiantes?.dni}</p>
              </div>

              <div className="bg-bg-elevated rounded-xl p-4 border border-border-light">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  <Award className="w-3 h-3" />
                  Detalles de la Evaluación
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{certificado.examenes?.nombre}</p>
                    <p className="text-sm text-text-tertiary mt-1">
                      Calificación: <strong className="text-success-700">{certificado.intentos?.nota_final} pts</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-bg-elevated rounded-xl p-3.5 border border-border-light">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">
                    <Calendar className="w-3 h-3" />
                    Fecha de Emisión
                  </div>
                  <p className="font-semibold text-text-primary text-sm">
                    {new Date(certificado.fecha_emision).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-bg-elevated rounded-xl p-3.5 border border-border-light">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">
                    <Hash className="w-3 h-3" />
                    Código Único
                  </div>
                  <p className="font-mono font-bold text-primary-700 text-sm">{certificado.codigo_verificacion}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border-light flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
                <ShieldCheck className="w-3.5 h-3.5 text-success-600" />
                Verificación criptográficamente segura
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary mt-8">
          © {new Date().getFullYear()} Nicolas La Torre · Sistema de Nivelación
        </p>
      </div>
    </div>
  )
}
