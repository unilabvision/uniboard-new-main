import { NextRequest, NextResponse } from 'next/server';
import { eventsDb, parseBooleanField } from '@/app/lib/events/config';
import { requireEventsModuleUser, requireEventsCapability } from '@/app/api/events/_helpers';
import type { MyuniEventInput } from '@/app/types/events';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventsModuleUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { data, error } = await authResult.supabase!
    .from(eventsDb.events)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({ event: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventsCapability('edit');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = (await request.json()) as Partial<MyuniEventInput>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const stringFields = [
    'slug',
    'title',
    'description',
    'organizer_name',
    'organizer_email',
    'organizer_linkedin',
    'organizer_image_url',
    'category',
    'location_name',
    'location_address',
    'meeting_url',
    'thumbnail_url',
    'banner_url',
  ] as const;

  for (const key of stringFields) {
    if (body[key] !== undefined) {
      updates[key] = typeof body[key] === 'string' ? body[key].trim() || null : body[key];
    }
  }

  if (body.event_type !== undefined) updates.event_type = body.event_type;
  if (body.status !== undefined) updates.status = body.status;
  if (body.tags !== undefined) updates.tags = body.tags?.length ? body.tags : null;
  if (body.start_date !== undefined) updates.start_date = body.start_date;
  if (body.end_date !== undefined) updates.end_date = body.end_date || null;
  if (body.timezone !== undefined) updates.timezone = body.timezone;
  if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes;
  if (body.is_online !== undefined) updates.is_online = parseBooleanField(body.is_online);
  if (body.is_paid !== undefined) {
    updates.is_paid = parseBooleanField(body.is_paid);
    if (!updates.is_paid) updates.price = null;
  }
  if (body.price !== undefined && body.is_paid !== false) {
    updates.price = body.price;
  }
  if (body.max_attendees !== undefined) updates.max_attendees = body.max_attendees;
  if (body.registration_deadline !== undefined) {
    updates.registration_deadline = body.registration_deadline || null;
  }
  if (body.is_registration_open !== undefined) {
    updates.is_registration_open = parseBooleanField(body.is_registration_open);
  }
  if (body.is_active !== undefined) updates.is_active = parseBooleanField(body.is_active);
  if (body.is_featured !== undefined) updates.is_featured = parseBooleanField(body.is_featured);

  const { data, error } = await authResult.supabase
    .from(eventsDb.events)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { error } = await authResult.supabase
    .from(eventsDb.events)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
