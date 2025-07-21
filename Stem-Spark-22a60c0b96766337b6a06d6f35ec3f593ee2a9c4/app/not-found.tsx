import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Logo variant="hero" className="mx-auto mb-8" />
        
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-brand-primary mb-4">Page Not Found</h1>
          <p className="text-brand-secondary text-lg mb-8">
            The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="button-primary w-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
            <Link href="/videos">
              <Search className="w-4 h-4 mr-2" />
              Browse Videos
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-brand-secondary">
            Looking for something specific? <Link href="/contact" className="text-brand-primary hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}