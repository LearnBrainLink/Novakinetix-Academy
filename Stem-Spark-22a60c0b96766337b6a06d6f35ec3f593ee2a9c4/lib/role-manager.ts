import { createClient } from '@supabase/supabase-js';

export type UserRole = 'student' | 'intern' | 'parent' | 'admin';

export interface RoleInfo {
  role: UserRole;
  dashboardUrl: string;
  permissions: string[];
}

export const ROLE_CONFIG: Record<UserRole, RoleInfo> = {
  student: {
    role: 'student',
    dashboardUrl: '/student-dashboard',
    permissions: ['view_courses', 'request_tutoring', 'apply_internships', 'view_progress']
  },
  intern: {
    role: 'intern',
    dashboardUrl: '/intern-dashboard',
    permissions: ['tutor_students', 'volunteer_signup', 'view_volunteer_hours', 'manage_sessions']
  },
  admin: {
    role: 'admin',
    dashboardUrl: '/admin',
    permissions: ['manage_users', 'create_opportunities', 'view_all_hours', 'system_admin']
  },
  parent: {
    role: 'parent',
    dashboardUrl: '/parent-dashboard',
    permissions: ['view_child_progress', 'receive_notifications', 'contact_interns']
  }
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user role:', error);
    return 'student'; // Default to student if error
  }
  
  // Handle legacy 'teacher' role by mapping it to 'intern'
  if (data.role === 'teacher') {
    return 'intern';
  }
  
  return data.role as UserRole;
}

export async function getDashboardUrl(userId: string): Promise<string> {
  const role = await getUserRole(userId);
  return ROLE_CONFIG[role].dashboardUrl;
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return ROLE_CONFIG[role].permissions.includes(permission);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function isIntern(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'intern';
}

export async function isStudent(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'student';
}

export async function isParent(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'parent';
}

export async function canEditUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  // If users are the same, they can edit themselves
  if (currentUserId === targetUserId) {
    return true;
  }
  
  const currentUserRole = await getUserRole(currentUserId);
  const targetUserRole = await getUserRole(targetUserId);
  
  // Admins can edit non-admin users
  if (currentUserRole === 'admin' && targetUserRole !== 'admin') {
    return true;
  }
  
  // Otherwise, users cannot edit other users
  return false;
}

export async function canDeleteUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  // Users cannot delete themselves
  if (currentUserId === targetUserId) {
    return false;
  }
  
  const currentUserRole = await getUserRole(currentUserId);
  const targetUserRole = await getUserRole(targetUserId);
  
  // Admins can delete non-admin users
  if (currentUserRole === 'admin' && targetUserRole !== 'admin') {
    return true;
  }
  
  // Otherwise, users cannot delete other users
  return false;
}

export async function canManageVolunteerHours(currentUserId: string): Promise<boolean> {
  const role = await getUserRole(currentUserId);
  return role === 'admin';
}

export async function canCreateVolunteerOpportunities(currentUserId: string): Promise<boolean> {
  const role = await getUserRole(currentUserId);
  return role === 'admin';
}

export async function canViewAllVolunteerHours(currentUserId: string): Promise<boolean> {
  const role = await getUserRole(currentUserId);
  return role === 'admin';
}

export async function logAdminAction(adminId: string, action: string, targetUserId?: string, details?: any): Promise<void> {
  try {
    await supabase.from('user_activities').insert({
      user_id: adminId,
      activity_type: 'admin_action',
      activity_description: action,
      metadata: {
        target_user_id: targetUserId,
        details: details,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// Export a roleManager object with all functions
export const roleManager = {
  getUserRole,
  getDashboardUrl,
  hasPermission,
  isAdmin,
  isIntern,
  isStudent,
  isParent,
  canEditUser,
  canDeleteUser,
  canManageVolunteerHours,
  canCreateVolunteerOpportunities,
  canViewAllVolunteerHours,
  logAdminAction,
  // Add missing functions that are being used
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },
  upsertUserProfile: async (user: any, role: UserRole, additionalData?: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
        avatar_url: user.user_metadata?.avatar_url || null,
        ...additionalData
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting user profile:', error);
      return false;
    }
    
    return true;
  },
  migrateExistingUsersRoles: async () => {
    // This function would handle migrating existing users to new role system
    // For now, return true as placeholder
    return true;
  }
};