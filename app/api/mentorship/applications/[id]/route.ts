import { NextRequest, NextResponse } from 'next/server';
import {
  mentorshipDb,
  MENTORSHIP_APPLICATION_STATUSES,
} from '@/app/lib/mentorship/config';
import { requireMentorshipCapability } from '@/app/api/mentorship/_helpers';
import type { MentorshipApplicationStatus } from '@/app/types/mentorship';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireMentorshipCapability('applications');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const { data, error } = await authResult.supabase
    .from(mentorshipDb.applications)
    .select('*, mentorships:mentorship_id ( id, slug, title, mentor_name, is_active )')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: history } = await authResult.supabase
    .from(mentorshipDb.statusHistory)
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ application: data, history: history ?? [] });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireMentorshipCapability('applications');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const body = await request.json();
  const nextStatus = body.status as MentorshipApplicationStatus | undefined;
  const adminNotes =
    typeof body.admin_notes === 'string' ? body.admin_notes : undefined;

  const { data: existing, error: fetchError } = await authResult.supabase
    .from(mentorshipDb.applications)
    .select('id, status, mentorship_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (
    nextStatus &&
    !(MENTORSHIP_APPLICATION_STATUSES as readonly string[]).includes(nextStatus)
  ) {
    return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;
  if (nextStatus && nextStatus !== existing.status) {
    updatePayload.status = nextStatus;
    updatePayload.reviewed_by = authResult.userId;
    updatePayload.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await authResult.supabase
    .from(mentorshipDb.applications)
    .update(updatePayload)
    .eq('id', id)
    .select('*, mentorships:mentorship_id ( id, slug, title, mentor_name )')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (nextStatus && nextStatus !== existing.status) {
    await authResult.supabase.from(mentorshipDb.statusHistory).insert({
      application_id: id,
      from_status: existing.status,
      to_status: nextStatus,
      changed_by: authResult.userId,
      note: typeof body.note === 'string' ? body.note : null,
    });

    // Kabul edilen mentee sayısını güncelle
    if (nextStatus === 'accepted' || existing.status === 'accepted') {
      const { count } = await authResult.supabase
        .from(mentorshipDb.applications)
        .select('id', { count: 'exact', head: true })
        .eq('mentorship_id', existing.mentorship_id)
        .eq('status', 'accepted');

      await authResult.supabase
        .from(mentorshipDb.mentorships)
        .update({
          current_mentees: count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.mentorship_id);
    }
  }

  return NextResponse.json({ application: data });
}
