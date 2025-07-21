'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, BookOpenIcon, ClockIcon, UsersIcon, LogOut, TrendingUp, Star, Award, BarChart } from 'lucide-react';
import { Logo } from '@/components/logo';
import { simpleSignOut } from '@/lib/simple-auth';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childProgress, setChildProgress] = useState<any[]>([]);
  const [tutoringSessions, setTutoringSessions] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'parent') {
        router.push('/');
        return;
      }

      setUser({ ...user, ...profile });
      
      // Fetch children
      const { data: childrenData } = await supabase
        .from('parent_student_relationships')
        .select('student:profiles!parent_student_relationships_student_id_fkey(*)')
        .eq('parent_id', user.id);
      
      if (childrenData && childrenData.length > 0) {
        const children = childrenData.map(item => item.student);
        setChildren(children);
        setSelectedChild(children[0].id);
      }
      
      setLoading(false);
    };

    getUser();
  }, [router]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildData = async (childId: string) => {
    // Fetch progress data
    const { data: progressData } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', childId)
      .order('updated_at', { ascending: false });
    
    setChildProgress(progressData || []);
    
    // Fetch tutoring sessions
    const { data: sessionsData } = await supabase
      .from('tutoring_sessions')
      .select('*, intern:profiles!tutoring_sessions_intern_id_fkey(*)')
      .eq('student_id', childId)
      .order('scheduled_time', { ascending: false });
    
    setTutoringSessions(sessionsData || []);
    
    // Fetch upcoming events (could be assignments, etc.)
    // This is a placeholder - you would need to create an events table
    setUpcomingEvents([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Logo className="mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen hero-gradient">
        <header className="bg-white/90 backdrop-blur-md shadow-brand border-b border-brand-light/30">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <Logo variant="large" className="group-hover:scale-110 transition-transform duration-300 logo-nav" />
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold brand-text-gradient">NOVAKINETIX</h1>
                <p className="text-lg font-semibold text-brand-secondary">ACADEMY</p>
              </div>
            </div>
            <form action={simpleSignOut}>
              <Button
                variant="outline"
                size="lg"
                className="interactive-button border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
          <div className="mb-12 text-center">
            <h2 className="text-display brand-text-gradient mb-4">Parent Dashboard</h2>
            <p className="text-xl text-brand-secondary font-medium max-w-2xl mx-auto">
              Welcome, {user?.full_name}
            </p>
          </div>
          
          <Card className="admin-card">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">No Students Connected</h2>
                <p className="text-brand-secondary mb-4">
                  You don't have any students connected to your account yet.
                </p>
                <Button onClick={() => router.push('/connect-student')} className="button-primary">
                  Connect a Student
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const selectedChildData = children.find(child => child.id === selectedChild);
  const completedLessons = childProgress.filter(p => p.completed).length;
  const totalLessons = childProgress.length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const averageScore = childProgress.length > 0 
    ? Math.round(childProgress.reduce((sum, p) => sum + (p.score || 0), 0) / childProgress.length) 
    : 0;

  return (
    <div className="min-h-screen hero-gradient">
      {/* Enhanced Header with Larger Logo */}
      <header className="bg-white/90 backdrop-blur-md shadow-brand border-b border-brand-light/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <Logo variant="large" className="group-hover:scale-110 transition-transform duration-300 logo-nav" />
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold brand-text-gradient">NOVAKINETIX</h1>
              <p className="text-lg font-semibold text-brand-secondary">ACADEMY</p>
            </div>
          </div>
          <form action={simpleSignOut}>
            <Button
              variant="outline"
              size="lg"
              className="interactive-button border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        {/* Enhanced Welcome Section */}
        <div className="mb-12 text-center">
          <h2 className="text-display brand-text-gradient mb-4">Parent Dashboard</h2>
          <p className="text-xl text-brand-secondary font-medium max-w-2xl mx-auto">
            Welcome, {user?.full_name} - Track your child's learning journey
          </p>
        </div>

        {/* Child Selection */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-brand-primary">Select Student</h3>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? 'default' : 'outline'}
                onClick={() => setSelectedChild(child.id)}
                className={selectedChild === child.id ? 'button-primary' : 'button-secondary'}
              >
                {child.full_name}
              </Button>
            ))}
          </div>
        </div>

        {selectedChild && selectedChildData && (
          <>
            {/* Progress Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card className="stat-card group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-brand-primary">Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-brand-primary">{completionPercentage}%</div>
                  <p className="text-brand-secondary font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                    {completedLessons}/{totalLessons} lessons
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-brand-primary">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-brand-primary">{averageScore}%</div>
                  <p className="text-brand-secondary font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    Across all subjects
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-brand-primary">Tutoring Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-brand-primary">{tutoringSessions.length}</div>
                  <p className="text-brand-secondary font-medium flex items-center">
                    <BookOpenIcon className="w-4 h-4 mr-1 text-blue-500" />
                    Total sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-brand-primary">Grade Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-brand-primary">{selectedChildData.grade || 'N/A'}</div>
                  <p className="text-brand-secondary font-medium flex items-center">
                    <Award className="w-4 h-4 mr-1 text-purple-500" />
                    Current grade
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <Tabs defaultValue="progress" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 h-14 bg-white/80 backdrop-blur-sm border border-brand-light/30 rounded-xl p-2">
                <TabsTrigger
                  value="progress"
                  className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Progress
                </TabsTrigger>
                <TabsTrigger
                  value="tutoring"
                  className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Tutoring
                </TabsTrigger>
                <TabsTrigger
                  value="overview"
                  className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Overview
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-6">
                <Card className="admin-card">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold text-brand-primary">Learning Progress</CardTitle>
                    <CardDescription className="text-lg text-brand-secondary">
                      {selectedChildData.full_name}'s course progress and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {childProgress.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-brand-secondary">No progress data available yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {childProgress.slice(0, 10).map((progress, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-brand-light/30 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${progress.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <BookOpenIcon className={`w-4 h-4 ${progress.completed ? 'text-green-600' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-brand-primary">{progress.course_id} - {progress.lesson_id}</p>
                                <p className="text-sm text-brand-secondary">
                                  {progress.completed ? 'Completed' : 'In Progress'}
                                  {progress.score && ` • Score: ${progress.score}%`}
                                </p>
                              </div>
                            </div>
                            <Badge variant={progress.completed ? 'default' : 'secondary'}>
                              {progress.completed ? 'Complete' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tutoring" className="space-y-6">
                <Card className="admin-card">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold text-brand-primary">Tutoring Sessions</CardTitle>
                    <CardDescription className="text-lg text-brand-secondary">
                      {selectedChildData.full_name}'s tutoring history and upcoming sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tutoringSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-brand-secondary">No tutoring sessions yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tutoringSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 border border-brand-light/30 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <BookOpenIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-brand-primary">{session.subject}</p>
                                <p className="text-sm text-brand-secondary">
                                  with {session.intern?.full_name || 'Intern'}
                                </p>
                                <p className="text-xs text-brand-secondary">
                                  {formatDate(session.scheduled_time)} • {session.duration_minutes} min
                                </p>
                              </div>
                            </div>
                            <Badge variant={
                              session.status === 'completed' ? 'default' : 
                              session.status === 'accepted' ? 'secondary' : 'outline'
                            }>
                              {session.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="overview" className="space-y-6">
                <Card className="admin-card">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold text-brand-primary">Student Overview</CardTitle>
                    <CardDescription className="text-lg text-brand-secondary">
                      Complete overview of {selectedChildData.full_name}'s academic journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-brand-primary">Student Information</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {selectedChildData.full_name}</p>
                          <p><span className="font-medium">Email:</span> {selectedChildData.email}</p>
                          <p><span className="font-medium">Grade:</span> {selectedChildData.grade || 'Not specified'}</p>
                          <p><span className="font-medium">School:</span> {selectedChildData.school || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-brand-primary">Academic Summary</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Total Lessons:</span> {totalLessons}</p>
                          <p><span className="font-medium">Completed:</span> {completedLessons}</p>
                          <p><span className="font-medium">Progress:</span> {completionPercentage}%</p>
                          <p><span className="font-medium">Average Score:</span> {averageScore}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}