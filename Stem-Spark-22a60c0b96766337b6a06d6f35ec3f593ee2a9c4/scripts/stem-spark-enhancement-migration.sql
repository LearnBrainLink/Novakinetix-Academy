-- STEM-Spark Enhancement Migration Script
-- This script updates the database schema to support the enhanced functionality
-- Run this script in your Supabase SQL editor

-- Start transaction for atomic execution
BEGIN;

-- ============================================================================
-- 1. UPDATE EXISTING SCHEMA
-- ============================================================================

-- Update profiles table role constraint to include 'intern' and remove 'teacher'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'intern', 'parent', 'admin'));

-- Update existing teacher roles to intern
UPDATE profiles 
SET role = 'intern', updated_at = NOW() 
WHERE role = 'teacher';

-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS intern_specialties TEXT[],
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================================================
-- 2. CREATE NEW TABLES FOR ENHANCED FUNCTIONALITY
-- ============================================================================

-- Create tutoring_sessions table
CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intern_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  session_notes TEXT,
  learning_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volunteer_opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER DEFAULT NULL,
  current_participants INTEGER DEFAULT 0,
  required_skills TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volunteer_signups table
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  intern_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'attended', 'no_show', 'cancelled')),
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  notes TEXT,
  UNIQUE(opportunity_id, intern_id)
);

-- Create volunteer_hours table
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intern_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('tutoring', 'event', 'other')),
  activity_description TEXT NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reference_id UUID, -- References tutoring_sessions.id or volunteer_opportunities.id
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parent_student_relationships table
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian', 'other')),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Create student_progress table (enhanced version of user_progress)
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  time_spent_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, lesson_id)
);

-- Create internships table
CREATE TABLE IF NOT EXISTS internships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  duration TEXT NOT NULL,
  requirements TEXT NOT NULL,
  application_deadline DATE,
  start_date DATE,
  end_date DATE,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create internship_applications table
