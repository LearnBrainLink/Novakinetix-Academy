-- Create internships table
CREATE TABLE IF NOT EXISTS internships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('remote', 'hybrid', 'onsite')),
    duration TEXT NOT NULL,
    stipend TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create internship applications table
CREATE TABLE IF NOT EXISTS internship_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    application_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(internship_id, user_id)
);

-- Create RLS policies
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;

-- Policies for internships
CREATE POLICY "Internships are viewable by authenticated users"
    ON internships FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Internships are insertable by admins"
    ON internships FOR INSERT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Internships are updatable by admins"
    ON internships FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Internships are deletable by admins"
    ON internships FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Policies for internship applications
CREATE POLICY "Users can view their own applications"
    ON internship_applications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view applications for internships they manage"
    ON internship_applications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM internships
            WHERE internships.id = internship_applications.internship_id
            AND auth.jwt() ->> 'role' = 'admin'
        )
    );

CREATE POLICY "Users can create their own applications"
    ON internship_applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON internship_applications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any application"
    ON internship_applications FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_internships_updated_at
    BEFORE UPDATE ON internships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internship_applications_updated_at
    BEFORE UPDATE ON internship_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 