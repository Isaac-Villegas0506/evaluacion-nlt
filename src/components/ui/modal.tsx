"use client"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "./input"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "success" | "danger"
}

export function Modal({ isOpen, onClose, title, description, children, size = "md", variant = "default" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  const accentColors = {
    default: "from-primary-500 to-accent-500",
    success: "from-success-500 to-accent-500",
    danger: "from-danger-500 to-orange-500",
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
              className={cn(
                "bg-white border border-border-default shadow-elevated rounded-2xl w-full pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] relative",
                sizeClasses[size]
              )}
            >
              {/* Top accent bar */}
              <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", accentColors[variant])} />

              <div className="flex items-start justify-between p-6 border-b border-border-light">
                <div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight">{title}</h2>
                  {description && (
                    <p className="text-sm text-text-tertiary mt-1">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors -mt-1 -mr-1"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
