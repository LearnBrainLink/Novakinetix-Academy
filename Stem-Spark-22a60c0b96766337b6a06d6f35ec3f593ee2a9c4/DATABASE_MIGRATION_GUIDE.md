# STEM-Spark Database Enhancement Migration Guide

This guide walks you through the database schema enhancement migration for the STEM-Spark platform transformation.

## Overview

The migration transforms your existing STEM-Spark platform database to support:
- Role change from "teacher" to "intern"
- Tutoring session management
- Volunteer opportunity tracking
- Volunteer hours logging
- Parent dashboard functionality
- Enhanced student progress tracking
- Internship application system
- Comprehensive notification system

## Prerequisites

1. **Backup your database** before running any migration scripts
2. Access to your Supabase project's SQL editor
3. Admin privileges on your Supabase project

## Migration Files

- `stem-spark-enhancement-migration.sql` - Main migration script
- `rollback-enhancement-migration.sql` - Rollback script (if needed)
- `verify-enhancement-migration.sql` - Verification script

## Step-by-Step Migration Process

### Step 1: Backup Your Database

Before proceeding, create a backup of your current database:

1. Go to your Supabase Dashboard
2. Navigate to Settings > Database
3. Create a backup or export your current schema and data

### Step 2: Run the Migration Script

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `scripts/stem-spark-enhancement-migration.sql`
4. Click "Run" to execute the migration

The script will:
- Update existing "teacher" roles to "intern"
- Create all new tables with proper relationships
- Add indexes for performance optimization
- Create database functions for automation
- Set up triggers for automatic data management
- Enable Row Level Security (RLS) with appropriate policies
- Migrate existing data where applicable

### Step 3: Verify the Migration

After running the migration, verify it was successful:

1. In the SQL Editor, run the contents of `scripts/verify-enhancement-migration.sql`
2. Review the output to ensure all components were created successfully
3. Check that role updates were applied correctly

Expected verification results:
- All new tables should be listed
- Indexes should be created for performance
- Triggers should be active
- RLS policies should be in place
- Role distribution should show "intern" instead of "teacher"

### Step 4: Test Basic Functionality

Run these test queries to ensure the system is working:

```sql
-- Test role constraint
INSERT INTO profiles (id, email, full_name, role) 
VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'intern');

-- Test tutoring session creation
INSERT INTO tutoring_sessions (student_id, subject, description, scheduled_time)
VALUES (
  (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
  'Mathematics',
  'Help with algebra',
  NOW() + INTERVAL '1 day'
);

-- Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';
```

## New Database Schema Overview

### Core Tables Added

1. **tutoring_sessions** - Manages tutoring requests and sessions
2. **volunteer_opportunities** - Stores volunteer events and opportunities
3. **volunteer_signups** - Tracks intern signups for volunteer opportunities
4. **volunteer_hours** - Logs and tracks volunteer hours by activity type
5. **parent_student_relationships** - Links parents to their children
6. **student_progress** - Enhanced progress tracking (replaces user_progress)
7. **internships** - Manages internship opportunities
8. **internship_applications** - Tracks student applications to internships
9. **notifications** - System-wide notification management

### Automated Features

The migration includes several automated features:

1. **Automatic Volunteer Hours Logging**
   - Tutoring sessions automatically log hours when completed
   - Volunteer events automatically log hours when attended

2. **Participant Count Management**
   - Volunteer opportunities automatically update participant counts
   - Internships automatically track application counts

3. **Status Management**
   - Opportunities automatically change to "full" when capacity is reached
   - Status reverts to "active" when participants withdraw

## Rollback Procedure

If you need to rollback the migration:

1. **WARNING**: This will delete all data in the new tables
2. Run the `scripts/rollback-enhancement-migration.sql` script
3. This will restore the database to its pre-migration state

## Post-Migration Tasks

After successful migration:

1. **Update Application Code**
   - Update role references from "teacher" to "intern"
   - Implement new dashboard components
   - Add tutoring and volunteer functionality

2. **Configure Email Templates**
   - Set up email templates for notifications
   - Configure Flask Mail service (if using)

3. **Test User Workflows**
   - Test student tutoring requests
   - Test intern volunteer signup
   - Test parent dashboard access
   - Test admin management functions

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure you have admin access to your Supabase project
   - Check that RLS policies are correctly applied

2. **Constraint Violations**
   - Verify existing data doesn't violate new constraints
   - Check foreign key relationships

3. **Function/Trigger Errors**
   - Ensure all functions are created before triggers
   - Check function syntax and permissions

### Getting Help

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Run the verification script to identify what failed
3. Use the rollback script if necessary to restore previous state
4. Review the migration script for any customizations needed for your setup

## Performance Considerations

The migration includes performance optimizations:

- Indexes on frequently queried columns
- Efficient RLS policies
- Optimized database functions
- Proper foreign key relationships

Monitor your database performance after migration and adjust as needed.

## Security Notes

The migration implements comprehensive security:

- Row Level Security (RLS) on all tables
- Role-based access control
- Admin account protection
- Secure database functions

Review the RLS policies to ensure they meet your security requirements.

## Next Steps

After successful migration:

1. Proceed with Task 2: Role System Migration and Authentication Enhancement
2. Update your application code to use the new database schema
3. Implement the new dashboard interfaces
4. Test all functionality thoroughly before deploying to production

## Support

For additional support or questions about the migration:

1. Review the requirements and design documents
2. Check the task implementation plan
3. Test in a development environment first
4. Keep backups of your production database