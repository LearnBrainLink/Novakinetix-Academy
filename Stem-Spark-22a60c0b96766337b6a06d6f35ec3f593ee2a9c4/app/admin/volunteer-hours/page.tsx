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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/logo';
import { BrandedHeader } from '@/components/branded-header';
import { Download, Filter, Search, Clock, User, Calendar, TrendingUp, Edit } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VolunteerHoursPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [volunteerHours, setVolunteerHours] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [filteredHours, setFilteredHours] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntern, setSelectedIntern] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    hours: '',
    justification: ''
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
      await loadData();
      setLoading(false);
    };

    getUser();
  }, [router]);

  const loadData = async () => {
    // Load all interns
    const { data: internProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['intern', 'teacher'])
      .order('full_name');

    setInterns(internProfiles || []);

    // Load volunteer hours with intern details
    const { data: hours } = await supabase
      .from('volunteer_hours')
      .select(`
        *,
        profiles!volunteer_hours_intern_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('activity_date', { ascending: false });

    setVolunteerHours(hours || []);
    setFilteredHours(hours || []);
  };

  const applyFilters = () => {
    let filtered = volunteerHours;

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.activity_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedIntern) {
      filtered = filtered.filter(record => record.intern_id === selectedIntern);
    }

    if (selectedActivityType) {
      filtered = filtered.filter(record => record.activity_type === selectedActivityType);
    }

    setFilteredHours(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedIntern, selectedActivityType, volunteerHours]);

  const handleAdjustHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const { error } = await supabase
      .from('volunteer_hours')
      .update({
        hours: parseFloat(adjustmentData.hours),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedRecord.id);

    if (!error) {
      // Log the adjustment
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'admin_action',
          activity_description: `Adjusted volunteer hours for ${selectedRecord.profiles?.full_name} from ${selectedRecord.hours} to ${adjustmentData.hours} hours. Justification: ${adjustmentData.justification}`,
          metadata: {
            record_id: selectedRecord.id,
            old_hours: selectedRecord.hours,
            new_hours: adjustmentData.hours,
            justification: adjustmentData.justification
          }
        });

      setIsAdjustDialogOpen(false);
      setSelectedRecord(null);
      setAdjustmentData({ hours: '', justification: '' });
      await loadData();
    }
  };

  const exportToCSV = () => {
    const headers = ['Intern Name', 'Email', 'Activity Type', 'Description', 'Hours', 'Date', 'Status'];
    const csvData = filteredHours.map(record => [
      record.profiles?.full_name || 'Unknown',
      record.profiles?.email || 'Unknown',
      record.activity_type,
      record.activity_description,
      record.hours,
      new Date(record.activity_date).toLocaleDateString(),
      record.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteer-hours-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalHours = () => {
    return filteredHours.reduce((sum, record) => sum + parseFloat(record.hours), 0);
  };

  const getHoursByType = (type: string) => {
    return filteredHours
      .filter(record => record.activity_type === type)
      .reduce((sum, record) => sum + parseFloat(record.hours), 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 text-red-800">Disputed</Badge>;
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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Volunteer Hours Management
            </h1>
            <p className="text-xl text-gray-600">
              Track and manage volunteer hours for all interns
            </p>
          </div>
          <Button onClick={exportToCSV} className="button-secondary">
            <Download className="w-5 h-5 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-primary">Total Hours</p>
                  <p className="text-3xl font-bold text-brand-primary">{getTotalHours().toFixed(1)}</p>
                </div>
                <Clock className="w-8 h-8 text-brand-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-primary">Tutoring Hours</p>
                  <p className="text-3xl font-bold text-brand-primary">{getHoursByType('tutoring').toFixed(1)}</p>
                </div>
                <User className="w-8 h-8 text-brand-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-primary">Event Hours</p>
                  <p className="text-3xl font-bold text-brand-primary">{getHoursByType('event').toFixed(1)}</p>
                </div>
                <Calendar className="w-8 h-8 text-brand-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-primary">Other Hours</p>
                  <p className="text-3xl font-bold text-brand-primary">{getHoursByType('other').toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-brand-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="intern">Intern</Label>
                <Select value={selectedIntern} onValueChange={setSelectedIntern}>
                  <SelectTrigger>
                    <SelectValue placeholder="All interns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All interns</SelectItem>
                    {interns.map((intern) => (
                      <SelectItem key={intern.id} value={intern.id}>
                        {intern.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="activity-type">Activity Type</Label>
                <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="tutoring">Tutoring</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedIntern('');
                    setSelectedActivityType('');
                  }}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volunteer Hours Table */}
        <Card className="admin-card">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-brand-primary">
              Volunteer Hours Records ({filteredHours.length})
            </CardTitle>
            <CardDescription className="text-lg text-brand-secondary">
              Detailed view of all volunteer hours with management capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredHours.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No volunteer hours found.</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intern</TableHead>
                      <TableHead>Activity Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHours.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{record.profiles?.email || 'Unknown'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {record.activity_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate" title={record.activity_description}>
                            {record.activity_description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{record.hours}</span>
                        </TableCell>
                        <TableCell>{formatDate(record.activity_date)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setAdjustmentData({
                                    hours: record.hours.toString(),
                                    justification: ''
                                  });
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Volunteer Hours</DialogTitle>
                                <DialogDescription>
                                  Modify the volunteer hours for {selectedRecord?.profiles?.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleAdjustHours} className="space-y-4">
                                <div>
                                  <Label htmlFor="hours">Hours</Label>
                                  <Input
                                    id="hours"
                                    type="number"
                                    step="0.1"
                                    value={adjustmentData.hours}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, hours: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="justification">Justification</Label>
                                  <Textarea
                                    id="justification"
                                    value={adjustmentData.justification}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, justification: e.target.value })}
                                    placeholder="Explain why this adjustment is necessary..."
                                    required
                                  />
                                </div>
                                <div className="flex gap-3 pt-4">
                                  <Button type="submit" className="flex-1 button-primary">
                                    Update Hours
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAdjustDialogOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 