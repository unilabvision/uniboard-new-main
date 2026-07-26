import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from './config';
import { removeSiteApplicationAttachment } from './attachmentDownload';
import { parseSubmissionFileMeta } from './files';

const MAX_BULK_DELETE = 50;

export function getMaxBulkDelete(): number {
  return MAX_BULK_DELETE;
}

async function cleanupApplicationFiles(
  supabase: SupabaseClient,
  app: {
    attachment_storage_path?: string | null;
    submission_data?: unknown;
  }
): Promise<void> {
  if (app.attachment_storage_path) {
    try {
      await removeSiteApplicationAttachment(supabase, app.attachment_storage_path);
    } catch (err) {
      console.error('Failed to remove form attachment:', err);
    }
  }

  const submission =
    app.submission_data && typeof app.submission_data === 'object'
      ? (app.submission_data as Record<string, unknown>)
      : {};

  for (const raw of Object.values(submission)) {
    const meta = parseSubmissionFileMeta(raw);
    if (!meta) continue;
    try {
      await removeSiteApplicationAttachment(supabase, meta.storagePath);
    } catch (err) {
      console.error('Failed to remove field attachment:', err);
    }
  }
}

/** Delete one application: storage files, status history, then row. */
export async function deleteSiteApplication(
  supabase: SupabaseClient,
  id: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: existing, error: loadError } = await supabase
    .from(siteApplicationsDb.applications)
    .select('id, attachment_storage_path, submission_data')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: loadError.message, status: 500 };
  }
  if (!existing) {
    return { ok: false, error: 'Application not found', status: 404 };
  }

  await cleanupApplicationFiles(supabase, existing);

  const { error: historyError } = await supabase
    .from(siteApplicationsDb.statusHistory)
    .delete()
    .eq('application_id', id);

  if (historyError) {
    return { ok: false, error: historyError.message, status: 500 };
  }

  const { error: deleteError } = await supabase
    .from(siteApplicationsDb.applications)
    .delete()
    .eq('id', id);

  if (deleteError) {
    return { ok: false, error: deleteError.message, status: 500 };
  }

  return { ok: true };
}

/** Delete many applications (max 50). Continues on per-item failures. */
export async function deleteSiteApplicationsBulk(
  supabase: SupabaseClient,
  ids: string[]
): Promise<{ deleted: string[]; failed: Array<{ id: string; error: string }> }> {
  const unique = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))].slice(
    0,
    MAX_BULK_DELETE
  );

  const deleted: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const id of unique) {
    const result = await deleteSiteApplication(supabase, id);
    if (result.ok) {
      deleted.push(id);
    } else {
      failed.push({ id, error: result.error });
    }
  }

  return { deleted, failed };
}
