import { NextRequest, NextResponse } from 'next/server';
import {
  requireMembershipsCapability,
  validateMembershipPlanPayload,
} from '@/app/api/memberships/_helpers';
import type { MembershipBenefit } from '@/app/lib/memberships/types';

type SaveBody = {
  plan?: Record<string, unknown>;
  benefits?: MembershipBenefit[];
};

export async function GET() {
  const access = await requireMembershipsCapability('view');
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await access.supabase
    .from('myuni_membership_plans')
    .select('*, myuni_membership_plan_benefits(*)')
    .order('duration_months', { ascending: true })
    .order('version', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    plans: data ?? [],
    permissions: { canManage: access.isSuperAdmin === true },
  });
}

export async function POST(request: NextRequest) {
  const access = await requireMembershipsCapability('edit', { superAdminOnly: true });
  if (access.error || !access.supabase || !access.userId) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = (await request.json().catch(() => null)) as SaveBody | null;
  if (!body?.plan || !Array.isArray(body.benefits)) {
    return NextResponse.json({ error: 'plan and benefits are required' }, { status: 400 });
  }
  const validationError = validateMembershipPlanPayload(body.plan);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await access.supabase.rpc('myuni_membership_save_draft', {
    p_plan_id: null,
    p_payload: body.plan,
    p_benefits: body.benefits,
    p_actor_user_id: access.userId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ plan: data }, { status: 201 });
}
