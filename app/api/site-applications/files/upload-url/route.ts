import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  buildAttachmentStoragePath,
  getMaxFileBytesForFormType,
  validateAttachmentFile,
} from '@/app/lib/siteApplications';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import { getApplicationTypeSlug, resolveActiveForm } from '@/app/lib/siteApplications/resolveForm';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formSlug = String(body.formSlug || '').trim();
    const eventSlug = String(body.eventSlug || '').trim();
    const locale = body.locale === 'en' ? 'en' : 'tr';

    if (!formSlug && !eventSlug) {
      return NextResponse.json({ error: 'Form slug or event slug required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const resolved = await resolveActiveForm(supabase, { locale, formSlug, eventSlug });

    if (!resolved) {
      return NextResponse.json({ error: 'Form not found' }, { status: 400 });
    }

    const { form, event } = resolved;
    const formType = inferFormType(form);

    // Allow upload when form attachments are on OR the form has a file field
    let allowUpload = Boolean(form.allows_attachment);
    if (!allowUpload) {
      const { data: fields } = await supabase
        .from(siteApplicationsDb.formFields)
        .select('field_type')
        .eq('form_id', form.id);
      allowUpload = (fields || []).some((f) => f.field_type === 'file');
    }

    if (!allowUpload) {
      return NextResponse.json({ error: 'Attachments not allowed' }, { status: 400 });
    }

    const fileName = String(body.fileName || '').trim();
    const fileSize = Number(body.fileSize);
    const mimeType = String(body.mimeType || 'application/octet-stream').trim();

    if (!fileName || !Number.isFinite(fileSize)) {
      return NextResponse.json({ error: 'Invalid file metadata' }, { status: 400 });
    }

    const maxBytes = getMaxFileBytesForFormType(formType);
    const validationError = validateAttachmentFile(
      { name: fileName, size: fileSize },
      { maxBytes, locale }
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const storageSlug = getApplicationTypeSlug(form, locale, event);
    const draftId = randomUUID();
    const { bucket, objectPath, storageRef } = buildAttachmentStoragePath(
      storageSlug,
      draftId,
      fileName
    );

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(objectPath);

    if (error || !data?.signedUrl) {
      console.error('Signed upload URL error:', error);
      return NextResponse.json({ error: 'Upload URL could not be created' }, { status: 500 });
    }

    return NextResponse.json({
      bucket,
      objectPath,
      storageRef,
      signedUrl: data.signedUrl,
      token: data.token,
      mimeType,
      maxFileBytes: maxBytes,
      formType,
    });
  } catch (err) {
    console.error('Upload URL error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
