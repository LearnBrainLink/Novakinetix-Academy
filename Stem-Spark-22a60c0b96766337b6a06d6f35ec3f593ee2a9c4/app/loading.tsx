import { Logo } from "@/components/logo"

export default function Loading() {
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center">
      <div className="text-center">
        <Logo variant="large" className="mx-auto mb-8 animate-pulse" />
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-brand-primary rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-brand-secondary font-medium mt-4">Loading NOVAKINETIX ACADEMY...</p>
      </div>
    </div>
  )
}