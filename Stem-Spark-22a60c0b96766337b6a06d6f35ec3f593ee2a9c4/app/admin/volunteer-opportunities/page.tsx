'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Logo } from '@/components/logo';
import { BrandedHeader } from '@/components/branded-header';
import { Plus, Calendar, MapPin, Users, Edit, Trash2, Eye, Clock } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VolunteerOpportunitiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    max_participants: '',
    required_skills: ''
  });

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

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      setUser({ ...user, ...profile });
      await loadOpportunities();
      setLoading(false);
    };

    getUser();
  }, [router]);

  const loadOpportunities = async () => {
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && data) {
      setOpportunities(data);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('volunteer_opportunities')
      .insert({
        ...formData,
        created_by: user.id,
        current_participants: 0,
        status: 'active'
      });

    if (!error) {
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        event_date: '',
        location: '',
        max_participants: '',
        required_skills: ''
      });
      await loadOpportunities();
    }
  };

  const handleEditOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    const { error } = await supabase
      .from('volunteer_opportunities')
      .update(formData)
      .eq('id', selectedOpportunity.id);

    if (!error) {
      setIsEditDialogOpen(false);
      setSelectedOpportunity(null);
      setFormData({
        title: '',
        description: '',
        event_date: '',
        location: '',
        max_participants: '',
        required_skills: ''
      });
      await loadOpportunities();
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (confirm('Are you sure you want to delete this volunteer opportunity?')) {
      const { error } = await supabase
        .from('volunteer_opportunities')
        .delete()
        .eq('id', opportunityId);

      if (!error) {
        await loadOpportunities();
      }
    }
  };

  const openEditDialog = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description,
      event_date: opportunity.event_date.split('T')[0],
      location: opportunity.location || '',
      max_participants: opportunity.max_participants?.toString() || '',
      required_skills: opportunity.required_skills?.join(', ') || ''
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, current: number, max: number) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
    } else if (current >= max) {
      return <Badge className="bg-yellow-100 text-yellow-800">Full</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Volunteer Opportunities Management
            </h1>
            <p className="text-xl text-gray-600">
              Create and manage volunteer opportunities for interns
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="button-primary">
                <Plus className="w-5 h-5 mr-2" />
                Create Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Volunteer Opportunity</DialogTitle>
                <DialogDescription>
                  Create a new volunteer opportunity for interns to sign up for.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOpportunity} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_date">Event Date *</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
                  <Input
                    id="required_skills"
                    value={formData.required_skills}
                    onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                    placeholder="e.g., teaching, programming, communication"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 button-primary">
                    Create Opportunity
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Opportunities List */}
        <Card className="admin-card">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-brand-primary">
              Volunteer Opportunities ({opportunities.length})
            </CardTitle>
            <CardDescription className="text-lg text-brand-secondary">
              Manage all volunteer opportunities and track participation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No volunteer opportunities created yet.</p>
                <p className="text-gray-500 mt-2">Create your first opportunity to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="border border-brand-light/30 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                        {getStatusBadge(opportunity.status, opportunity.current_participants, opportunity.max_participants)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Description:</p>
                        <p className="text-sm">{opportunity.description}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(opportunity.event_date)}
                      </div>
                      {opportunity.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-2" />
                          {opportunity.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-2" />
                        {opportunity.current_participants}
                        {opportunity.max_participants ? `/${opportunity.max_participants}` : ''} participants
                      </div>
                      {opportunity.required_skills && opportunity.required_skills.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {opportunity.required_skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(opportunity)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOpportunity(opportunity.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Volunteer Opportunity</DialogTitle>
              <DialogDescription>
                Update the volunteer opportunity details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditOpportunity} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-event_date">Event Date *</Label>
                  <Input
                    id="edit-event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max_participants">Max Participants</Label>
                  <Input
                    id="edit-max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-required_skills">Required Skills (comma-separated)</Label>
                <Input
                  id="edit-required_skills"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                  placeholder="e.g., teaching, programming, communication"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 button-primary">
                  Update Opportunity
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
} 