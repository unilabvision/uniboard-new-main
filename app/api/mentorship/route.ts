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

function pickPayload(body: MentorshipInput, userId?: string | null) {
  const type = body.mentorship_type || 'general';
  const mode = body.mode || 'online';

  return {
    slug: body.slug?.trim(),
    title: asLocalized(body.title),
    description: body.description != null ? asLocalized(body.description) : null,
    summary: body.summary != null ? asLocalized(body.summary) : null,
    mentor_name: body.mentor_name?.trim() || null,
    mentor_title: body.mentor_title?.trim() || null,
    mentor_bio: body.mentor_bio != null ? asLocalized(body.mentor_bio) : null,
    mentor_image_url: body.mentor_image_url?.trim() || null,
    mentor_linkedin: body.mentor_linkedin?.trim() || null,
    mentorship_type: (MENTORSHIP_TYPES as readonly string[]).includes(type)
      ? type
      : 'general',
    mode: (MENTORSHIP_MODES as readonly string[]).includes(mode) ? mode : 'online',
    location_name: body.location_name?.trim() || null,
    application_deadline: body.application_deadline || null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    max_mentees: body.max_mentees ?? null,
    is_application_open: parseBooleanField(body.is_application_open, true),
    thumbnail_url: body.thumbnail_url?.trim() || null,
    banner_url: body.banner_url?.trim() || null,
    tags: body.tags?.length ? body.tags : null,
    order_index: body.order_index ?? 0,
    is_active: parseBooleanField(body.is_active, false),
    is_featured: parseBooleanField(body.is_featured, false),
    panel_organization_id: body.panel_organization_id || null,
    ...(userId ? { created_by: userId } : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireMentorshipModuleUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const activeOnly = request.nextUrl.searchParams.get('active') === 'true';

  let query = authResult.supabase!
    .from(mentorshipDb.mentorships)
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mentorships: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authResult = await requireMentorshipCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = (await request.json()) as MentorshipInput;
  const title = asLocalized(body.title);
  if (!body.slug?.trim() || !title.tr?.trim()) {
    return NextResponse.json(
      { error: 'slug ve title.tr zorunludur' },
      { status: 400 }
    );
  }

  const payload = pickPayload(body, authResult.userId);

  const { data, error } = await authResult.supabase
    .from(mentorshipDb.mentorships)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mentorship: data }, { status: 201 });
}
