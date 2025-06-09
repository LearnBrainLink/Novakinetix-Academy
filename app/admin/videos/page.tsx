"use client"

import React from 'react';
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2, Play, Clock, Search } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration: number
  category: string
  grade_level: number
  status: string
  created_at: string
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

    if (data) {
      setVideos(data)
    }
  }

  const handleCreateVideo = async (formData: FormData) => {
    setIsLoading(true)
    setMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage({ type: "error", text: "You must be logged in" })
      setIsLoading(false)
      return
    }

    const videoData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      video_url: formData.get("videoUrl") as string,
      thumbnail_url: formData.get("thumbnailUrl") as string,
      duration: Number.parseInt(formData.get("duration") as string),
      category: formData.get("category") as string,
      grade_level: Number.parseInt(formData.get("gradeLevel") as string),
      created_by: user.id,
      status: "active",
    }

    const { error } = await supabase.from("videos").insert(videoData)

    if (error) {
      setMessage({ type: "error", text: "Failed to create video" })
    } else {
      setMessage({ type: "success", text: "Video created successfully!" })
      setIsCreateDialogOpen(false)
      fetchVideos()

      // Log activity
      await supabase.from("user_activities").insert({
        user_id: user.id,
        activity_type: "video_created",
        activity_description: `Created video: ${videoData.title}`,
        metadata: { title: videoData.title, category: videoData.category },
      })
    }

    setIsLoading(false)
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    const { error } = await supabase.from("videos").delete().eq("id", videoId)

    if (error) {
      setMessage({ type: "error", text: "Failed to delete video" })
    } else {
      setMessage({ type: "success", text: "Video deleted successfully!" })
      fetchVideos()
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search videos..." className="pl-8" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>{video.title}</TableCell>
                  <TableCell>{video.category}</TableCell>
                  <TableCell>{formatDuration(video.duration)}</TableCell>
                  <TableCell>
                    <Badge variant={video.status === "active" ? "default" : "secondary"}>
                      {video.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteVideo(video.id)}>
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
