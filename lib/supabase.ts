import 'server-only';

import { getIdentityAdminClient } from '@/app/lib/supabase/adminDatabases.server';

// Compatibility exports. Both domains are owned by the Identity project.
export const supabaseAdmin = getIdentityAdminClient();
export const supabaseInfluencerAdmin = supabaseAdmin;

export default supabaseAdmin;
