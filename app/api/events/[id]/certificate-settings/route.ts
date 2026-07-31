import { NextRequest, NextResponse } from 'next/server';
import { requireEventsCapability } from '@/app/api/events/_helpers';
import {
  loadEventCertificateSettings,
  saveEventCertificateSettings,
} from '@/app/lib/events/certificateSettings';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventsCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const settings = await loadEventCertificateSettings(authResult.supabase, id);

    const { data: templates } = await authResult.supabase
      .from('certificate_templates')
      .select('id, name, organization_slug, is_default')
      .order('name', { ascending: true });

    return NextResponse.json({
      settings,
      templates: templates || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Load failed' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventsCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const settings = await saveEventCertificateSettings(authResult.supabase, id, {
      template_id:
        body.template_id === null || body.template_id === ''
          ? null
          : body.template_id != null
            ? Number(body.template_id)
            : undefined,
      certificate_description:
        body.certificate_description !== undefined
          ? body.certificate_description == null
            ? null
            : String(body.certificate_description)
          : undefined,
      certificate_auto_issue:
        body.certificate_auto_issue !== undefined
          ? Boolean(body.certificate_auto_issue)
          : undefined,
      certificate_delay_minutes:
        body.certificate_delay_minutes !== undefined
          ? Number(body.certificate_delay_minutes)
          : undefined,
    });

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('Event certificate settings PATCH error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    );
  }
}
