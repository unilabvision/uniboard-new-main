import { NextResponse } from 'next/server';
import { requireMembershipsCapability } from '@/app/api/memberships/_helpers';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireMembershipsCapability('publish', { superAdminOnly: true });
  if (access.error || !access.supabase || !access.userId) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const { data, error } = await access.supabase.rpc('myuni_membership_publish_plan', {
    p_plan_id: id,
    p_actor_user_id: access.userId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ plan: data });
}
