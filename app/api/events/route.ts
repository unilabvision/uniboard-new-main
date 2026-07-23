import { NextRequest, NextResponse } from 'next/server';
import { eventsDb } from '@/app/lib/events/config';
import { requireEventsModuleUser, requireEventsCapability } from '@/app/api/events/_helpers';
import type { MyuniEventInput } from '@/app/types/events';

function pickEventPayload(body: MyuniEventInput) {
  return {
    slug: body.slug?.trim(),
    title: body.title?.trim(),
    description: body.description?.trim() || null,
    organizer_name: body.organizer_name?.trim() || null,
    organizer_email: body.organizer_email?.trim() || null,
    organizer_linkedin: body.organizer_linkedin?.trim() || null,
    organizer_image_url: body.organizer_image_url?.trim() || null,
    event_type: body.event_type || 'seminar',
    category: body.category?.trim() || null,
    tags: body.tags?.length ? body.tags : null,
    start_date: body.start_date,
    end_date: body.end_date || null,
    timezone: body.timezone || 'Europe/Istanbul',
    duration_minutes: body.duration_minutes ?? null,
    is_online: body.is_online ?? true,
    location_name: body.location_name?.trim() || null,
    location_address: body.location_address?.trim() || null,
    meeting_url: body.meeting_url?.trim() || null,
    is_paid: body.is_paid ?? false,
    price: body.is_paid ? body.price ?? 0 : null,
    max_attendees: body.max_attendees ?? null,
    registration_deadline: body.registration_deadline || null,
    is_registration_open: body.is_registration_open ?? true,
    thumbnail_url: body.thumbnail_url?.trim() || null,
    banner_url: body.banner_url?.trim() || null,
    status: body.status || 'upcoming',
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireEventsModuleUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const activeOnly = request.nextUrl.searchParams.get('active') === 'true';

  let query = authResult.supabase!
    .from(eventsDb.events)
    .select('*')
    .order('start_date', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authResult = await requireEventsCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = (await request.json()) as MyuniEventInput;
  if (!body.slug?.trim() || !body.title?.trim() || !body.start_date) {
    return NextResponse.json(
      { error: 'slug, title ve start_date zorunludur' },
      { status: 400 }
    );
  }

  const payload = pickEventPayload(body);

  const { data, error } = await authResult.supabase
    .from(eventsDb.events)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
