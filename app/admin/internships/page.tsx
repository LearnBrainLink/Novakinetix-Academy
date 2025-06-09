"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Search, Trash2, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

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

interface FormData {
  title: string
  description: string
  requirements: string
  location: string
  type: "remote" | "hybrid" | "onsite"
  duration: string
  stipend: string
}

export default function AdminInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    requirements: "",
    location: "",
    type: "remote",
    duration: "",
    stipend: ""
  })

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requirements = formData.requirements.split("\n").filter((req: string) => req.trim())
      const internshipData = {
        ...formData,
        requirements
      }

      if (editingInternship) {
        const { error } = await supabase
          .from("internships")
          .update(internshipData)
          .eq("id", editingInternship.id)

        if (error) throw error
        toast.success("Internship updated successfully")
      } else {
        const { error } = await supabase
          .from("internships")
          .insert([internshipData])

        if (error) throw error
        toast.success("Internship created successfully")
      }

      setIsDialogOpen(false)
      setEditingInternship(null)
      setFormData({
        title: "",
        description: "",
        requirements: "",
        location: "",
        type: "remote",
        duration: "",
        stipend: ""
      })
      fetchInternships()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save internship")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this internship?")) return

    try {
      const { error } = await supabase
        .from("internships")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Internship deleted successfully")
      fetchInternships()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete internship")
    }
  }

  const handleEdit = (internship: Internship) => {
    setEditingInternship(internship)
    setFormData({
      title: internship.title,
      description: internship.description,
      requirements: internship.requirements.join("\n"),
      location: internship.location,
      type: internship.type,
      duration: internship.duration,
      stipend: internship.stipend
    })
    setIsDialogOpen(true)
  }

  const filteredInternships = internships.filter(internship =>
    internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !internships.length) {
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Internships</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Internship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInternship ? "Edit Internship" : "Add New Internship"}</DialogTitle>
              <DialogDescription>
                Fill in the details for the internship position.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as "remote" | "hybrid" | "onsite" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stipend">Stipend</Label>
                <Input
                  id="stipend"
                  value={formData.stipend}
                  onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Internship"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search internships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInternships.map((internship) => (
          <Card key={internship.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{internship.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{internship.type}</Badge>
                      <Badge variant="secondary">{internship.location}</Badge>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(internship)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(internship.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 line-clamp-3">{internship.description}</p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInternships.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No internships found.</p>
        </div>
      )}
    </div>
  )
}

