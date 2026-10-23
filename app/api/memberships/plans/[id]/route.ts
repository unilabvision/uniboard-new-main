import { NextRequest, NextResponse } from 'next/server';
import {
  requireMembershipsCapability,
  validateMembershipPlanPayload,
} from '@/app/api/memberships/_helpers';
import type { MembershipBenefit } from '@/app/lib/memberships/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireMembershipsCapability('edit', { superAdminOnly: true });
  if (access.error || !access.supabase || !access.userId) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    plan?: Record<string, unknown>;
    benefits?: MembershipBenefit[];
  } | null;
  if (!body?.plan || !Array.isArray(body.benefits)) {
    return NextResponse.json({ error: 'plan and benefits are required' }, { status: 400 });
  }
  const validationError = validateMembershipPlanPayload(body.plan);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await access.supabase.rpc('myuni_membership_save_draft', {
    p_plan_id: id,
    p_payload: body.plan,
    p_benefits: body.benefits,
    p_actor_user_id: access.userId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ plan: data });
}
