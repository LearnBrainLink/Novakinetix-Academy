'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/logo';
import { BrandedHeader } from '@/components/branded-header';
import { CalendarIcon, Clock, BookOpen, Target, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Engineering',
  'Programming',
  'Data Science',
  'Artificial Intelligence',
  'Robotics',
  'Electronics',
  'Other'
];

const timeSlots = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM'
];

export default function TutoringRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    learningGoals: '',
    preferredTime: '',
    duration: '60'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user profile to verify student role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'student') {
        alert('Only students can request tutoring sessions.');
        return;
      }

      // Create tutoring session request
      const { error } = await supabase
        .from('tutoring_sessions')
        .insert({
          student_id: user.id,
          subject: formData.subject,
          description: formData.description,
          learning_goals: formData.learningGoals,
          preferred_time: formData.preferredTime,
          duration_minutes: parseInt(formData.duration),
          status: 'pending'
        });

      if (error) {
        console.error('Error creating tutoring request:', error);
        alert('Failed to submit tutoring request. Please try again.');
      } else {
        alert('Tutoring request submitted successfully! An intern will review your request soon.');
        router.push('/student-dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen hero-gradient">
      <BrandedHeader variant="dashboard" showNavigation={false} />
      
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/student-dashboard" className="inline-flex items-center text-brand-primary hover:text-brand-secondary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo variant="large" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Request Tutoring Session
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized help from our experienced interns. Fill out the form below to request a tutoring session.
          </p>
        </div>

        {/* Form */}
        <Card className="admin-card">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-brand-primary flex items-center">
              <BookOpen className="w-6 h-6 mr-3" />
              Tutoring Request Form
            </CardTitle>
            <CardDescription className="text-lg text-brand-secondary">
              Tell us about the subject you need help with and your learning goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-base font-semibold">
                  Subject *
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleInputChange('subject', value)}
                  required
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  What specific topic or concept do you need help with? *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the specific topic, problem, or concept you're struggling with..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-[120px] text-base"
                  required
                />
              </div>

              {/* Learning Goals */}
              <div className="space-y-2">
                <Label htmlFor="learningGoals" className="text-base font-semibold flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  What are your learning goals for this session?
                </Label>
                <Textarea
                  id="learningGoals"
                  placeholder="What do you hope to achieve? (e.g., understand a concept, solve problems, prepare for an exam)"
                  value={formData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                  className="min-h-[100px] text-base"
                />
              </div>

              {/* Preferred Time */}
              <div className="space-y-2">
                <Label htmlFor="preferredTime" className="text-base font-semibold flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Preferred Time Slot
                </Label>
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => handleInputChange('preferredTime', value)}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-base font-semibold flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Session Duration
                </Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleInputChange('duration', value)}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold button-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Submitting Request...
                    </div>
                  ) : (
                    'Submit Tutoring Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-8 border-brand-light/30 bg-brand-accent/10">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-brand-primary mb-3">
              What happens next?
            </h3>
            <div className="space-y-2 text-brand-secondary">
              <p>• Your request will be reviewed by our available interns</p>
              <p>• An intern will accept your request and schedule a session</p>
              <p>• You'll receive an email notification with session details</p>
              <p>• The session will be conducted online or in-person as arranged</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 