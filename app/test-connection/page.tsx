"use client"

import { useEffect, useState } from "react"
import { testConnection } from "@/lib/supabase"

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkConnection() {
      try {
        const testResult = await testConnection()
        setResult(testResult)
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className={`p-6 rounded-lg ${
          result?.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}>
          <h2 className={`text-lg font-semibold mb-4 ${
            result?.success ? "text-green-700" : "text-red-700"
          }`}>
            {result?.success ? "✅ Connection Successful" : "❌ Connection Failed"}
          </h2>
          
          {result?.error && (
            <div className="mb-4">
              <p className="text-red-600 font-medium">Error:</p>
              <p className="text-red-500">{result.error}</p>
            </div>
          )}
          
          {result?.details && (
            <div className="space-y-2">
              <p className="font-medium">Details:</p>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 