CREATE TABLE IF NOT EXISTS internship_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_text TEXT NOT NULL,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT,
  UNIQUE(internship_id, student_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tutoring', 'volunteer', 'progress', 'system', 'internship')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Tutoring sessions indexes
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student_id ON tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_intern_id ON tutoring_sessions(intern_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON tutoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_scheduled_time ON tutoring_sessions(scheduled_time);

-- Volunteer opportunities indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_event_date ON volunteer_opportunities(event_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_created_by ON volunteer_opportunities(created_by);

-- Volunteer hours indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_intern_id ON volunteer_hours(intern_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_activity_type ON volunteer_hours(activity_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_activity_date ON volunteer_hours(activity_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_hours_status ON volunteer_hours(status);

-- Student progress indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course_id ON student_progress(course_id);

-- Parent-student relationship indexes
CREATE INDEX IF NOT EXISTS idx_parent_student_relationships_parent_id ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_relationships_student_id ON parent_student_relationships(student_id);

-- Internship indexes
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_application_deadline ON internships(application_deadline);
CREATE INDEX IF NOT EXISTS idx_internship_applications_student_id ON internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_status ON internship_applications(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- 4. CREATE DATABASE FUNCTIONS FOR AUTOMATION
-- ============================================================================

-- Function to automatically log volunteer hours when tutoring session is completed
CREATE OR REPLACE FUNCTION log_tutoring_volunteer_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL) THEN
    INSERT INTO volunteer_hours (
      intern_id,
      activity_type,
      activity_description,
      hours,
      activity_date,
      reference_id,
      status
    ) VALUES (
      NEW.intern_id,
      'tutoring',
      'Tutoring session: ' || NEW.subject,
      NEW.duration_minutes / 60.0,
      NEW.scheduled_time,
      NEW.id,
      'approved'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update volunteer opportunity participant count
CREATE OR REPLACE FUNCTION update_volunteer_opportunity_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'signed_up' THEN
    UPDATE volunteer_opportunities
    SET current_participants = current_participants + 1,
        status = CASE 
                  WHEN max_participants IS NOT NULL AND current_participants + 1 >= max_participants THEN 'full'
                  ELSE status
                END,
        updated_at = NOW()
    WHERE id = NEW.opportunity_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'signed_up' AND NEW.status IN ('cancelled', 'no_show') THEN
      UPDATE volunteer_opportunities
      SET current_participants = current_participants - 1,
          status = CASE 
                    WHEN status = 'full' AND (max_participants IS NULL OR current_participants - 1 < max_participants) THEN 'active'
                    ELSE status
                  END,
          updated_at = NOW()
      WHERE id = NEW.opportunity_id;
    ELSIF OLD.status IN ('cancelled', 'no_show') AND NEW.status = 'signed_up' THEN
      UPDATE volunteer_opportunities
      SET current_participants = current_participants + 1,
          status = CASE 
                    WHEN max_participants IS NOT NULL AND current_participants + 1 >= max_participants THEN 'full'
                    ELSE status
                  END,
          updated_at = NOW()
      WHERE id = NEW.opportunity_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'signed_up' THEN
    UPDATE volunteer_opportunities
    SET current_participants = current_participants - 1,
        status = CASE 
                  WHEN status = 'full' AND (max_participants IS NULL OR current_participants - 1 < max_participants) THEN 'active'
                  ELSE status
                END,
        updated_at = NOW()
    WHERE id = OLD.opportunity_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log volunteer hours when volunteer event is completed
CREATE OR REPLACE FUNCTION log_volunteer_event_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_opportunity RECORD;
  v_hours DECIMAL(5,2);
BEGIN
  IF NEW.status = 'attended' AND (OLD.status != 'attended' OR OLD.status IS NULL) THEN
    SELECT * INTO v_opportunity FROM volunteer_opportunities WHERE id = NEW.opportunity_id;
    
    -- Calculate hours based on event duration (default to 2 hours if not specified)
    v_hours := 2.0; -- Default volunteer event duration
    
    INSERT INTO volunteer_hours (
      intern_id,
      activity_type,
      activity_description,
      hours,
      activity_date,
      reference_id,
      status
    ) VALUES (
      NEW.intern_id,
      'event',
      'Volunteer event: ' || v_opportunity.title,
      v_hours,
      v_opportunity.event_date,
      NEW.opportunity_id,
      'approved'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update internship participant count
CREATE OR REPLACE FUNCTION update_internship_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE internships
    SET current_participants = current_participants + 1,
        status = CASE 
                  WHEN max_participants IS NOT NULL AND current_participants + 1 >= max_participants THEN 'full'
                  ELSE status
                END,
        updated_at = NOW()
    WHERE id = NEW.internship_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'accepted' AND NEW.status IN ('rejected', 'withdrawn') THEN
      UPDATE internships
      SET current_participants = current_participants - 1,
          status = CASE 
                    WHEN status = 'full' AND (max_participants IS NULL OR current_participants - 1 < max_participants) THEN 'active'
                    ELSE status
                  END,
          updated_at = NOW()
      WHERE id = NEW.internship_id;
    ELSIF OLD.status IN ('rejected', 'withdrawn', 'pending') AND NEW.status = 'accepted' THEN
      UPDATE internships
      SET current_participants = current_participants + 1,
          status = CASE 
                    WHEN max_participants IS NOT NULL AND current_participants + 1 >= max_participants THEN 'full'
                    ELSE status
                  END,
          updated_at = NOW()
      WHERE id = NEW.internship_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CREATE TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger for automatic volunteer hours logging from tutoring sessions
DROP TRIGGER IF EXISTS trigger_log_tutoring_hours ON tutoring_sessions;
CREATE TRIGGER trigger_log_tutoring_hours
  AFTER UPDATE OR INSERT ON tutoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_tutoring_volunteer_hours();

-- Trigger for automatic volunteer opportunity participant count
DROP TRIGGER IF EXISTS trigger_update_volunteer_count ON volunteer_signups;
CREATE TRIGGER trigger_update_volunteer_count
  AFTER INSERT OR UPDATE OR DELETE ON volunteer_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_opportunity_count();

-- Trigger for automatic volunteer event hours logging
DROP TRIGGER IF EXISTS trigger_log_volunteer_event_hours ON volunteer_signups;
CREATE TRIGGER trigger_log_volunteer_event_hours
  AFTER UPDATE OR INSERT ON volunteer_signups
  FOR EACH ROW
  EXECUTE FUNCTION log_volunteer_event_hours();

-- Trigger for automatic internship participant count
DROP TRIGGER IF EXISTS trigger_update_internship_count ON internship_applications;
CREATE TRIGGER trigger_update_internship_count
  AFTER INSERT OR UPDATE ON internship_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_internship_participant_count();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tutoring sessions policies
CREATE POLICY "Users can view their own tutoring sessions" 
ON tutoring_sessions FOR SELECT 
USING (auth.uid() = student_id OR auth.uid() = intern_id);

CREATE POLICY "Students can create tutoring requests" 
ON tutoring_sessions FOR INSERT 
WITH CHECK (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Interns can update sessions they're assigned to" 
ON tutoring_sessions FOR UPDATE 
USING (auth.uid() = intern_id);

CREATE POLICY "Students can update their own pending sessions" 
ON tutoring_sessions FOR UPDATE 
USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Admins have full access to tutoring sessions" 
ON tutoring_sessions FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Volunteer opportunities policies
CREATE POLICY "Anyone can view active volunteer opportunities" 
ON volunteer_opportunities FOR SELECT 
USING (status IN ('active', 'full'));

CREATE POLICY "Admins can manage volunteer opportunities" 
ON volunteer_opportunities FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Volunteer signups policies
CREATE POLICY "Interns can view their own signups" 
ON volunteer_signups FOR SELECT 
USING (auth.uid() = intern_id);

CREATE POLICY "Interns can sign up for opportunities" 
ON volunteer_signups FOR INSERT 
WITH CHECK (auth.uid() = intern_id);

CREATE POLICY "Interns can update their own signups" 
ON volunteer_signups FOR UPDATE 
USING (auth.uid() = intern_id);

CREATE POLICY "Admins have full access to volunteer signups" 
ON volunteer_signups FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Volunteer hours policies
CREATE POLICY "Interns can view their own volunteer hours" 
ON volunteer_hours FOR SELECT 
USING (auth.uid() = intern_id);

CREATE POLICY "Admins can view all volunteer hours" 
ON volunteer_hours FOR SELECT 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "System can insert volunteer hours" 
ON volunteer_hours FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update volunteer hours" 
ON volunteer_hours FOR UPDATE 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Parent-student relationship policies
CREATE POLICY "Parents can view their own relationships" 
ON parent_student_relationships FOR SELECT 
USING (auth.uid() = parent_id);

CREATE POLICY "Students can view their own parent relationships" 
ON parent_student_relationships FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage parent-student relationships" 
ON parent_student_relationships FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Student progress policies
CREATE POLICY "Students can view their own progress" 
ON student_progress FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their children's progress" 
ON student_progress FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM parent_student_relationships 
  WHERE parent_id = auth.uid() AND student_id = student_progress.student_id
));

CREATE POLICY "System can update student progress" 
ON student_progress FOR ALL
USING (true);

CREATE POLICY "Admins can manage student progress" 
ON student_progress FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Internships policies
CREATE POLICY "Anyone can view active internships" 
ON internships FOR SELECT 
USING (status IN ('active', 'full'));

CREATE POLICY "Admins can manage internships" 
ON internships FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Internship applications policies
CREATE POLICY "Students can view their own applications" 
ON internship_applications FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create applications" 
ON internship_applications FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own pending applications" 
ON internship_applications FOR UPDATE 
USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Admins can manage all applications" 
ON internship_applications FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" 
ON notifications FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 7. MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate existing user_progress data to student_progress
INSERT INTO student_progress (student_id, course_id, lesson_id, completed, score, completed_at, created_at)
SELECT user_id, course_id, lesson_id, completed, score, completed_at, created_at
FROM user_progress
ON CONFLICT (student_id, course_id, lesson_id) DO NOTHING;

-- ============================================================================
-- 8. CREATE HELPER VIEWS FOR REPORTING
-- ============================================================================

-- View for volunteer hours summary by intern
CREATE OR REPLACE VIEW volunteer_hours_summary AS
SELECT 
  vh.intern_id,
  p.full_name,
  p.email,
  SUM(vh.hours) as total_hours,
  SUM(CASE WHEN vh.activity_type = 'tutoring' THEN vh.hours ELSE 0 END) as tutoring_hours,
  SUM(CASE WHEN vh.activity_type = 'event' THEN vh.hours ELSE 0 END) as event_hours,
  SUM(CASE WHEN vh.activity_type = 'other' THEN vh.hours ELSE 0 END) as other_hours,
  COUNT(*) as total_activities
FROM volunteer_hours vh
JOIN profiles p ON vh.intern_id = p.id
WHERE vh.status = 'approved'
GROUP BY vh.intern_id, p.full_name, p.email;

-- View for student progress summary
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
  sp.student_id,
  p.full_name,
  p.email,
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN sp.completed THEN 1 END) as completed_lessons,
  ROUND(COUNT(CASE WHEN sp.completed THEN 1 END) * 100.0 / COUNT(*), 2) as completion_percentage,
  AVG(sp.score) as average_score,
  SUM(sp.time_spent_minutes) as total_time_minutes
FROM student_progress sp
JOIN profiles p ON sp.student_id = p.id
GROUP BY sp.student_id, p.full_name, p.email;

-- Commit all changes
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the migration to verify success)
-- ============================================================================

-- Check if teacher roles were updated to intern
-- SELECT role, COUNT(*) FROM profiles GROUP BY role;

-- Check if new tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%volunteer%' OR table_name LIKE '%tutoring%';

-- Check if indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('tutoring_sessions', 'volunteer_opportunities', 'volunteer_hours');

-- Check if triggers were created
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';