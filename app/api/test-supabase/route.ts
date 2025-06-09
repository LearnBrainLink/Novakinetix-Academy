import { NextResponse } from "next/server"
import { testConnection } from "@/lib/supabase"

export async function GET() {
  try {
    const result = await testConnection()
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message, details: result.details })
    } else {
      return NextResponse.json({ success: false, error: result.error, type: result.type, details: result.details }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error: ", error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 })
  }
} 