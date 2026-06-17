import Link from "next/link"
import { GraduationCap, ShieldCheck, Sparkles, ArrowRight, Award, FileText, Users, ClipboardList } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-base bg-mesh-gradient relative overflow-x-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 md:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-md shadow-primary-600/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-text-primary font-bold text-base leading-tight">Nicolas La Torre</p>
              <p className="text-text-tertiary text-[10px] font-semibold uppercase tracking-widest">Sistema de Nivelación</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary-600 transition-colors"
          >
            Iniciar sesión
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-border-default rounded-full px-4 py-1.5 text-xs font-semibold text-primary-700 mb-6 shadow-soft">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma de Evaluación Académica
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-primary max-w-4xl leading-[1.05]">
            Evalúa, mide y{" "}
            <span className="text-gradient">certifica el conocimiento.</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-text-tertiary max-w-2xl leading-relaxed">
            Plataforma integral para crear, asignar y gestionar evaluaciones académicas con resultados automáticos y certificados verificables.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 text-base font-bold px-7 py-3.5 rounded-xl shadow-md shadow-primary-600/30 hover:shadow-lg transition-all"
            >
              Acceder al Panel
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-white text-text-primary hover:bg-bg-elevated border border-border-default text-base font-semibold px-7 py-3.5 rounded-xl transition-all"
            >
              Conocer más
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 md:px-12 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Funcionalidades</h2>
              <p className="text-text-tertiary mt-2 text-sm">Una solución completa para gestión académica</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: FileText,
                  title: "Exámenes Dinámicos",
                  description: "Crea evaluaciones con preguntas de opción múltiple, verdadero/falso y desarrollo.",
                  color: "from-primary-500 to-violet"
                },
                {
                  icon: Users,
                  title: "Asignación por DNI",
                  description: "Genera enlaces únicos para cada postulante con autocompletado de datos.",
                  color: "from-accent-500 to-sky"
                },
                {
                  icon: ClipboardList,
                  title: "Resultados Automáticos",
                  description: "Calificación instantánea y almacenamiento seguro de respuestas.",
                  color: "from-warning-500 to-orange"
                },
                {
                  icon: Award,
                  title: "Certificados Verificables",
                  description: "Emite certificados con códigos QR únicos y validación pública.",
                  color: "from-success-500 to-emerald"
                }
              ].map((feat, i) => {
                const Icon = feat.icon
                return (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-border-default shadow-card hover:shadow-elevated transition-all hover:-translate-y-1">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-1.5">{feat.title}</h3>
                    <p className="text-xs text-text-tertiary leading-relaxed">{feat.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Trust badge */}
            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-text-tertiary">
              <ShieldCheck className="w-3.5 h-3.5 text-success-600" />
              Seguridad y privacidad garantizada
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-6 border-t border-border-light text-center text-xs text-text-tertiary">
          © {new Date().getFullYear()} Nicolas La Torre · Sistema de Nivelación Académica
        </footer>
      </main>
    </div>
  )
}
