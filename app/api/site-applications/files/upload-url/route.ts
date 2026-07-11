import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { siteApplicationsDb } from '@/app/lib/siteApplications';
import {
  buildAttachmentStoragePath,
  validateAttachmentFile,
} from '@/app/lib/siteApplications';
import { requireCaptchaInProduction, verifyHCaptcha } from '@/app/lib/siteApplications/captcha';
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

    const { form } = resolved;

    if (!form.allows_attachment) {
      return NextResponse.json({ error: 'Attachments not allowed' }, { status: 400 });
    }

    const fileName = String(body.fileName || '').trim();
    const fileSize = Number(body.fileSize);
    const mimeType = String(body.mimeType || 'application/octet-stream').trim();

    if (!fileName || !Number.isFinite(fileSize)) {
      return NextResponse.json({ error: 'Invalid file metadata' }, { status: 400 });
    }

    const validationError = validateAttachmentFile({
      name: fileName,
      size: fileSize,
    } as File);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const captchaToken = body.hCaptchaToken as string | undefined;
    if (!requireCaptchaInProduction(captchaToken)) {
      return NextResponse.json({ error: 'Captcha required' }, { status: 400 });
    }
    if (captchaToken) {
      const valid = await verifyHCaptcha(captchaToken);
      if (!valid) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
      }
    }

    const storageSlug = getApplicationTypeSlug(form, locale);
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
    });
  } catch (err) {
    console.error('Upload URL error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
