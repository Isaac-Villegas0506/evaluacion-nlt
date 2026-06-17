"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, GraduationCap } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message || "Error al iniciar sesión")
      setIsLoading(false)
    } else {
      toast.success("¡Bienvenido!")
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col lg:flex-row relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />

      {/* LEFT SIDE - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold mb-6 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Sistema de Evaluación Académica
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Nicolas La Torre</h1>
                <p className="text-white/80 text-sm">Panel de Nivelación</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight mb-4">
              Evalúa, mide y certifica el conocimiento.
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-10">
              Plataforma integral para crear, asignar y gestionar evaluaciones académicas con resultados automáticos y certificados verificables.
            </p>

            <div className="space-y-3">
              {[
                "Creación de exámenes dinámicos",
                "Asignación rápida por DNI",
                "Certificados con código QR",
                "Resultados automáticos"
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-white/90 font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:hidden flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2 border border-border-default">
              <Image
                src="/logo.png"
                alt="Nicolas La Torre Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Iniciar sesión
            </h2>
            <p className="mt-1.5 text-sm text-text-tertiary">
              Accede al panel de administración
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <div className="bg-white py-8 px-6 sm:px-8 shadow-elevated rounded-2xl border border-border-default">
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="admin@nicolaslatorre.edu.pe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Ingresar al Sistema
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>

          <p className="mt-6 text-center text-xs text-text-tertiary">
            © {new Date().getFullYear()} Nicolas La Torre · Sistema de Nivelación
          </p>
        </div>
      </div>
    </div>
  )
}
