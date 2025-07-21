-- STEM-Spark Enhancement Migration Rollback Script
-- This script rolls back the database schema changes made by the enhancement migration
-- WARNING: This will delete all data in the new tables. Use with caution!

-- Start transaction for atomic execution
BEGIN;

-- ============================================================================
-- 1. DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_log_tutoring_hours ON tutoring_sessions;
DROP TRIGGER IF EXISTS trigger_update_volunteer_count ON volunteer_signups;
DROP TRIGGER IF EXISTS trigger_log_volunteer_event_hours ON volunteer_signups;
DROP TRIGGER IF EXISTS trigger_update_internship_count ON internship_applications;

-- ============================================================================
-- 2. DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS log_tutoring_volunteer_hours();
DROP FUNCTION IF EXISTS update_volunteer_opportunity_count();
DROP FUNCTION IF EXISTS log_volunteer_event_hours();
DROP FUNCTION IF EXISTS update_internship_participant_count();

-- ============================================================================
-- 3. DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS volunteer_hours_summary;
DROP VIEW IF EXISTS student_progress_summary;

-- ============================================================================
-- 4. DROP NEW TABLES (in reverse dependency order)
-- ============================================================================

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS internship_applications;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS parent_student_relationships;
DROP TABLE IF EXISTS volunteer_hours;
DROP TABLE IF EXISTS volunteer_signups;
DROP TABLE IF EXISTS volunteer_opportunities;
DROP TABLE IF EXISTS tutoring_sessions;

-- ============================================================================
-- 5. REVERT PROFILES TABLE CHANGES
-- ============================================================================

-- Remove new columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS intern_specialties,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS bio;

-- Update intern roles back to teacher (if you want to revert this)
UPDATE profiles 
SET role = 'teacher', updated_at = NOW() 
WHERE role = 'intern';

-- Revert role constraint to original
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'teacher', 'parent', 'admin'));

-- Commit rollback
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after rollback to verify)
-- ============================================================================

-- Check if intern roles were reverted to teacher
-- SELECT role, COUNT(*) FROM profiles GROUP BY role;

-- Check if new tables were dropped
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%volunteer%' OR table_name LIKE '%tutoring%');

-- Check if triggers were dropped
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';