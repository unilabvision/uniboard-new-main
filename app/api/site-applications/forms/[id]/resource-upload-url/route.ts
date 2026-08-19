import { NextRequest, NextResponse } from 'next/server';
import {
  buildResourceStoragePath,
  getMaxFileBytesForFormType,
  validateAttachmentFile,
} from '@/app/lib/siteApplications/files';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import {
  requireEventFormsWriteUser,
  resolveSiteApplicationsPanelOrganizationScope,
} from '@/app/api/site-applications/access/_helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: formId } = await context.params;
  const authResult = await requireEventFormsWriteUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const panelScope = await resolveSiteApplicationsPanelOrganizationScope(
    authResult.supabase,
    authResult.userId || ''
  );
  if (panelScope.mode === 'none') {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  const supabase = authResult.supabase;

  const { data: form, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id, form_type, event_id, created_by')
    .eq('id', formId)
    .maybeSingle();

  if (formError) {
    return NextResponse.json({ error: formError.message }, { status: 500 });
  }
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  if (panelScope.mode === 'scoped') {
    const creatorId = form.created_by as string | null;
    if (!creatorId) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { data: ownerRows } = await supabase
      .from('user_module_access')
      .select('clerk_user_id')
      .eq('is_enabled', true)
      .in('module_key', [
        'site-applications',
        'site_basvurular',
        'site-basvurular',
        'basvurular',
        'events',
        'event',
        'etkinlik',
        'etkinlikler',
      ])
      .eq('clerk_user_id', creatorId)
      .in('panel_organization_id', panelScope.panelOrganizationIds);

    if (!ownerRows || ownerRows.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }
  }

  let body: {
    fieldKey?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const fieldKey = String(body.fieldKey || '').trim();
  const fileName = String(body.fileName || '').trim();
  const fileSize = Number(body.fileSize);
  const mimeType = String(body.mimeType || 'application/octet-stream').trim();

  if (!fieldKey || !fileName || !Number.isFinite(fileSize)) {
    return NextResponse.json({ error: 'Invalid file metadata' }, { status: 400 });
  }

  const formType = inferFormType(form);
  const maxBytes = getMaxFileBytesForFormType(formType);
  const validationError = validateAttachmentFile(
    { name: fileName, size: fileSize },
    { maxBytes, locale: 'tr' }
  );
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { bucket, objectPath, storageRef } = buildResourceStoragePath(
    formId,
    fieldKey,
    fileName
  );

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(objectPath);

  if (error || !data?.signedUrl) {
    console.error('Resource signed upload URL error:', error);
    return NextResponse.json({ error: 'Upload URL could not be created' }, { status: 500 });
  }

  return NextResponse.json({
    bucket,
    objectPath,
    storageRef,
    signedUrl: data.signedUrl,
    token: data.token,
    mimeType,
    fileName,
    fileSize,
    maxFileBytes: maxBytes,
  });
}
