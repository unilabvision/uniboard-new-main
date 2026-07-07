import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { removeSiteApplicationAttachment } from '@/app/lib/siteApplications/attachmentDownload';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.SITE_APPLICATIONS_CLEANUP_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    const { data: expired, error } = await supabase
      .from(siteApplicationsDb.applications)
      .select('id, attachment_storage_path')
      .not('attachment_storage_path', 'is', null)
      .lte('attachment_expires_at', now)
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let removed = 0;
    let failed = 0;

    for (const row of expired ?? []) {
      try {
        await removeSiteApplicationAttachment(supabase, row.attachment_storage_path);
        const { error: updateError } = await supabase
          .from(siteApplicationsDb.applications)
          .update({
            attachment_file_name: null,
            attachment_storage_path: null,
            attachment_mime_type: null,
            attachment_file_size: null,
            attachment_expires_at: null,
          })
          .eq('id', row.id);

        if (updateError) throw updateError;
        removed += 1;
      } catch (cleanupErr) {
        console.error('Attachment cleanup failed:', row.id, cleanupErr);
        failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      scanned: expired?.length ?? 0,
      removed,
      failed,
    });
  } catch (err) {
    console.error('Site applications cleanup error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
