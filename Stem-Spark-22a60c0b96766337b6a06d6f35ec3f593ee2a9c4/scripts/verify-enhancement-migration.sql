-- STEM-Spark Enhancement Migration Verification Script
-- Run this script after the migration to verify all changes were applied correctly

-- ============================================================================
-- 1. VERIFY ROLE UPDATES
-- ============================================================================

SELECT 'Role Distribution' as check_name, role, COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- ============================================================================
-- 2. VERIFY NEW TABLES EXIST
-- ============================================================================

SELECT 'New Tables Created' as check_name, table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tutoring_sessions',
    'volunteer_opportunities', 
    'volunteer_signups',
    'volunteer_hours',
    'parent_student_relationships',
    'student_progress',
    'internships',
    'internship_applications',
    'notifications'
  )
ORDER BY table_name;

-- ============================================================================
-- 3. VERIFY INDEXES EXIST
-- ============================================================================

SELECT 'Indexes Created' as check_name, indexname, tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'tutoring_sessions',
    'volunteer_opportunities', 
    'volunteer_signups',
    'volunteer_hours',
    'parent_student_relationships',
    'student_progress',
    'internships',
    'internship_applications',
    'notifications'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. VERIFY TRIGGERS EXIST
-- ============================================================================

SELECT 'Triggers Created' as check_name, trigger_name, event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_log_tutoring_hours',
    'trigger_update_volunteer_count',
    'trigger_log_volunteer_event_hours',
    'trigger_update_internship_count'
  )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 5. VERIFY FUNCTIONS EXIST
-- ============================================================================

SELECT 'Functions Created' as check_name, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'log_tutoring_volunteer_hours',
    'update_volunteer_opportunity_count',
    'log_volunteer_event_hours',
    'update_internship_participant_count'
  )
ORDER BY routine_name;

-- ============================================================================
-- 6. VERIFY RLS POLICIES EXIST
-- ============================================================================

SELECT 'RLS Policies' as check_name, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tutoring_sessions',
    'volunteer_opportunities', 
    'volunteer_signups',
    'volunteer_hours',
    'parent_student_relationships',
    'student_progress',
    'internships',
    'internship_applications',
    'notifications'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. VERIFY VIEWS EXIST
-- ============================================================================

SELECT 'Views Created' as check_name, table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'volunteer_hours_summary',
    'student_progress_summary'
  )
ORDER BY table_name;

-- ============================================================================
-- 8. VERIFY COLUMN ADDITIONS TO PROFILES TABLE
-- ============================================================================

SELECT 'Profiles Table Columns' as check_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('intern_specialties', 'phone', 'bio')
ORDER BY column_name;

-- ============================================================================
-- 9. VERIFY DATA MIGRATION FROM USER_PROGRESS
-- ============================================================================

SELECT 'Data Migration Check' as check_name, 
       'user_progress records' as source_table,
       COUNT(*) as record_count
FROM user_progress
UNION ALL
SELECT 'Data Migration Check' as check_name,
       'student_progress records' as target_table,
       COUNT(*) as record_count
FROM student_progress;

-- ============================================================================
-- 10. VERIFY CONSTRAINT CHECKS
-- ============================================================================

-- Test role constraint
SELECT 'Role Constraint Test' as check_name, 
       CASE 
         WHEN EXISTS (
           SELECT 1 FROM information_schema.check_constraints 
           WHERE constraint_name = 'profiles_role_check' 
           AND check_clause LIKE '%intern%'
         ) THEN 'PASS - Role constraint includes intern'
         ELSE 'FAIL - Role constraint missing or incorrect'
       END as result;

-- ============================================================================
-- 11. SUMMARY REPORT
-- ============================================================================

SELECT 'Migration Summary' as report_section,
       'Tables Created' as metric,
       COUNT(*) as value
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tutoring_sessions', 'volunteer_opportunities', 'volunteer_signups',
    'volunteer_hours', 'parent_student_relationships', 'student_progress',
    'internships', 'internship_applications', 'notifications'
  )

UNION ALL

SELECT 'Migration Summary' as report_section,
       'Indexes Created' as metric,
       COUNT(*) as value
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND tablename IN (
    'tutoring_sessions', 'volunteer_opportunities', 'volunteer_signups',
    'volunteer_hours', 'parent_student_relationships', 'student_progress',
    'internships', 'internship_applications', 'notifications'
  )

UNION ALL

SELECT 'Migration Summary' as report_section,
       'Triggers Created' as metric,
       COUNT(*) as value
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_%'

UNION ALL

SELECT 'Migration Summary' as report_section,
       'Functions Created' as metric,
       COUNT(*) as value
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'log_tutoring_volunteer_hours',
    'update_volunteer_opportunity_count', 
    'log_volunteer_event_hours',
    'update_internship_participant_count'
  )

UNION ALL

SELECT 'Migration Summary' as report_section,
       'RLS Policies Created' as metric,
       COUNT(*) as value
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tutoring_sessions', 'volunteer_opportunities', 'volunteer_signups',
    'volunteer_hours', 'parent_student_relationships', 'student_progress',
    'internships', 'internship_applications', 'notifications'
  )

ORDER BY report_section, metric;