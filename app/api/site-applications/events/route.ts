import { NextResponse } from 'next/server';
import { requireEventFormsWriteUser } from '@/app/api/site-applications/access/_helpers';
import { fetchActiveEvents } from '@/app/lib/siteApplications/events';

/** Active events for form configuration. */
export async function GET() {
  const authResult = await requireEventFormsWriteUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { events, error } = await fetchActiveEvents(authResult.supabase!);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ events });
}
