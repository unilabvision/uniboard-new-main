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
  const { data: plan, error: lookupError } = await access.supabase
    .from('myuni_membership_plans')
    .select('id, price, status')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!plan) {
    return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 });
  }
  if (plan.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft plans can be published' }, { status: 409 });
  }
  if (!Number.isFinite(Number(plan.price)) || Number(plan.price) <= 0) {
    return NextResponse.json({ error: 'Set a positive price before publishing' }, { status: 409 });
  }

  const { data, error } = await access.supabase.rpc('myuni_membership_publish_plan', {
    p_plan_id: id,
    p_actor_user_id: access.userId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ plan: data });
}
