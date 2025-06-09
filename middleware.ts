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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not /login,
  // redirect the user to /login
  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and the current path is /login,
  // redirect the user to /admin
  if (session && req.nextUrl.pathname === '/login') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/admin'
    return NextResponse.redirect(redirectUrl)
  }

  // Get the pathname of the request
  const path = req.nextUrl.pathname

  // Check if the route is public
  if (publicRoutes.includes(path)) {
    return res
  }

  // If no session and trying to access protected route, redirect to login
  if (!session) {
    const redirectUrl = new URL("/login", req.url)
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
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  return res
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
    '/admin/:path*',
    '/login',
  ],
} 