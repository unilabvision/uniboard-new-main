import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/app/lib/moduleAccess/helpers';
import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

async function requirePlatformSuperAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized' as const,
      status: 401 as const,
      userId: null,
      supabase: null,
    };
  }
  const supabase = getServiceSupabase();
  const rows = await loadUserAccessRows(supabase, userId);
  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  if (!isSuperAdmin) {
    return {
      error: 'Forbidden' as const,
      status: 403 as const,
      userId: null,
      supabase: null,
    };
  }
  return { error: null, status: 200 as const, userId, supabase };
}

/** List orgs: super admin sees all; org members see their orgs */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }

  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const moduleKey = request.nextUrl.searchParams.get('moduleKey');

  if (isSuperAdmin) {
    const { data, error } = await supabase
      .from('panel_organizations')
      .select('id, slug, name, is_active, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      // Table may not exist yet
      return NextResponse.json({
        organizations: [],
        isSuperAdmin: true,
        warning: error.message,
      });
    }
    return NextResponse.json({ organizations: data ?? [], isSuperAdmin: true });
  }

  const orgIds = [
    ...new Set(
      rows
        .filter((r) => {
          if (!r.panel_organization_id) return false;
          if (!moduleKey) return true;
          return r.module_key === moduleKey;
        })
        .map((r) => r.panel_organization_id as string)
    ),
  ];

  if (orgIds.length === 0) {
    return NextResponse.json({ organizations: [], isSuperAdmin: false });
  }

  const { data, error } = await supabase
    .from('panel_organizations')
    .select('id, slug, name, is_active, created_at')
    .in('id', orgIds)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({
      organizations: [],
      isSuperAdmin: false,
      warning: error.message,
    });
  }

  return NextResponse.json({ organizations: data ?? [], isSuperAdmin: false });
}

/** Create org — platform super admin only */
export async function POST(request: NextRequest) {
  const authResult = await requirePlatformSuperAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }

  const { data, error } = await authResult.supabase
    .from('panel_organizations')
    .insert({ slug, name, is_active: true })
    .select('id, slug, name, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
