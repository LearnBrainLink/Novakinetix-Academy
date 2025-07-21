"use client"

import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

interface BrandedHeaderProps {
  variant?: "default" | "dashboard" | "auth"
  showNavigation?: boolean
  showAuthButtons?: boolean
  className?: string
}

export function BrandedHeader({ 
  variant = "default", 
  showNavigation = true, 
  showAuthButtons = true,
  className = "" 
}: BrandedHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    { href: "/videos", label: "Videos" },
    { href: "/internships", label: "Internships" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <header className={`bg-white/95 backdrop-blur-sm shadow-brand border-b border-brand-light/30 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand Name */}
          <Link href="/" className="flex items-center gap-4 group">
            <Logo variant="nav" className="group-hover:scale-110 transition-transform duration-300" priority />
            {variant !== "auth" && (
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold brand-text-gradient">NOVAKINETIX</h1>
                <p className="text-sm font-semibold text-brand-secondary">ACADEMY</p>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-brand-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Buttons */}
          {showAuthButtons && (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign up">
                <Button className="button-primary">Get Started</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-brand-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && showNavigation && (
          <div className="md:hidden bg-white shadow-lg rounded-b-lg border-t border-brand-light/30">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:bg-brand-accent rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {showAuthButtons && (
                <div className="flex gap-2 px-3 py-2 pt-4 border-t border-brand-light/30">
                  <Link href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign up" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full button-primary">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 