"use client"

import { Logo } from "./logo"

interface BrandedLoadingProps {
  message?: string
  variant?: "full" | "compact" | "inline"
  className?: string
}

export function BrandedLoading({ 
  message = "Loading...", 
  variant = "full",
  className = "" 
}: BrandedLoadingProps) {
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-brand-secondary">{message}</span>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <Logo variant="icon" className="mb-4" />
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-brand-secondary font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white ${className}`}>
      <div className="text-center">
        <Logo variant="hero" className="mb-8" />
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-brand-primary mb-2">{message}</h2>
        <p className="text-brand-secondary">Please wait while we prepare your experience</p>
      </div>
    </div>
  )
} 