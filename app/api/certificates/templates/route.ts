import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';

export async function POST(request: NextRequest) {
  const authResult = await requireCertificatesCapability('templates');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      organization_slug,
      background_image,
      design_settings,
      is_default = false,
    } = body as {
      name?: string;
      description?: string;
      organization_slug?: string;
      background_image?: string;
      design_settings?: unknown;
      is_default?: boolean;
    };

    if (!name?.trim() || !organization_slug?.trim() || !background_image?.trim()) {
      return NextResponse.json(
        { error: 'name, organization_slug and background_image are required' },
        { status: 400 }
      );
    }

    if (is_default) {
      await authResult.supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_slug', organization_slug)
        .eq('is_default', true);
    }

    const { data, error } = await authResult.supabase
      .from('certificate_templates')
      .insert([
        {
          name: name.trim(),
          description: description ?? '',
          organization_slug: organization_slug.trim(),
          background_image: background_image.trim(),
          design_settings: design_settings ?? null,
          is_default: Boolean(is_default),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (err) {
    console.error('Certificate template create error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Create failed' },
      { status: 500 }
    );
  }
}
