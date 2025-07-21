'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { BrandedHeader } from '@/components/branded-header';
import { CalendarIcon, Clock, User, BookOpen, CheckCircle, XCircle, MessageSquare, Calendar, ClockIcon } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SessionManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [acceptedSessions, setAcceptedSessions] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      await loadSessions();
      setLoading(false);
    };

    getUser();
  }, [router]);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load pending requests (not yet accepted by any intern)
    const { data: pending } = await supabase
      .from('tutoring_sessions')
      .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setPendingRequests(pending || []);

    // Load accepted sessions (accepted by this intern)
    const { data: accepted } = await supabase
      .from('tutoring_sessions')
      .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
      .eq('intern_id', user.id)
      .eq('status', 'accepted')
      .order('scheduled_time', { ascending: true });
    
    setAcceptedSessions(accepted || []);

    // Load completed sessions
    const { data: completed } = await supabase
      .from('tutoring_sessions')
      .select('*, profiles!tutoring_sessions_student_id_fkey(*)')
      .eq('intern_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false });
    
    setCompletedSessions(completed || []);
  };

  const acceptRequest = async (sessionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('tutoring_sessions')
      .update({ 
        status: 'accepted',
        intern_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (!error) {
      await loadSessions();
    }
  };

  const completeSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('tutoring_sessions')
      .update({ 
        status: 'completed',
        session_notes: sessionNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (!error) {
      // Log volunteer hours
      const session = acceptedSessions.find(s => s.id === sessionId);
      if (session) {
        const hours = session.duration_minutes / 60;
        await supabase
          .from('volunteer_hours')
          .insert({
            intern_id: user.id,
            activity_type: 'tutoring',
            activity_description: `Tutoring session: ${session.subject}`,
            hours: hours,
            activity_date: new Date().toISOString(),
            reference_id: sessionId,
            status: 'approved'
          });
      }
      
      setSessionNotes('');
      setIsDialogOpen(false);
      await loadSessions();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Accepted</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
      <BrandedHeader variant="dashboard" showNavigation={false} />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Session Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your tutoring sessions and help students achieve their learning goals
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white/80 backdrop-blur-sm border border-brand-light/30 rounded-xl p-2">
            <TabsTrigger
              value="pending"
              className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              Pending Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              Accepted Sessions ({acceptedSessions.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-lg font-semibold data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              Completed Sessions ({completedSessions.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Pending Requests */}
          <TabsContent value="pending" className="space-y-6">
            <Card className="admin-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-brand-primary">Pending Tutoring Requests</CardTitle>
                <CardDescription className="text-lg text-brand-secondary">
                  Review and accept tutoring requests from students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600">No pending tutoring requests at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRequests.map((request) => (
                      <Card key={request.id} className="border border-brand-light/30 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-lg">{request.subject}</CardTitle>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{request.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.profiles?.full_name}</p>
                              <p className="text-sm text-gray-500">Student</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Description:</p>
                            <p className="text-sm">{request.description}</p>
                          </div>
                          {request.learning_goals && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Learning Goals:</p>
                              <p className="text-sm">{request.learning_goals}</p>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            {request.duration_minutes} minutes
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(request.created_at)}
                          </div>
                          <Button 
                            className="w-full button-primary" 
                            onClick={() => acceptRequest(request.id)}
                          >
                            Accept Request
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Accepted Sessions */}
          <TabsContent value="accepted" className="space-y-6">
            <Card className="admin-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-brand-primary">Accepted Sessions</CardTitle>
                <CardDescription className="text-lg text-brand-secondary">
                  Manage your scheduled tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {acceptedSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600">No accepted sessions at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedSessions.map((session) => (
                      <Card key={session.id} className="border border-brand-light/30 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-lg">{session.subject}</CardTitle>
                            {getStatusBadge(session.status)}
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{session.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.profiles?.full_name}</p>
                              <p className="text-sm text-gray-500">Student</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Description:</p>
                            <p className="text-sm">{session.description}</p>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            {session.duration_minutes} minutes
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {session.scheduled_time ? formatDate(session.scheduled_time) : 'Not scheduled'}
                          </div>
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                className="w-full button-secondary"
                                onClick={() => setSelectedSession(session)}
                              >
                                Complete Session
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Complete Tutoring Session</DialogTitle>
                                <DialogDescription>
                                  Add notes about the session and mark it as completed.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="notes">Session Notes</Label>
                                  <Textarea
                                    id="notes"
                                    placeholder="Describe what was covered, student progress, and any recommendations..."
                                    value={sessionNotes}
                                    onChange={(e) => setSessionNotes(e.target.value)}
                                    className="min-h-[120px]"
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => completeSession(selectedSession?.id)}
                                    className="flex-1 button-primary"
                                  >
                                    Complete Session
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Completed Sessions */}
          <TabsContent value="completed" className="space-y-6">
            <Card className="admin-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-brand-primary">Completed Sessions</CardTitle>
                <CardDescription className="text-lg text-brand-secondary">
                  Review your completed tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600">No completed sessions yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedSessions.map((session) => (
                      <Card key={session.id} className="border border-brand-light/30">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-lg">{session.subject}</CardTitle>
                            {getStatusBadge(session.status)}
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{session.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.profiles?.full_name}</p>
                              <p className="text-sm text-gray-500">Student</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Description:</p>
                            <p className="text-sm">{session.description}</p>
                          </div>
                          {session.session_notes && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Session Notes:</p>
                              <p className="text-sm">{session.session_notes}</p>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            {session.duration_minutes} minutes
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(session.updated_at)}
                          </div>
                          <div className="flex items-center text-sm text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {session.volunteer_hours_logged || (session.duration_minutes / 60)} hours logged
                          </div>
                        </CardContent>
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