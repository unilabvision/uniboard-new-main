import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug, name')
    .order('name', { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ organizations: data || [] });
}
