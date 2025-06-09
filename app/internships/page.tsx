"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Internship {
  id: string
  title: string
  description: string
  requirements: string[]
  location: string
  type: "remote" | "hybrid" | "onsite"
  duration: string
  stipend: string
  created_at: string
}

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      fetchInternships()
    }

    checkAuth()
  }, [router, supabase])

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setInternships(data || [])
    } catch (err) {
      setError("Failed to fetch internships")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Internship Opportunities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {internships.map((internship) => (
          <Card key={internship.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{internship.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{internship.type}</Badge>
                  <Badge variant="secondary">{internship.location}</Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{internship.description}</p>
              <div className="space-y-2">
                <h3 className="font-semibold">Requirements:</h3>
                <ul className="list-disc list-inside">
                  {internship.requirements.map((req, index) => (
                    <li key={index} className="text-gray-600">{req}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 space-y-2">
                <p><span className="font-semibold">Duration:</span> {internship.duration}</p>
                <p><span className="font-semibold">Stipend:</span> {internship.stipend}</p>
              </div>
              <Button className="w-full mt-4">Apply Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
