"use client"
import { motion } from "framer-motion"
import { ArrowUpRight, ClipboardList, CheckCircle2, Clock, XCircle, Users, FileText, GraduationCap, Award, LucideIcon } from "lucide-react"
import { cn } from "../ui/input"

const ICONS: Record<string, LucideIcon> = {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  FileText,
  GraduationCap,
  Award,
}

interface StatsCardProps {
  title: string
  value: string | number
  iconName: string
  colorClass: string
  delay?: number
}

export function StatsCard({ title, value, iconName, colorClass, delay = 0 }: StatsCardProps) {
  const Icon = ICONS[iconName] || ClipboardList

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden bg-white rounded-2xl border border-border-default shadow-card hover:shadow-elevated transition-all p-6 group cursor-pointer"
    >
      {/* Background gradient accent */}
      <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.08] blur-2xl group-hover:opacity-20 transition-opacity bg-gradient-to-br", colorClass)} />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm", colorClass)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-text-muted" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-sm font-medium text-text-tertiary mb-1">{title}</p>
        <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
      </div>
    </motion.div>
  )
}
