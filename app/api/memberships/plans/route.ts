import { NextRequest, NextResponse } from 'next/server';
import {
  isMembershipPayloadTooLarge,
  requireMembershipsCapability,
  validateMembershipBenefitsPayload,
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
    .select(`
      id, family_code, code, version, duration_months, name_tr, name_en,
      description_tr, description_en, price, currency, status, is_visible,
      published_at, updated_at,
      myuni_membership_plan_benefits(
        id, plan_id, resource_type, access_scope, resource_id,
        capability, label_tr, label_en, sort_order
      )
    `)
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
  if (isMembershipPayloadTooLarge(request)) {
    return NextResponse.json({ error: 'Membership payload is too large' }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as SaveBody | null;
  if (!body?.plan || !Array.isArray(body.benefits)) {
    return NextResponse.json({ error: 'plan and benefits are required' }, { status: 400 });
  }
  const validationError = validateMembershipPlanPayload(body.plan);
  const benefitsValidationError = validateMembershipBenefitsPayload(body.benefits);
  if (validationError || benefitsValidationError) {
    return NextResponse.json(
      { error: validationError || benefitsValidationError },
      { status: 400 }
    );
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
