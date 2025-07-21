"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "./logo"
import Link from "next/link"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

interface BrandedErrorProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  showRetryButton?: boolean
  onRetry?: () => void
  className?: string
}

export function BrandedError({ 
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  showHomeButton = true,
  showRetryButton = true,
  onRetry,
  className = "" 
}: BrandedErrorProps) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white ${className}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <Logo variant="hero" className="mb-8" />
        
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-brand-primary mb-4">{title}</h1>
        <p className="text-brand-secondary mb-8 leading-relaxed">{message}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {showHomeButton && (
            <Button asChild className="button-primary">
              <Link href="/" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          )}
          
          {showRetryButton && (
            <Button 
              variant="outline" 
              className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 