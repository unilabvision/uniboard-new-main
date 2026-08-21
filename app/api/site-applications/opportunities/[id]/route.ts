import { NextRequest, NextResponse } from 'next/server';
import {
  requireSiteApplicationsCapability,
  resolveSiteApplicationsPanelOrganizationScope,
} from '@/app/api/site-applications/access/_helpers';
import { internshipDb } from '@/app/lib/internship/config';
import { siteApplicationsDb, slugifyFormValue } from '@/app/lib/siteApplications/config';

type RouteContext = { params: Promise<{ id: string }> };

const OPPORTUNITY_TYPES = new Set(['staj', 'gonullu', 'is']);

function normalizeWorkMode(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  if (!String(raw).trim()) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === 'uzaktan' || v === 'remote') return 'remote';
  if (v === 'hibrit' || v === 'hybrid' || v.includes('hibrit') || v.includes('hybrid')) {
    return 'hybrid';
  }
  if (
    v === 'yerinde' ||
    v === 'onsite' ||
    v === 'on-site' ||
    v === 'on_site' ||
    v === 'office' ||
    v.includes('yerinde')
  ) {
    return 'onsite';
  }
  if (v === 'remote' || v === 'hybrid' || v === 'onsite') return v;
  return null;
}

async function assertCanAccessOpportunity(
  supabase: NonNullable<
    Awaited<ReturnType<typeof requireSiteApplicationsCapability>>['supabase']
  >,
  userId: string,
  opportunityId: string
) {
  const scope = await resolveSiteApplicationsPanelOrganizationScope(supabase, userId);
  if (scope.mode === 'none') return { error: 'Forbidden', status: 403 as const, row: null };

  const { data: row, error } = await supabase
    .from(internshipDb.opportunities)
    .select('*')
    .eq('id', opportunityId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 as const, row: null };
  if (!row) return { error: 'Not found', status: 404 as const, row: null };

  if (scope.mode === 'scoped') {
    const orgId = row.panel_organization_id as string | null;
    if (!orgId || !scope.panelOrganizationIds.includes(orgId)) {
      return { error: 'Not found', status: 404 as const, row: null };
    }
  }

  return { error: null, status: 200 as const, row };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const access = await assertCanAccessOpportunity(authResult.supabase, authResult.userId, id);
  if (access.error || !access.row) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  return NextResponse.json({ opportunity: access.row });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const access = await assertCanAccessOpportunity(authResult.supabase, authResult.userId, id);
  if (access.error || !access.row) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title_tr !== undefined || body.title_en !== undefined) {
    const prevTitle = (access.row.title as Record<string, string>) || {};
    updates.title = {
      tr: body.title_tr !== undefined ? String(body.title_tr).trim() : prevTitle.tr || '',
      en:
        body.title_en !== undefined
          ? String(body.title_en).trim()
          : prevTitle.en || prevTitle.tr || '',
    };
  }

  if (body.description_tr !== undefined || body.description_en !== undefined) {
    const prevDesc = (access.row.description as Record<string, string>) || {};
    updates.description = {
      tr:
        body.description_tr !== undefined
          ? String(body.description_tr).trim()
          : prevDesc.tr || '',
      en:
        body.description_en !== undefined
          ? String(body.description_en).trim()
          : prevDesc.en || prevDesc.tr || '',
    };
  }

  if (body.company_name !== undefined) {
    updates.company_name = String(body.company_name).trim() || null;
  }
  if (body.location !== undefined) {
    updates.location = String(body.location).trim() || null;
  }
  if (body.work_mode !== undefined) {
    updates.work_mode = normalizeWorkMode(body.work_mode);
  }
  if (body.opportunity_type !== undefined) {
    const t = String(body.opportunity_type).trim().toLowerCase();
    if (!OPPORTUNITY_TYPES.has(t)) {
      return NextResponse.json({ error: 'Geçersiz fırsat türü' }, { status: 400 });
    }
    updates.opportunity_type = t;
  }
  if (body.application_deadline !== undefined) {
    updates.application_deadline = body.application_deadline || null;
  }
  if (body.is_featured !== undefined) {
    updates.is_featured = Boolean(body.is_featured);
  }
  if (body.banner_url !== undefined) {
    const raw = body.banner_url;
    updates.banner_url =
      raw === null || raw === '' ? null : String(raw).trim() || null;
  }
  if (body.thumbnail_url !== undefined) {
    const raw = body.thumbnail_url;
    updates.thumbnail_url =
      raw === null || raw === '' ? null : String(raw).trim() || null;
  }
  if (body.order_index !== undefined) {
    updates.order_index = Number(body.order_index) || 0;
  }

  if (body.slug !== undefined) {
    const slug = slugifyFormValue(String(body.slug));
    if (!slug) {
      return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 });
    }
    if (slug !== access.row.slug) {
      const { data: clash } = await authResult.supabase
        .from(internshipDb.opportunities)
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle();
      if (clash) {
        return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 409 });
      }
      updates.slug = slug;
    }
  }

  const syncPublish = body.is_active !== undefined;
  if (syncPublish) {
    updates.is_active = Boolean(body.is_active);
  }

  const { data: opportunity, error } = await authResult.supabase
    .from(internshipDb.opportunities)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync linked site form publish flags + titles/slugs when provided
  const siteFormId = opportunity.site_form_id as string | null;
  if (siteFormId) {
    const formUpdates: Record<string, unknown> = {};
    if (syncPublish) {
      formUpdates.is_active = Boolean(body.is_active);
      formUpdates.show_on_website = Boolean(body.is_active);
    }
    if (updates.title) {
      const t = updates.title as { tr: string; en: string };
      formUpdates.title_tr = t.tr;
      formUpdates.title_en = t.en;
    }
    if (updates.description) {
      const d = updates.description as { tr: string; en: string };
      formUpdates.subtitle_tr = d.tr || null;
      formUpdates.subtitle_en = d.en || null;
    }
    if (updates.slug) {
      formUpdates.slug_tr = updates.slug;
      formUpdates.slug_en = updates.slug;
    }
    if (Object.keys(formUpdates).length > 0) {
      await authResult.supabase
        .from(siteApplicationsDb.forms)
        .update(formUpdates)
        .eq('id', siteFormId);
    }
  }

  return NextResponse.json({ opportunity });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const access = await assertCanAccessOpportunity(authResult.supabase, authResult.userId, id);
  if (access.error || !access.row) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const siteFormId = access.row.site_form_id as string | null;

  const { error } = await authResult.supabase
    .from(internshipDb.opportunities)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deactivate linked form (keep history) rather than hard-delete applications
  if (siteFormId) {
    await authResult.supabase
      .from(siteApplicationsDb.forms)
      .update({ is_active: false, show_on_website: false })
      .eq('id', siteFormId);
  }

  return NextResponse.json({ success: true });
}
