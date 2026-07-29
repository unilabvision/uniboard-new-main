import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireCertificatesCapability('templates');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.status }
    );
  }

  const { id: idParam } = await context.params;
  const templateId = Number(idParam);
  if (!Number.isFinite(templateId) || templateId <= 0) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      organization_slug,
      background_image,
      design_settings,
      is_default,
    } = body as {
      name?: string;
      description?: string;
      organization_slug?: string;
      background_image?: string;
      design_settings?: unknown;
      is_default?: boolean;
    };

    const { data: existing, error: existingError } = await authResult.supabase
      .from('certificate_templates')
      .select('id, organization_slug, is_default')
      .eq('id', templateId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const nextOrgSlug =
      typeof organization_slug === 'string' && organization_slug.trim()
        ? organization_slug.trim()
        : existing.organization_slug;

    if (is_default === true) {
      await authResult.supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_slug', nextOrgSlug)
        .neq('id', templateId);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === 'string') updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ?? '';
    if (typeof organization_slug === 'string') {
      updateData.organization_slug = organization_slug.trim();
    }
    if (typeof background_image === 'string') {
      updateData.background_image = background_image.trim();
    }
    if (design_settings !== undefined) {
      updateData.design_settings = design_settings;
    }
    if (typeof is_default === 'boolean') {
      updateData.is_default = is_default;
    }

    const { data, error } = await authResult.supabase
      .from('certificate_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Update returned no rows' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (err) {
    console.error('Certificate template update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const authResult = await requireCertificatesCapability('templates');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.status }
    );
  }

  const { id: idParam } = await context.params;
  const templateId = Number(idParam);
  if (!Number.isFinite(templateId) || templateId <= 0) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
  }

  const { error } = await authResult.supabase
    .from('certificate_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
