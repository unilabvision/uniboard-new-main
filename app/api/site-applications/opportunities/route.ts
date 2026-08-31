import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import {
  requireSiteApplicationsCapability,
  resolveSiteApplicationsPanelOrganizationScope,
  resolvePanelOrganizationIdForWrite,
  getServiceSupabase,
} from '@/app/api/site-applications/access/_helpers';
import { internshipDb } from '@/app/lib/internship/config';
import { siteApplicationsDb, slugifyFormValue } from '@/app/lib/siteApplications/config';
import { getDefaultFieldsForFormType, inferFormType } from '@/app/lib/siteApplications/formTypes';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';

const OPPORTUNITY_TYPES = new Set(['staj', 'gonullu', 'is']);
const SITE_MODULE_KEYS = [
  'site-applications',
  'site_basvurular',
  'site-basvurular',
  'basvurular',
  'events',
  'event',
  'etkinlik',
  'etkinlikler',
];

function normalizeWorkMode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  // DB check: myuni_opportunities_work_mode_check → remote | hybrid | onsite
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

async function getAllowedCreatorIds(
  supabase: ReturnType<typeof getServiceSupabase>,
  panelOrganizationIds: string[]
): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_module_access')
    .select('clerk_user_id')
    .eq('is_enabled', true)
    .in('module_key', SITE_MODULE_KEYS)
    .in('panel_organization_id', panelOrganizationIds);
  return new Set((data ?? []).map((r: { clerk_user_id: string }) => r.clerk_user_id));
}

async function assertFormInScope(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  formId: string
) {
  const scope = await resolveSiteApplicationsPanelOrganizationScope(supabase, userId);
  const { data: form, error } = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq('id', formId)
    .maybeSingle();
  if (error) return { error: error.message, status: 500 as const, form: null };
  if (!form) return { error: 'Form bulunamadı', status: 404 as const, form: null };
  if (scope.mode === 'none') return { error: 'Forbidden', status: 403 as const, form: null };
  if (scope.mode === 'scoped') {
    const creators = await getAllowedCreatorIds(supabase, scope.panelOrganizationIds);
    const createdBy = form.created_by as string | null;
    if (!createdBy || !creators.has(createdBy)) {
      return { error: 'Form bulunamadı', status: 404 as const, form: null };
    }
  }
  return { error: null, status: 200 as const, form };
}

