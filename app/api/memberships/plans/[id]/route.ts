import { NextRequest, NextResponse } from 'next/server';
import {
  isMembershipPayloadTooLarge,
  requireMembershipsCapability,
  validateMembershipBenefitsPayload,
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
  if (isMembershipPayloadTooLarge(request)) {
    return NextResponse.json({ error: 'Membership payload is too large' }, { status: 413 });
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
  const benefitsValidationError = validateMembershipBenefitsPayload(body.benefits);
  if (validationError || benefitsValidationError) {
    return NextResponse.json(
      { error: validationError || benefitsValidationError },
      { status: 400 }
    );
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireMembershipsCapability('edit', { superAdminOnly: true });
  if (access.error || !access.supabase || !access.userId) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const { data: plan, error: lookupError } = await access.supabase
    .from('myuni_membership_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!plan) {
    return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 });
  }
  if (plan.status === 'published') {
    return NextResponse.json(
      { error: 'Yayındaki paket silinemez. Önce başka bir sürüm yayınlayın.' },
      { status: 409 }
    );
  }

  const { data: existingPass, error: passLookupError } = await access.supabase
    .from('myuni_membership_passes')
    .select('id')
    .eq('plan_id', id)
    .limit(1)
    .maybeSingle();

  if (passLookupError) {
    return NextResponse.json({ error: passLookupError.message }, { status: 500 });
  }
  if (existingPass) {
    return NextResponse.json(
      { error: 'Satın alma geçmişi bulunan paket silinemez; arşivde tutulmalıdır.' },
      { status: 409 }
    );
  }

  const { data: deletedPlan, error: deleteError } = await access.supabase
    .from('myuni_membership_plans')
    .delete()
    .eq('id', id)
    .neq('status', 'published')
    .select('id')
    .maybeSingle();

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }
  if (!deletedPlan) {
    return NextResponse.json(
      { error: 'Paket durumu değişti; silme işlemi uygulanmadı.' },
      { status: 409 }
    );
  }

  const { error: auditError } = await access.supabase
    .from('myuni_membership_audit_log')
    .insert({
      actor_user_id: access.userId,
      action: 'plan.deleted',
      entity_type: 'membership_plan',
      entity_id: id,
      before_data: plan,
    });

  if (auditError) {
    console.error('[memberships] plan deletion audit failed', auditError);
  }

  return NextResponse.json({ deletedId: id });
}
