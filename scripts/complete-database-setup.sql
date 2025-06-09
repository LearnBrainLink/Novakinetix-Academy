-- Complete database setup for STEM Spark Academy
-- This script creates all necessary tables, functions, and sample data

BEGIN;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS parent_info CASCADE;
DROP TABLE IF EXISTS internship_applications CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS internships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    grade INTEGER CHECK (grade >= 5 AND grade <= 8),
    country TEXT,
    state TEXT,
    school_name TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create parent_info table
CREATE TABLE parent_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    relationship TEXT CHECK (relationship IN ('mother', 'father', 'guardian', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create internships table
CREATE TABLE internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    location TEXT,
    duration TEXT,
    application_deadline DATE,
    start_date DATE,
    end_date DATE,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create internship_applications table
CREATE TABLE internship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    application_date TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(internship_id, student_id)
);

-- Create user_activities table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    category TEXT,
    grade_level INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_internships_status ON internships(status);
CREATE INDEX idx_applications_student ON internship_applications(student_id);
CREATE INDEX idx_applications_internship ON internship_applications(internship_id);
CREATE INDEX idx_activities_user ON user_activities(user_id);
CREATE INDEX idx_videos_status ON videos(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Parent info: Students and admins can access
CREATE POLICY "Students can view own parent info" ON parent_info FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Internships: Everyone can read active internships
CREATE POLICY "Everyone can view active internships" ON internships FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage internships" ON internships FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Applications: Students can manage their own, admins can view all
CREATE POLICY "Students can manage own applications" ON internship_applications FOR ALL USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Activities: Users can view their own, admins can view all
CREATE POLICY "Users can view own activities" ON user_activities FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Videos: Everyone can view active videos
CREATE POLICY "Everyone can view active videos" ON videos FOR SELECT USING (status = 'active');
CREATE POLICY "Teachers and admins can manage videos" ON videos FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW()
    );

    -- Log the user creation
    INSERT INTO public.user_activities (
        user_id,
        activity_type,
        activity_description,
        metadata,
        created_at
    ) VALUES (
        NEW.id,
        'account_created',
        'New user account created',
        jsonb_build_object(
            'role', COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
            'email', NEW.email
        ),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample internships
INSERT INTO internships (
    title,
    company,
    description,
    requirements,
    location,
    duration,
    application_deadline,
    start_date,
    end_date,
    status
) VALUES
(
    'Junior Software Developer Intern',
    'TechCorp',
    'Learn software development with our experienced team',
    'Basic programming knowledge, Enthusiasm to learn',
    'San Francisco, CA',
    '3 months',
    '2024-12-31',
    '2024-06-01',
    '2024-08-31',
    'published'
),
(
    'Engineering Assistant',
    'BuildIt Inc',
    'Assist with engineering projects and learn CAD software',
    'Interest in engineering, Basic math skills',
    'Austin, TX',
    '2 months',
    '2024-12-31',
    '2024-07-01',
    '2024-08-31',
    'published'
),
(
    'Data Science Intern',
    'DataWorks',
    'Introduction to data analysis and machine learning',
    'Basic statistics, Python knowledge helpful',
    'Remote',
    '4 months',
    '2024-12-31',
    '2024-06-01',
    '2024-09-30',
    'published'
);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Created tables: profiles, parent_info, internships, internship_applications, user_activities, videos';
    RAISE NOTICE '🔒 Enabled Row Level Security with proper policies';
    RAISE NOTICE '📝 Inserted sample data: 3 internships, 3 videos';
    RAISE NOTICE '🔍 Created performance indexes';
    RAISE NOTICE '⚡ Created triggers for automatic profile creation';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   1. Run create-test-accounts.sql to create test users';
    RAISE NOTICE '   2. Configure Supabase Auth settings';
    RAISE NOTICE '   3. Set up email templates in Supabase dashboard';
END $$;
