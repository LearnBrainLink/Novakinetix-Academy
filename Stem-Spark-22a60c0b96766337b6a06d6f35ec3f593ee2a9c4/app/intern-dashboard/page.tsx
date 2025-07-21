'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, BookOpenIcon, ClockIcon, UsersIcon, LogOut, TrendingUp, Star, Award } from 'lucide-react';
import { Logo } from '@/components/logo';
import { simpleSignOut } from '@/lib/simple-auth';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InternDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tutoringRequests, setTutoringRequests] = useState<any[]>([]);
  const [volunteerOpportunities, setVolunteerOpportunities] = useState<any[]>([]);
  const [volunteerHours, setVolunteerHours] = useState<{total: number, tutoring: number, events: number, other: number}>({
    total: 0,
    tutoring: 0,
    events: 0,
    other: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

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

      if (profile?.role !== 'intern' && profile?.role !== 'teacher') {
        router.push('/');
        return;
      }

      setUser({ ...user, ...profile });
      
      // Fetch tutoring requests
      const { data: requests } = await supabase
        .from('tutoring_sessions')
        .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setTutoringRequests(requests || []);
      
      // Fetch upcoming sessions
      const { data: sessions } = await supabase
        .from('tutoring_sessions')
        .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
        .eq('intern_id', user.id)
        .eq('status', 'accepted')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true });
      
      setUpcomingSessions(sessions || []);
      
      // Fetch volunteer opportunities
      const { data: opportunities } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .in('status', ['active', 'full'])
        .order('event_date', { ascending: true });
      
      setVolunteerOpportunities(opportunities || []);
      
      // Fetch volunteer hours
      const { data: hours } = await supabase
        .from('volunteer_hours')
        .select('activity_type, hours')
        .eq('intern_id', user.id)
        .eq('status', 'approved');
      
      if (hours && hours.length > 0) {
        const totalHours = hours.reduce((sum, record) => sum + parseFloat(record.hours), 0);
        const tutoringHours = hours
          .filter(record => record.activity_type === 'tutoring')
          .reduce((sum, record) => sum + parseFloat(record.hours), 0);
        const eventHours = hours
          .filter(record => record.activity_type === 'event')
          .reduce((sum, record) => sum + parseFloat(record.hours), 0);
        const otherHours = hours
          .filter(record => record.activity_type === 'other')
          .reduce((sum, record) => sum + parseFloat(record.hours), 0);
        
        setVolunteerHours({
          total: parseFloat(totalHours.toFixed(2)),
          tutoring: parseFloat(tutoringHours.toFixed(2)),
          events: parseFloat(eventHours.toFixed(2)),
          other: parseFloat(otherHours.toFixed(2))
        });
      }
      
      setLoading(false);
    };

    getUser();
  }, [router]);

  const acceptTutoringRequest = async (sessionId: string) => {
    const { error } = await supabase
      .from('tutoring_sessions')
      .update({ 
        status: 'accepted',
        intern_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (!error) {
      // Refresh tutoring requests
      const { data: requests } = await supabase
        .from('tutoring_sessions')
        .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setTutoringRequests(requests || []);
      
      // Refresh upcoming sessions
      const { data: sessions } = await supabase
        .from('tutoring_sessions')
        .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
        .eq('intern_id', user.id)
        .eq('status', 'accepted')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true });
      
      setUpcomingSessions(sessions || []);
    }
  };

  const signUpForOpportunity = async (opportunityId: string) => {
    const { error } = await supabase
      .from('volunteer_signups')
      .insert({
        opportunity_id: opportunityId,
        intern_id: user.id,
        status: 'signed_up'
      });
    
    if (!error) {
      // Refresh volunteer opportunities
      const { data: opportunities } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .in('status', ['active', 'full'])
        .order('event_date', { ascending: true });
      
      setVolunteerOpportunities(opportunities || []);
    }
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
          <h2 className="text-display brand-text-gradient mb-4">Welcome back, {user?.full_name}! 🎓</h2>
          <p className="text-xl text-brand-secondary font-medium max-w-2xl mx-auto">
            Make a difference through tutoring and volunteering at NOVAKINETIX ACADEMY
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="stat-card group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-primary">Total Volunteer Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-primary">{volunteerHours.total}</div>
              <p className="text-brand-secondary font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                All activities
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-primary">Tutoring Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-primary">{volunteerHours.tutoring}</div>
              <p className="text-brand-secondary font-medium flex items-center">
                <BookOpenIcon className="w-4 h-4 mr-1 text-blue-500" />
                Sessions completed
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-primary">Event Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-primary">{volunteerHours.events}</div>
              <p className="text-brand-secondary font-medium flex items-center">
                <UsersIcon className="w-4 h-4 mr-1 text-purple-500" />
                Community events
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-primary">Other Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-primary">{volunteerHours.other}</div>
              <p className="text-brand-secondary font-medium flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                Additional activities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="tutoring" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white/80 backdrop-blur-sm border border-brand-light/30 rounded-xl p-2">
            <TabsTrigger
              value="tutoring"
              className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              Tutoring
            </TabsTrigger>
            <TabsTrigger
              value="volunteer"
              className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              Volunteer Opportunities
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              Upcoming Sessions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tutoring" className="space-y-6">
            <Card className="admin-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-brand-primary">Tutoring Requests</CardTitle>
                <CardDescription className="text-lg text-brand-secondary">
                  Help students by accepting tutoring requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tutoringRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-brand-secondary">No pending tutoring requests at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutoringRequests.map((request) => (
                      <Card key={request.id} className="border border-brand-light/30">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{request.subject}</CardTitle>
                            <Badge variant="secondary">{request.status}</Badge>
                          </div>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{request.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                              </Avatar>
                              <span>{request.profiles?.full_name}</span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">{request.description}</p>
                          <div className="flex items-center text-sm text-brand-secondary">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            {formatDate(request.scheduled_time)}
                          </div>
                          <div className="flex items-center text-sm text-brand-secondary mt-1">
                            <ClockIcon className="mr-1 h-4 w-4" />
                            {request.duration_minutes} minutes
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full button-primary" 
                            onClick={() => acceptTutoringRequest(request.id)}
                          >
                            Accept Request
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="volunteer" className="space-y-6">
            <Card className="admin-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-brand-primary">Volunteer Opportunities</CardTitle>
                <CardDescription className="text-lg text-brand-secondary">
                  Join community events and make a difference
                </CardDescription>
              </CardHeader>
              <CardContent>
                {volunteerOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-brand-secondary">No volunteer opportunities available at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {volunteerOpportunities.map((opportunity) => (
                      <Card key={opportunity.id} className="border border-brand-light/30">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                            <Badge variant={opportunity.status === 'full' ? 'secondary' : 'default'}>
                              {opportunity.status === 'full' ? 'Full' : 'Available'}
                            </Badge>
                          </div>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <UsersIcon className="h-4 w-4" />
                              <span>
                                {opportunity.current_participants}
                                {opportunity.max_participants ? `/${opportunity.max_participants}` : ''} participants
                              </span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">{opportunity.description}</p>
                          <div className="flex items-center text-sm text-brand-secondary">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            {formatDate(opportunity.event_date)}
                          </div>
                          <div className="flex items-center text-sm text-brand-secondary mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {opportunity.location}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full button-primary" 
                            onClick={() => signUpForOpportunity(opportunity.id)}
                            disabled={opportunity.status === 'full'}
                          >
                            {opportunity.status === 'full' ? 'Full' : 'Sign Up'}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-6">
            <Card className="admin-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-brand-primary">Upcoming Sessions</CardTitle>
                <CardDescription className="text-lg text-brand-secondary">
                  Your scheduled tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-brand-secondary">No upcoming sessions scheduled.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingSessions.map((session) => (
                      <Card key={session.id} className="border border-brand-light/30">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{session.subject}</CardTitle>
                            <Badge>Scheduled</Badge>
                          </div>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{session.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                              </Avatar>
                              <span>{session.profiles?.full_name}</span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">{session.description}</p>
                          <div className="flex items-center text-sm text-brand-secondary">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            {formatDate(session.scheduled_time)}
                          </div>
                          <div className="flex items-center text-sm text-brand-secondary mt-1">
                            <ClockIcon className="mr-1 h-4 w-4" />
                            {session.duration_minutes} minutes
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full button-secondary" 
                            onClick={() => router.push(`/sessions/${session.id}`)}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}