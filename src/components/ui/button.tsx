"use client"
import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "./input"

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "default" | "outline" | "ghost" | "danger" | "success" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {

    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap"

    const variants = {
      default: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md shadow-primary-600/20",
      secondary: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-md shadow-accent-500/20",
      outline: "border border-border-default bg-white hover:bg-bg-elevated text-text-primary hover:border-border-strong",
      ghost: "bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary",
      danger: "bg-danger-500 text-white hover:bg-danger-600 shadow-sm hover:shadow-md shadow-danger-500/20",
      success: "bg-success-500 text-white hover:bg-success-600 shadow-sm hover:shadow-md shadow-success-500/20",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs rounded-lg",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        <span className="inline-flex items-center">{children as React.ReactNode}</span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
