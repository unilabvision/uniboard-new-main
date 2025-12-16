'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

/**
 * Check if a user has access to a specific organization's certificates
 * 
 * @param clerkUserId The Clerk user ID
 * @param organizationId The organization ID to check access for
 * @returns Promise resolving to an object with access information
 */
export async function checkOrganizationAccess(clerkUserId: string, organizationId: number) {
  try {
    // Check if user has access to the certificates module and this specific organization
    const { data, error } = await supabase
      .from('user_module_access')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('module_key', 'certificates')
      .eq('organization_id', organizationId)
      .eq('is_enabled', true)
      .single();
    
    if (error) {
      console.error('Error checking organization access:', error);
      return { 
        hasAccess: false, 
        role: null,
        error: error.message 
      };
    }
    
    return {
      hasAccess: !!data,
      role: data?.organization_role || null,
      data
    };
  } catch (error: unknown) {
    console.error('Error checking organization access:', error);
    return { 
      hasAccess: false, 
      role: null,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

/**
 * Check if a user has access to any organization's certificates
 * 
 * @param clerkUserId The Clerk user ID
 * @returns Promise resolving to an object with access information
 */
export async function checkAnyCertificatesAccess(clerkUserId: string) {
  try {
    // Check if user has access to the certificates module for any organization
    const { data, error } = await supabase
      .from('user_module_access')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('module_key', 'certificates')
      .eq('is_enabled', true);
    
    if (error) {
      console.error('Error checking certificates access:', error);
      return { 
        hasAccess: false, 
        organizations: [],
        error: error.message 
      };
    }
    
    // If user has access, fetch the organizations they have access to
    if (data && data.length > 0) {
      const organizationIds = data
        .filter(access => access.organization_id)
        .map(access => access.organization_id);
      
      if (organizationIds.length > 0) {
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', organizationIds);
        
        if (orgsError) {
          console.error('Error fetching organizations:', orgsError);
          return {
            hasAccess: true,
            organizations: [],
            error: orgsError.message
          };
        }
        
        return {
          hasAccess: true,
          organizations: orgs || [],
          error: null
        };
      }
      
      // User has access to certificates module but not to specific organizations
      return {
        hasAccess: true,
        organizations: [],
        error: null
      };
    }
    
    // User has no access to certificates module
    return { 
      hasAccess: false, 
      organizations: [],
      error: null 
    };
  } catch (error: unknown) {
    console.error('Error checking certificates access:', error);
    return { 
      hasAccess: false,
      organizations: [],
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

/**
 * Get all organizations the user has access to for the certificates module
 * 
 * @param clerkUserId The Clerk user ID
 * @returns Promise resolving to an array of organization objects
 */
export async function getUserOrganizations(clerkUserId: string) {
  try {
    // First get the user's module access records
    const { data: accessData, error: accessError } = await supabase
      .from('user_module_access')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('module_key', 'certificates')
      .eq('is_enabled', true);
    
    if (accessError) {
      console.error('Error fetching user module access:', accessError);
      return [];
    }
    
    // Extract organization IDs
    const organizationIds = accessData
      ?.filter(access => access.organization_id)
      .map(access => access.organization_id) || [];
    
    if (organizationIds.length === 0) {
      return [];
    }
    
    // Fetch the organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .in('id', organizationIds)
      .order('name', { ascending: true });
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return [];
    }
    
    return organizations || [];
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
}

/**
 * Special function to handle access to Massive Bioinformatics certificates
 * 
 * @param clerkUserId The Clerk user ID
 * @returns Promise resolving to a boolean indicating if user has access
 */
export async function checkMassiveBioinformaticsAccess(clerkUserId: string) {
  try {
    // Get the organization ID for Massive Bioinformatics
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'massive-bioinformatics')
      .single();
    
    if (orgError || !orgData) {
      // Fallback to hardcoded ID if organization not found
      return checkOrganizationAccess(clerkUserId, 1); // Assuming Massive Bioinformatics has ID 1
    }
    
    return checkOrganizationAccess(clerkUserId, orgData.id);
  } catch (error) {
    console.error('Error checking Massive Bioinformatics access:', error);
    return { hasAccess: false, role: null, error: 'An error occurred' };
  }
}
