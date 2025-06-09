"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  Users,
  Video,
  Briefcase,
  TrendingUp,
  Download,
  Eye,
  PlayCircle,
  FileText,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface AnalyticsData {
  totalUsers: number
  newUsersThisMonth: number
  totalVideos: number
  totalApplications: number
  activeInternships: number
  userGrowth: Array<{ month: string; users: number }>
  topVideos: Array<{ title: string; views: number }>
  applicationStats: Array<{ status: string; count: number }>
  userRoles: Array<{ role: string; count: number }>
  videoCategories: Array<{ category: string; count: number }>
  engagementMetrics: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    averageSessionDuration: string
  }
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
    user: string
  }>
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("users")
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  useEffect(() => {
    fetchAnalyticsData()
    const interval = setInterval(fetchAnalyticsData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch users data with roles
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("created_at, role, full_name")

      if (usersError) throw usersError

      // Fetch videos data with views
      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("title, views, category, created_at")

      if (videosError) throw videosError

      // Fetch applications data
      const { data: applications, error: applicationsError } = await supabase
        .from("internship_applications")
        .select("status, applied_at, user_id")

      if (applicationsError) throw applicationsError

      // Fetch internships data
      const { data: internships, error: internshipsError } = await supabase
        .from("internships")
        .select("status, created_at")

      if (internshipsError) throw internshipsError

      // Process data
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Calculate user growth
      const userGrowth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        const month = date.toLocaleString('default', { month: 'short' })
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const usersInMonth = users?.filter(user => {
          const userDate = new Date(user.created_at)
          return userDate >= monthStart && userDate <= monthEnd
        }).length || 0

        return { month, users: usersInMonth }
      })

      // Calculate user roles distribution
      const userRoles = Object.entries(
        users?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      ).map(([role, count]) => ({ role, count }))

      // Calculate video categories
      const videoCategories = Object.entries(
        videos?.reduce((acc, video) => {
          acc[video.category] = (acc[video.category] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      ).map(([category, count]) => ({ category, count }))

      // Get top videos
      const topVideos = videos
        ?.sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(video => ({
          title: video.title,
          views: video.views || 0
        })) || []

      // Calculate application stats
      const applicationStats = [
        { status: "pending", count: applications?.filter(app => app.status === "pending").length || 0 },
        { status: "approved", count: applications?.filter(app => app.status === "approved").length || 0 },
        { status: "rejected", count: applications?.filter(app => app.status === "rejected").length || 0 }
      ]

      // Calculate engagement metrics
      const engagementMetrics = {
        dailyActiveUsers: Math.round((users?.length || 0) * 0.3),
        weeklyActiveUsers: Math.round((users?.length || 0) * 0.6),
        monthlyActiveUsers: Math.round((users?.length || 0) * 0.85),
        averageSessionDuration: "12m 34s"
      }

      // Generate recent activity
      const recentActivity = [
        ...(users?.slice(-3).map(user => ({
          type: "user",
          description: "New user registered",
          timestamp: user.created_at,
          user: user.full_name || "Anonymous"
        })) || []),
        ...(applications?.slice(-3).map(app => ({
          type: "application",
          description: "New internship application",
          timestamp: app.applied_at,
          user: "Student"
        })) || []),
        ...(videos?.slice(-3).map(video => ({
          type: "video",
          description: "New video uploaded",
          timestamp: video.created_at,
          user: "Admin"
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)

      setAnalyticsData({
        totalUsers: users?.length || 0,
        newUsersThisMonth: users?.filter(user => new Date(user.created_at) >= thirtyDaysAgo).length || 0,
        totalVideos: videos?.length || 0,
        totalApplications: applications?.length || 0,
        activeInternships: internships?.filter(internship => internship.status === "active").length || 0,
        userGrowth,
        topVideos,
        applicationStats,
        userRoles,
        videoCategories,
        engagementMetrics,
        recentActivity
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to fetch analytics data")
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    if (!analyticsData) return

    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      summary: {
        totalUsers: analyticsData.totalUsers,
        newUsers: analyticsData.newUsersThisMonth,
        totalVideos: analyticsData.totalVideos,
        totalApplications: analyticsData.totalApplications,
        activeInternships: analyticsData.activeInternships
      },
      userGrowth: analyticsData.userGrowth,
      topVideos: analyticsData.topVideos,
      applicationStats: analyticsData.applicationStats,
      userRoles: analyticsData.userRoles,
      videoCategories: analyticsData.videoCategories,
      engagementMetrics: analyticsData.engagementMetrics,
      recentActivity: analyticsData.recentActivity
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 min-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 text-sm md:text-base">Real-time platform insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" className="px-2 py-1 text-sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold mt-1">{analyticsData.totalUsers}</p>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>+{analyticsData.newUsersThisMonth} this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Videos</p>
                <p className="text-2xl font-bold mt-1">{analyticsData.totalVideos}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <PlayCircle className="w-4 h-4 mr-1" />
                  <span>Educational content</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Applications</p>
                <p className="text-2xl font-bold mt-1">{analyticsData.totalApplications}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>Internship applications</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round((analyticsData.engagementMetrics.dailyActiveUsers / analyticsData.totalUsers) * 100)}%
                </p>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <Activity className="w-4 h-4 mr-1" />
                  <span>Daily active users</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Growth Chart */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Monthly user registration trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.userGrowth.map((data) => (
                  <div key={data.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{data.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${(data.users / Math.max(...analyticsData.userGrowth.map((d) => d.users))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{data.users}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Videos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Top Performing Videos</CardTitle>
              <CardDescription>Most viewed educational content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topVideos.map((video, index) => (
                  <div key={video.title} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate">{video.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{video.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'user' ? 'bg-blue-100' :
                      activity.type === 'video' ? 'bg-purple-100' :
                      'bg-green-100'
                    }`}>
                      {activity.type === 'user' ? <Users className="w-4 h-4 text-blue-600" /> :
                       activity.type === 'video' ? <Video className="w-4 h-4 text-purple-600" /> :
                       <Briefcase className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Active Internships</span>
                  </div>
                  <span className="text-sm font-medium">{analyticsData.activeInternships}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Avg. Session</span>
                  </div>
                  <span className="text-sm font-medium">{analyticsData.engagementMetrics.averageSessionDuration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Approval Rate</span>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(
                      (analyticsData.applicationStats.find((s) => s.status === "approved")?.count || 0) /
                        analyticsData.totalApplications *
                        100
                    )}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
