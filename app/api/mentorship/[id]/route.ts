import { NextRequest, NextResponse } from 'next/server';
import {
  mentorshipDb,
  MENTORSHIP_TYPES,
  MENTORSHIP_MODES,
  parseBooleanField,
} from '@/app/lib/mentorship/config';
import {
  requireMentorshipModuleUser,
  requireMentorshipCapability,
} from '@/app/api/mentorship/_helpers';
import type { MentorshipInput, LocalizedText } from '@/app/types/mentorship';

function asLocalized(value: unknown): LocalizedText {
  if (typeof value === 'string') {
    return { tr: value, en: value };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      tr: typeof obj.tr === 'string' ? obj.tr : '',
      en: typeof obj.en === 'string' ? obj.en : typeof obj.tr === 'string' ? obj.tr : '',
    };
  }
  return { tr: '', en: '' };
}

function pickPayload(body: MentorshipInput) {
  const type = body.mentorship_type || 'general';
  const mode = body.mode || 'online';

  return {
    ...(body.slug != null ? { slug: body.slug.trim() } : {}),
    ...(body.title != null ? { title: asLocalized(body.title) } : {}),
    ...(body.description !== undefined
      ? { description: body.description != null ? asLocalized(body.description) : null }
      : {}),
    ...(body.summary !== undefined
      ? { summary: body.summary != null ? asLocalized(body.summary) : null }
      : {}),
    ...(body.mentor_name !== undefined
      ? { mentor_name: body.mentor_name?.trim() || null }
      : {}),
    ...(body.mentor_title !== undefined
      ? { mentor_title: body.mentor_title?.trim() || null }
      : {}),
    ...(body.mentor_bio !== undefined
      ? { mentor_bio: body.mentor_bio != null ? asLocalized(body.mentor_bio) : null }
      : {}),
    ...(body.mentor_image_url !== undefined
      ? { mentor_image_url: body.mentor_image_url?.trim() || null }
      : {}),
    ...(body.mentor_linkedin !== undefined
      ? { mentor_linkedin: body.mentor_linkedin?.trim() || null }
      : {}),
    ...(body.mentorship_type !== undefined
      ? {
          mentorship_type: (MENTORSHIP_TYPES as readonly string[]).includes(type)
            ? type
            : 'general',
        }
      : {}),
    ...(body.mode !== undefined
      ? {
          mode: (MENTORSHIP_MODES as readonly string[]).includes(mode)
            ? mode
            : 'online',
        }
      : {}),
    ...(body.location_name !== undefined
      ? { location_name: body.location_name?.trim() || null }
      : {}),
    ...(body.application_deadline !== undefined
      ? { application_deadline: body.application_deadline || null }
      : {}),
    ...(body.start_date !== undefined ? { start_date: body.start_date || null } : {}),
    ...(body.end_date !== undefined ? { end_date: body.end_date || null } : {}),
    ...(body.max_mentees !== undefined ? { max_mentees: body.max_mentees ?? null } : {}),
    ...(body.is_application_open !== undefined
      ? { is_application_open: parseBooleanField(body.is_application_open, true) }
      : {}),
    ...(body.thumbnail_url !== undefined
      ? { thumbnail_url: body.thumbnail_url?.trim() || null }
      : {}),
    ...(body.banner_url !== undefined
      ? { banner_url: body.banner_url?.trim() || null }
      : {}),
    ...(body.tags !== undefined ? { tags: body.tags?.length ? body.tags : null } : {}),
    ...(body.order_index !== undefined ? { order_index: body.order_index ?? 0 } : {}),
    ...(body.is_active !== undefined
      ? { is_active: parseBooleanField(body.is_active, false) }
      : {}),
    ...(body.is_featured !== undefined
      ? { is_featured: parseBooleanField(body.is_featured, false) }
      : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireMentorshipModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const { data, error } = await authResult.supabase
    .from(mentorshipDb.mentorships)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ mentorship: data });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireMentorshipCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const body = (await request.json()) as MentorshipInput;
  const payload = pickPayload(body);

  const { data, error } = await authResult.supabase
    .from(mentorshipDb.mentorships)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mentorship: data });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireMentorshipCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const { error } = await authResult.supabase
    .from(mentorshipDb.mentorships)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
