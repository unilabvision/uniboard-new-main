import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsModuleUser,
  requireSiteApplicationsSuperAdmin,
} from '@/app/api/site-applications/access/_helpers';
import type { SiteApplicationFormInput } from '@/app/types/siteApplicationForms';

export async function GET() {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { data, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ forms: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSiteApplicationsSuperAdmin();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = (await request.json()) as SiteApplicationFormInput;
  const slugTr = body.slug_tr?.trim();
  const slugEn = body.slug_en?.trim();
  const titleTr = body.title_tr?.trim();
  const titleEn = body.title_en?.trim();

  if (!slugTr || !slugEn || !titleTr || !titleEn) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let createdByEmail: string | null = null;
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(authResult.userId!);
    createdByEmail = user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    createdByEmail = null;
  }

  const { data, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .insert({
      slug_tr: slugTr,
      slug_en: slugEn,
      title_tr: titleTr,
      title_en: titleEn,
      subtitle_tr: body.subtitle_tr?.trim() || null,
      subtitle_en: body.subtitle_en?.trim() || null,
      success_message_tr: body.success_message_tr?.trim() || null,
      success_message_en: body.success_message_en?.trim() || null,
      is_active: body.is_active ?? false,
      show_on_website: body.show_on_website ?? false,
      allows_attachment: body.allows_attachment ?? false,
      created_by: authResult.userId,
      created_by_email: createdByEmail,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ form: data }, { status: 201 });
}
