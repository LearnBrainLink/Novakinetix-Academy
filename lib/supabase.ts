import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Client-side Supabase client with auth helpers
export const createBrowserClient = () => {
  return createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })
}

// Server-side Supabase client
export const createServerClient = () => {
  if (!supabaseServiceKey) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY - using anon key instead")
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-application-name": "novakinetix",
        },
      },
    })
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "novakinetix",
      },
    },
  })
}

// Create a server client with cookies for middleware
export const createServerClientWithCookies = () => {
  const cookieStore = cookies()
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
        "x-application-name": "novakinetix",
      },
    },
  })
}

// Test connection function with detailed diagnostics
export async function testConnection() {
  try {
    console.log("🔍 Testing Supabase connection...")

    // Test client connection
    const browserClient = createBrowserClient()
    const { data: browserData, error: browserError } = await browserClient.from("profiles").select("count").limit(1)

    if (browserError) {
      console.error("❌ Browser client connection failed:", browserError.message)
      return { 
        success: false, 
        error: browserError.message, 
        type: "browser",
        details: {
          code: browserError.code,
          message: browserError.message
        }
      }
    }

    console.log("✅ Browser client connection successful")

    // Test server connection
    const serverClient = createServerClient()
    const { data: serverData, error: serverError } = await serverClient.from("profiles").select("count").limit(1)

    if (serverError) {
      console.error("❌ Server client connection failed:", serverError.message)
      return { 
        success: false, 
        error: serverError.message, 
        type: "server",
        details: {
          code: serverError.code,
          message: serverError.message
        }
      }
    }

    console.log("✅ Server client connection successful")

    // Test auth settings
    const { data: authSettings, error: authError } = await serverClient.auth.getSession()

    if (authError) {
      console.error("❌ Auth settings check failed:", authError.message)
      return { 
        success: false, 
        error: authError.message, 
        type: "auth",
        details: {
          code: authError.code,
          message: authError.message
        }
      }
    }

    // Test RLS policies
    const { data: rlsTest, error: rlsError } = await serverClient
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (rlsError) {
      console.error("❌ RLS policy check failed:", rlsError.message)
      return { 
        success: false, 
        error: rlsError.message, 
        type: "rls",
        details: {
          code: rlsError.code,
          message: rlsError.message
        }
      }
    }

    console.log("✅ RLS policy check successful")

    return { 
      success: true, 
      message: "All connections working",
      details: {
        browser: "connected",
        server: "connected",
        auth: "configured",
        rls: "enabled"
      }
    }
  } catch (error) {
    console.error("💥 Connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      type: "unknown",
      details: {
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
}

// Export a singleton instance for client-side use
export const supabase = createBrowserClient()
