"use client"

import React from 'react';
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Search, Trash2, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Edit } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Internship Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Internship
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search internships..." className="pl-8" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInternships.map((internship) => (
                <TableRow key={internship.id}>
                  <TableCell>{internship.title}</TableCell>
                  <TableCell>{internship.location}</TableCell>
                  <TableCell>{internship.duration}</TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Briefcase className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

