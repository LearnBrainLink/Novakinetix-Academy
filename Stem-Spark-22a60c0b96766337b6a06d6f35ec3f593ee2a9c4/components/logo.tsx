"use client"

import { useState } from "react"
import Image from "next/image"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  variant?: "full" | "icon" | "large" | "hero" | "mega" | "nav" | "footer"
  priority?: boolean
  showText?: boolean
}

export function Logo({ 
  width = 80, 
  height = 80, 
  className = "", 
  variant = "full", 
  priority = false,
  showText = true 
}: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Using the reliable Vercel Blob storage URL for the logo
  const imageUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_uSjHMZ5APpAraKF1Lic1G4AGtkSp/JTF_jNyHM1gcyC1s67kbFh/public/images/novakinetix-logo.png"

  // Get dimensions based on variant with optimized sizes for different contexts
  const getDimensions = () => {
    switch (variant) {
      case "mega":
        return { width: 500, height: 300 } // Optimized for hero sections
      case "hero":
        return { width: 400, height: 200 } // Large but not overwhelming
      case "large":
        return { width: 250, height: 100 } // Standard large size
      case "nav":
        return { width: 180, height: 80 } // Navigation optimized
      case "footer":
        return { width: 200, height: 100 } // Footer size
      case "full":
        return { width: width || 150, height: height || 150 }
      case "icon":
        return { width: width || 60, height: height || 60 }
      default:
        return { width, height }
    }
  }

  const dimensions = getDimensions()

  // Enhanced fallback SVG logo with better styling
  const FallbackLogo = () => (
    <div className={`relative ${className}`} style={{ width: dimensions.width, height: dimensions.height }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        {/* Background circle for better visibility */}
        <circle cx="200" cy="200" r="190" fill="white" opacity="0.9" />
        
        {/* Main logo elements */}
        <path d="M200 80L120 110L200 140L280 110L200 80Z" fill="#2563EB" stroke="#1E40AF" strokeWidth="4" />
        <rect x="190" y="70" width="20" height="30" fill="#1E40AF" />
        <circle cx="285" cy="110" r="8" fill="#1E40AF" />
        <circle cx="200" cy="170" r="30" fill="#3B82F6" />
        <path d="M200 200L160 240L160 280L180 280L180 330L220 330L220 280L240 280L240 240L200 200Z" fill="#60A5FA" />
        <path d="M160 240L130 220L140 210L170 230" fill="#60A5FA" />
        <path d="M240 240L270 220L260 210L230 230" fill="#60A5FA" />
        <path d="M80 170L84 182L96 182L86 190L90 202L80 194L70 202L74 190L64 182L76 182L80 170Z" fill="#2563EB" />
        <path
          d="M320 170L324 182L336 182L326 190L330 202L320 194L310 202L314 190L304 182L316 182L320 170Z"
          fill="#2563EB"
        />
        
        {/* Text elements - only show if showText is true */}
        {showText && (
          <>
            <text
              x="200"
              y="360"
              textAnchor="middle"
              fill="#2563EB"
              fontSize="28"
              fontWeight="bold"
              fontFamily="Inter, sans-serif"
            >
              NOVAKINETIX
            </text>
            <text
              x="200"
              y="385"
              textAnchor="middle"
              fill="#3B82F6"
              fontSize="20"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              ACADEMY
            </text>
          </>
        )}
      </svg>
    </div>
  )

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  if (imageError) {
    return <FallbackLogo />
  }

  return (
    <div
      className={`relative ${className} ${variant === 'nav' ? 'header-logo' : ''}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={imageUrl || "/placeholder.svg"}
        alt="NOVAKINETIX ACADEMY"
        width={dimensions.width}
        height={dimensions.height}
        className={`object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${variant === 'nav' ? 'header-logo' : ''} drop-shadow-lg`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority || variant === 'nav'}
      />
    </div>
  )
}
