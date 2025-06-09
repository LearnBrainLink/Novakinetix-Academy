import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/auth/callback",
  "/auth/auth-code-error",
]

// Define role-based route access
const roleBasedRoutes = {
  admin: ["/admin"],
  teacher: ["/teacher-dashboard"],
  student: ["/student-dashboard"],
  parent: ["/dashboard"],
}

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client configured to use cookies
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get the pathname of the request
    const path = request.nextUrl.pathname

    // Check if the route is public
    if (publicRoutes.includes(path)) {
      return res
    }

    // If no session and trying to access protected route, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirectTo", path)
      return NextResponse.redirect(redirectUrl)
    }

    // Get user role from the database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    const userRole = profile?.role || "student"

    // Check if user has access to the requested route
    const hasAccess = Object.entries(roleBasedRoutes).some(([role, routes]) => {
      if (role === userRole) {
        return routes.some((route) => path.startsWith(route))
      }
      return false
    })

    // If user doesn't have access, redirect to their dashboard
    if (!hasAccess) {
      const dashboardUrl = roleBasedRoutes[userRole as keyof typeof roleBasedRoutes]?.[0] || "/"
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
} 