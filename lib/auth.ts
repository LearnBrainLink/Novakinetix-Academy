"use server"

import { createServerClient } from "./supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { roleManager, type UserRole } from "./role-manager"

interface AuthResult {
  success?: boolean
  error?: string
  message?: string
  redirectUrl?: string
  requiresVerification?: boolean
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to handle auth errors
function handleAuthError(error: any): AuthResult {
  console.error("❌ Auth error:", error.message)

  if (error.message.includes("Email not confirmed")) {
    return {
      error: "Please verify your email address before signing in. Check your inbox for the confirmation email.",
      requiresVerification: true,
    }
  }

  if (error.message.includes("Invalid login credentials")) {
    return { error: "Invalid email or password. Please check your credentials and try again." }
  }

  return { error: error.message }
}

// Sign in with email and password
export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Input validation
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address" }
  }

  try {
    console.log(`🔐 Attempting login for: ${email}`)
    const supabase = createServerClient()

    // Attempt authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (authError) {
      return handleAuthError(authError)
    }

    if (!authData.user) {
      return { error: "Authentication failed. Please try again." }
    }

    console.log(`✅ User authenticated: ${authData.user.id}`)

    // Check email verification
    if (!authData.user.email_confirmed_at) {
      await supabase.auth.signOut()
      return {
        error: "Please verify your email address before signing in. Check your inbox for the verification email.",
        requiresVerification: true,
      }
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error("❌ No profile found for user:", profileError)
      return { error: "User profile not found. Please contact support." }
    }

    const userRole = profile.role as UserRole
    console.log(`👤 User role: ${userRole}`)

    // Log successful login activity
    try {
      await supabase.from("user_activities").insert({
        user_id: authData.user.id,
        activity_type: "login",
        activity_description: "Successful email login",
        metadata: {
          timestamp: new Date().toISOString(),
          role: userRole,
          login_method: "email",
        },
      })
    } catch (activityError) {
      console.error("⚠️ Activity logging failed:", activityError)
    }

    // Update last login timestamp
    try {
      await supabase
        .from("profiles")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified: true,
        })
        .eq("id", authData.user.id)
    } catch (updateError) {
      console.error("⚠️ Profile update failed:", updateError)
    }

    console.log(`🎉 Login successful for ${email}`)

    // Set session cookie
    if (authData.session) {
      const cookieStore = await cookies()
      cookieStore.set("supabase-auth-token", JSON.stringify(authData.session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })
    }

    // Revalidate paths
    revalidatePath("/")

    // Determine redirect URL based on role
    const redirectUrl = roleManager.getDashboardUrl(userRole)

    return {
      success: true,
      message: "Login successful! Redirecting to your dashboard...",
      redirectUrl,
    }
  } catch (error) {
    console.error("💥 Unexpected login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign up with email and password
export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const fullName = formData.get("fullName") as string
  const role = (formData.get("role") as UserRole) || "student"
  const grade = formData.get("grade") as string
  const country = formData.get("country") as string
  const state = formData.get("state") as string
  const schoolName = formData.get("schoolName") as string

  // Validation
  if (!email || !password || !confirmPassword || !fullName) {
    return { error: "All required fields must be filled" }
  }

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" }
  }

  if (!["student", "teacher", "parent"].includes(role)) {
    return { error: "Invalid role selected" }
  }

  // Additional validation for students
  if (role === "student" && !grade) {
    return { error: "Grade is required for students" }
  }

  try {
    console.log(`🚀 Starting signup for ${email} as ${role}`)
    const supabase = createServerClient()

    // Check if email already exists
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: "dummy-password",
    })

    if (existingUser?.user) {
      return { error: "An account with this email already exists" }
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (error) {
      console.error("❌ Signup error:", error)
      return { error: error.message }
    }

    if (!data.user) {
      return { error: "Failed to create account. Please try again." }
    }

    console.log(`✅ User created in auth: ${data.user.id}`)

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: email.toLowerCase().trim(),
      full_name: fullName,
      role: role,
      grade: role === "student" ? grade : null,
      country: country,
      state: state,
      school_name: schoolName,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("❌ Profile creation error:", profileError)
      // Clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(data.user.id)
      return { error: "Failed to create profile. Please try again." }
    }

    console.log(`✅ Profile created for ${role}`)

    // Log signup activity
    try {
      await supabase.from("user_activities").insert({
        user_id: data.user.id,
        activity_type: "signup",
        activity_description: "New account created",
        metadata: {
          timestamp: new Date().toISOString(),
          role: role,
          signup_method: "email",
        },
      })
    } catch (activityError) {
      console.error("⚠️ Activity logging failed:", activityError)
    }

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
      requiresVerification: true,
    }
  } catch (error) {
    console.error("💥 Unexpected signup error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    console.log("🔐 Initiating Google OAuth login")
    const supabase = createServerClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.error("❌ Google OAuth error:", error)
      return handleAuthError(error)
    }

    console.log("✅ Google OAuth initiated successfully")
    return {
      success: true,
      redirectUrl: data.url,
      message: "Redirecting to Google for authentication...",
    }
  } catch (error) {
    console.error("💥 Unexpected Google OAuth error:", error)
    return { error: "Failed to initiate Google login. Please try again." }
  }
}

// Sign in with GitHub
export async function signInWithGitHub(): Promise<AuthResult> {
  try {
    console.log("🔐 Initiating GitHub OAuth login")
    const supabase = createServerClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error("❌ GitHub OAuth error:", error)
      return handleAuthError(error)
    }

    console.log("✅ GitHub OAuth initiated successfully")
    return {
      success: true,
      redirectUrl: data.url,
      message: "Redirecting to GitHub for authentication...",
    }
  } catch (error) {
    console.error("💥 Unexpected GitHub OAuth error:", error)
    return { error: "Failed to initiate GitHub login. Please try again." }
  }
}

// Sign out
export async function signOut(): Promise<AuthResult> {
  try {
    console.log("🔒 Signing out user")
    const supabase = createServerClient()

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("❌ Sign out error:", error)
      return { error: error.message }
    }

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete("supabase-auth-token")

    // Revalidate paths
    revalidatePath("/")

    return {
      success: true,
      message: "Successfully signed out",
      redirectUrl: "/login",
    }
  } catch (error) {
    console.error("💥 Unexpected sign out error:", error)
    return { error: "An unexpected error occurred during sign out. Please try again." }
  }
} 