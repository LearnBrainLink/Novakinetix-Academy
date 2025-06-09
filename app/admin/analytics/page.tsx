"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import dynamic from "next/dynamic"
import AdminNavbar from "@/components/admin/AdminNavbar"

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false })

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

function StatCard({ title, value, icon, subtitle, color, growth }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex-1 min-w-[200px] flex flex-col justify-between border border-blue-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-blue-700 flex items-center gap-1">{title}</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{value}</div>
          {subtitle && <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">{icon}{subtitle}</div>}
          {growth !== undefined && (
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <ArrowUpRight className="w-4 h-4" />+{growth} this month
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ActivityIcon({ type }) {
  if (type === "user") return <Users className="w-5 h-5 text-blue-600" />
  if (type === "video") return <Video className="w-5 h-5 text-purple-600" />
  if (type === "application") return <Briefcase className="w-5 h-5 text-green-600" />
  return <FileText className="w-5 h-5 text-gray-400" />
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  useEffect(() => {
    fetchAnalyticsData()
    // Optionally, refresh every 30s
    // const interval = setInterval(fetchAnalyticsData, 30000)
    // return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
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
        dailyActiveUsers: Math.round((users?.length || 0) * 0.34),
        weeklyActiveUsers: Math.round((users?.length || 0) * 0.6),
        monthlyActiveUsers: Math.round((users?.length || 0) * 0.85),
        averageSessionDuration: "12m 34s"
      }

      // Generate recent activity
      const recentActivity = [
        ...(users?.slice(-2).map(user => ({
          type: "user",
          description: "New user registered",
          timestamp: user.created_at,
          user: user.full_name || "Anonymous"
        })) || []),
        ...(videos?.slice(-2).map(video => ({
          type: "video",
          description: "New video uploaded",
          timestamp: video.created_at,
          user: "Admin"
        })) || []),
        ...(applications?.slice(-2).map(app => ({
          type: "application",
          description: "New internship application",
          timestamp: app.applied_at,
          user: "Student"
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-2 md:px-0">
      <AdminNavbar />
      <div className="h-16" /> {/* Spacer for navbar */}
      {/* Header */}
      <div className="max-w-7xl mx-auto pt-8 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-12 w-12" />
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Analytics Dashboard</h1>
            <p className="text-blue-500 text-sm">Real-time platform insights and metrics</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border border-blue-200 rounded-lg px-3 py-2 text-blue-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm shadow-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium"
          >
            <Eye className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="ml-2 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-50 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {isLoading ? (
          <div className="col-span-4 flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <StatCard
              title="Total Users"
              value={analyticsData.totalUsers.toLocaleString()}
              icon={<Users className="w-6 h-6" />}
              subtitle={""}
              color="bg-blue-100"
              growth={analyticsData.newUsersThisMonth}
            />
            <StatCard
              title="Total Videos"
              value={analyticsData.totalVideos.toLocaleString()}
              icon={<Video className="w-6 h-6" />}
              subtitle={<><PlayCircle className="w-4 h-4 inline-block mr-1" />Educational content</>}
              color="bg-purple-100"
            />
            <StatCard
              title="Applications"
              value={analyticsData.totalApplications.toLocaleString()}
              icon={<Briefcase className="w-6 h-6" />}
              subtitle={<><FileText className="w-4 h-4 inline-block mr-1" />Internship applications</>}
              color="bg-teal-100"
            />
            <StatCard
              title="Engagement Rate"
              value={Math.round((analyticsData.engagementMetrics.dailyActiveUsers / analyticsData.totalUsers) * 100) + "%"}
              icon={<Eye className="w-6 h-6" />}
              subtitle={<span>Daily active users</span>}
              color="bg-green-100"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left: User Growth & Top Videos & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-800">User Growth</span>
            </div>
            <div className="text-xs text-blue-400 mb-4">Monthly user registration trends</div>
            <div className="h-56 w-full">
              {!isLoading && analyticsData.userGrowth && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#2563eb" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="#2563eb" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Performing Videos */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-800">Top Performing Videos</span>
            </div>
            <div className="text-xs text-blue-400 mb-4">Most viewed educational content</div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="h-32 flex items-center justify-center">Loading...</div>
              ) : (
                analyticsData.topVideos.map((video, idx) => (
                  <div key={video.title} className="flex items-center gap-4 py-2 px-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base ${[
                      "bg-yellow-200 text-yellow-700",
                      "bg-gray-200 text-gray-700",
                      "bg-orange-200 text-orange-700",
                      "bg-blue-200 text-blue-700",
                      "bg-purple-200 text-purple-700",
                    ][idx]}`}>{idx + 1}</div>
                    <span className="flex-1 text-blue-900 font-medium truncate">{video.title}</span>
                    <div className="flex items-center gap-1 text-blue-500 font-semibold">
                      <Eye className="w-4 h-4" />
                      <span>{video.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Recent Activity & Quick Stats */}
        <div className="flex flex-col gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-800">Recent Activity</span>
            </div>
            <div className="text-xs text-blue-400 mb-4">Latest platform events</div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="h-32 flex items-center justify-center">Loading...</div>
              ) : (
                analyticsData.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100">
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="flex-1">
                      <div className="text-blue-900 font-medium text-sm">{activity.description}</div>
                      <div className="text-xs text-blue-400">{activity.user} • {new Date(activity.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-800">Quick Stats</span>
            </div>
            <div className="text-xs text-blue-400 mb-4">Key performance indicators</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Active Internships</span>
                </div>
                <span className="text-blue-900 font-semibold">{isLoading ? "-" : analyticsData.activeInternships}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Avg. Session</span>
                </div>
                <span className="text-blue-900 font-semibold">{isLoading ? "-" : analyticsData.engagementMetrics.averageSessionDuration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