export async function GET() {
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;
  const scope = await resolveSiteApplicationsPanelOrganizationScope(supabase, authResult.userId);

  if (scope.mode === 'none') {
    return NextResponse.json({ opportunities: [], unlinkedForms: [] });
  }

  let query = supabase
    .from(internshipDb.opportunities)
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (scope.mode === 'scoped') {
    const creators = await getAllowedCreatorIds(supabase, scope.panelOrganizationIds);
    const creatorList = Array.from(creators);

    const { data: orgForms } = creatorList.length
      ? await supabase
          .from(siteApplicationsDb.forms)
          .select('id')
          .in('created_by', creatorList)
      : { data: [] as { id: string }[] };

    const formIds = (orgForms ?? []).map((f) => f.id);
    const orgIds = scope.panelOrganizationIds;

    // Own org rows OR legacy rows linked to org forms OR created by org members
    const orParts: string[] = [`panel_organization_id.in.(${orgIds.join(',')})`];
    if (formIds.length > 0) {
      orParts.push(`site_form_id.in.(${formIds.join(',')})`);
    }
    if (creatorList.length > 0) {
      orParts.push(`created_by.in.(${creatorList.map((id) => `"${id}"`).join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const opportunitiesRaw = data ?? [];
  const linkedFormIds = new Set(
    opportunitiesRaw
      .map((o) => o.site_form_id as string | null)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  );

  // Attach linked form slugs for correct “Başvuru formu” public URLs
  const formIdList = Array.from(linkedFormIds);
  const formSlugById = new Map<string, { slug_tr: string | null; slug_en: string | null }>();
  if (formIdList.length > 0) {
    const { data: linkedForms } = await supabase
      .from(siteApplicationsDb.forms)
      .select('id, slug_tr, slug_en')
      .in('id', formIdList);
    for (const f of linkedForms ?? []) {
      formSlugById.set(String(f.id), {
        slug_tr: f.slug_tr ?? null,
        slug_en: f.slug_en ?? null,
      });
    }
  }

  const opportunities = opportunitiesRaw.map((o) => {
    const formMeta = o.site_form_id ? formSlugById.get(String(o.site_form_id)) : undefined;
    return {
      ...o,
      form_slug_tr: formMeta?.slug_tr || o.slug || null,
      form_slug_en: formMeta?.slug_en || o.slug || null,
    };
  });

  // Team forms without a linked opportunity — so existing form can become a listing
  let formsQuery = supabase
    .from(siteApplicationsDb.forms)
    .select('id, title_tr, title_en, slug_tr, slug_en, is_active, show_on_website, form_type, event_id, created_by, created_at')
    .order('created_at', { ascending: false });

  if (scope.mode === 'scoped') {
    const creators = await getAllowedCreatorIds(supabase, scope.panelOrganizationIds);
    const creatorList = Array.from(creators);
    if (creatorList.length === 0) {
      return NextResponse.json({ opportunities, unlinkedForms: [] });
    }
    formsQuery = formsQuery.in('created_by', creatorList);
  }

  const { data: formsData } = await formsQuery;
  const unlinkedForms = (formsData ?? [])
    .filter((f) => {
      if (linkedFormIds.has(f.id)) return false;
      return inferFormType(f) === 'team';
    })
    .map((f) => ({
      id: f.id,
      title_tr: f.title_tr,
      title_en: f.title_en,
      slug_tr: f.slug_tr,
      slug_en: f.slug_en,
      is_active: f.is_active,
      show_on_website: f.show_on_website,
    }));

  return NextResponse.json({ opportunities, unlinkedForms });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;
  const body = await request.json();

  // Link an existing opportunity row to org + form (claim / attach)
  if (body.link_opportunity_id || body.link_opportunity_slug) {
    const panelOrgId =
      (typeof body.orgId === 'string' && body.orgId) ||
      (await resolvePanelOrganizationIdForWrite(supabase, authResult.userId));
    if (!panelOrgId) {
      return NextResponse.json(
        { error: 'No organization found. Kurum ataması gerekli.' },
        { status: 400 }
      );
    }

    let oppQuery = supabase.from(internshipDb.opportunities).select('*');
    if (body.link_opportunity_id) {
      oppQuery = oppQuery.eq('id', String(body.link_opportunity_id));
    } else {
      oppQuery = oppQuery.eq('slug', slugifyFormValue(String(body.link_opportunity_slug)));
    }
    const { data: existingOpp, error: oppFindErr } = await oppQuery.maybeSingle();
    if (oppFindErr) {
      return NextResponse.json({ error: oppFindErr.message }, { status: 500 });
    }

    const formId = body.existing_form_id ? String(body.existing_form_id) : null;
    let formRow: Record<string, unknown> | null = null;
    if (formId) {
      const access = await assertFormInScope(supabase, authResult.userId, formId);
      if (access.error || !access.form) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }
      formRow = access.form;
    }

    // DB'de satır yoksa (canlı sayfa hardcode olabilir): slug ile oluştur + forma bağla
    if (!existingOpp) {
      if (!formRow) {
        return NextResponse.json(
          {
            error:
              'İlan bulunamadı. Form seçip tekrar deneyin; yoksa Yeni İlan ile oluşturun.',
          },
          { status: 404 }
        );
      }

      const slug = slugifyFormValue(String(body.link_opportunity_slug || ''));
      if (!slug) {
        return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 });
      }

      let opportunityType = 'gonullu';
      if (body.opportunity_type) {
        const t = String(body.opportunity_type).trim().toLowerCase();
        if (OPPORTUNITY_TYPES.has(t)) opportunityType = t;
      }

      const titleTr = String(formRow.title_tr || slug);
      const titleEn = String(formRow.title_en || titleTr);
      // Taslak oluştur — sitede ekstra kart çıkmasın; panelden "Yayınla" ile açılır
      const isActive = false;

      const { data: created, error: createErr } = await supabase
        .from(internshipDb.opportunities)
        .insert({
          slug,
          title: { tr: titleTr, en: titleEn },
          description: {
            tr: String(formRow.subtitle_tr || ''),
            en: String(formRow.subtitle_en || formRow.subtitle_tr || ''),
          },
          company_name: titleTr.includes('UNILAB') ? 'UNILAB Vision' : null,
          location: null,
          work_mode: 'hybrid',
          application_deadline: null,
          site_form_id: formRow.id,
          panel_organization_id: panelOrgId,
          opportunity_type: opportunityType,
          created_by: authResult.userId,
          is_active: isActive,
          is_featured: false,
          order_index: 0,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (createErr || !created) {
        return NextResponse.json(
          {
            error:
              createErr?.message ||
              'İlan oluşturulamadı. Migration (panel_organization_id, site_form_id, banner_url) uygulandı mı?',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ opportunity: created, linked: true, created: true }, { status: 201 });
    }

    const updates: Record<string, unknown> = {
      panel_organization_id: panelOrgId,
      updated_at: new Date().toISOString(),
    };
    if (formId) updates.site_form_id = formId;
    if (body.opportunity_type) {
      const t = String(body.opportunity_type).trim().toLowerCase();
      if (OPPORTUNITY_TYPES.has(t)) updates.opportunity_type = t;
    }

    const { data: opportunity, error } = await supabase
      .from(internshipDb.opportunities)
      .update(updates)
      .eq('id', existingOpp.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ opportunity, linked: true });
  }

  const titleTr = String(body.title_tr ?? '').trim();
  const titleEn = String(body.title_en ?? '').trim() || titleTr;
  const descriptionTr = String(body.description_tr ?? '').trim();
  const descriptionEn = String(body.description_en ?? '').trim() || descriptionTr;
  const companyName = String(body.company_name ?? '').trim();
  let slug = slugifyFormValue(String(body.slug ?? titleTr));
  const opportunityType = String(body.opportunity_type ?? 'staj').trim().toLowerCase();
  const workMode = normalizeWorkMode(body.work_mode);
  const location = body.location ? String(body.location).trim() : null;
  const isActive = Boolean(body.is_active);
  const isFeatured = Boolean(body.is_featured);
  const applicationDeadline = body.application_deadline || null;
  const bannerUrl =
    typeof body.banner_url === 'string' && body.banner_url.trim()
      ? body.banner_url.trim()
      : null;
  const thumbnailUrl =
    typeof body.thumbnail_url === 'string' && body.thumbnail_url.trim()
      ? body.thumbnail_url.trim()
      : null;
  const existingFormId =
    typeof body.existing_form_id === 'string' && body.existing_form_id.trim()
      ? body.existing_form_id.trim()
      : null;

  if (!titleTr) {
    return NextResponse.json({ error: 'Başlık (TR) gerekli' }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 });
  }
  if (!OPPORTUNITY_TYPES.has(opportunityType)) {
    return NextResponse.json({ error: 'Geçersiz fırsat türü' }, { status: 400 });
  }

  const panelOrgId =
    (typeof body.orgId === 'string' && body.orgId) ||
    (await resolvePanelOrganizationIdForWrite(supabase, authResult.userId));

  if (!panelOrgId) {
    return NextResponse.json(
      { error: 'No organization found. Kurum ataması gerekli.' },
      { status: 400 }
    );
  }

  const { data: existingOpp } = await supabase
    .from(internshipDb.opportunities)
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existingOpp) {
    return NextResponse.json(
      {
        error:
          'Bu slug ile zaten bir ilan var. Aşağıdan mevcut ilanı forma bağlayın veya farklı slug kullanın.',
        existing_opportunity_id: existingOpp.id,
      },
      { status: 409 }
    );
  }

  let form: Record<string, unknown> | null = null;

  if (existingFormId) {
    const access = await assertFormInScope(supabase, authResult.userId, existingFormId);
    if (access.error || !access.form) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    form = access.form;
    // Prefer form slug when creating listing from existing form
    const formSlug = slugifyFormValue(
      String(access.form.slug_tr || access.form.slug_en || slug)
    );
    if (formSlug) slug = formSlug;
  } else {
    const { data: existingForms } = await supabase
      .from(siteApplicationsDb.forms)
      .select('id')
      .or(`slug_tr.eq."${slug}",slug_en.eq."${slug}"`)
      .limit(1);
    if (existingForms && existingForms.length > 0) {
      return NextResponse.json(
        {
          error:
            'Bu slug ile zaten bir form var. Formlar listesinden “İlan oluştur” kullanın veya farklı slug seçin.',
          existing_form_id: existingForms[0].id,
        },
        { status: 409 }
      );
    }

    let createdByEmail: string | null = null;
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(authResult.userId);
      createdByEmail = user.emailAddresses[0]?.emailAddress ?? null;
    } catch {
      createdByEmail = null;
    }

    const formInsert = {
      slug_tr: slug,
      slug_en: slug,
      title_tr: titleTr,
      title_en: titleEn,
      subtitle_tr: descriptionTr || null,
      subtitle_en: descriptionEn || null,
      success_message_tr: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçilecektir.',
      success_message_en: 'Your application has been received. We will contact you soon.',
      is_active: isActive,
      show_on_website: isActive,
      allows_attachment: true,
      event_id: null,
      created_by: authResult.userId,
      created_by_email: createdByEmail,
      form_type: 'team',
    };

    const { data: createdForm, error: formError } = await supabase
      .from(siteApplicationsDb.forms)
      .insert(formInsert)
      .select('*')
      .single();

    if (formError || !createdForm) {
      return NextResponse.json(
        { error: formError?.message || 'Form oluşturulamadı' },
        { status: 500 }
      );
    }
    form = createdForm;

    const defaultFields = getDefaultFieldsForFormType('team');
    if (defaultFields.length > 0) {
      const { error: fieldsError } = await supabase.from(siteApplicationsDb.formFields).insert(
        defaultFields.map((field, index) => ({
          form_id: createdForm.id,
          field_key: field.field_key.trim(),
          field_type: field.field_type,
          label_tr: field.label_tr.trim(),
          label_en: field.label_en.trim(),
          placeholder_tr: field.placeholder_tr?.trim() || null,
          placeholder_en: field.placeholder_en?.trim() || null,
          required: field.required ?? false,
          order_index: field.order_index ?? index,
          options: normalizeFieldOptions(field.options),
          is_contact: field.is_contact ?? false,
        }))
      );
      if (fieldsError) {
        console.error('opportunity default fields:', fieldsError.message);
      }
    }
  }

  const oppInsert = {
    slug,
    title: { tr: titleTr, en: titleEn },
    description: descriptionTr || descriptionEn ? { tr: descriptionTr, en: descriptionEn } : null,
    company_name: companyName || null,
    location,
    work_mode: workMode,
    application_deadline: applicationDeadline,
    site_form_id: form!.id,
    panel_organization_id: panelOrgId,
    opportunity_type: opportunityType,
    created_by: authResult.userId,
    is_active: isActive,
    is_featured: isFeatured,
    banner_url: bannerUrl,
    thumbnail_url: thumbnailUrl,
    order_index: 0,
    updated_at: new Date().toISOString(),
  };

  const { data: opportunity, error: oppError } = await supabase
    .from(internshipDb.opportunities)
    .insert(oppInsert)
    .select('*')
    .single();

  if (oppError || !opportunity) {
    if (!existingFormId && form?.id) {
      await supabase.from(siteApplicationsDb.forms).delete().eq('id', form.id);
    }
    return NextResponse.json(
      { error: oppError?.message || 'İlan oluşturulamadı' },
      { status: 500 }
    );
  }

  // Sync form publish flags when linking existing form
  if (existingFormId && form?.id) {
    await supabase
      .from(siteApplicationsDb.forms)
      .update({ is_active: isActive, show_on_website: isActive })
      .eq('id', form.id);
  }

  return NextResponse.json({ opportunity, form }, { status: 201 });
}
