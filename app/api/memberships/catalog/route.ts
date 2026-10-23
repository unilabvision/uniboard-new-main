import { NextResponse } from 'next/server';
import { requireMembershipsCapability } from '@/app/api/memberships/_helpers';
import type { MembershipCatalogItem } from '@/app/lib/memberships/types';

export async function GET() {
  const access = await requireMembershipsCapability('view');
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const [courses, products, events] = await Promise.all([
    access.supabase
      .from('myuni_courses')
      .select('id, title, slug, course_type, is_active')
      .order('title')
      .limit(1000),
    access.supabase
      .from('myuni_products')
      .select('id, title, slug, product_type, is_active')
      .order('title')
      .limit(1000),
    access.supabase
      .from('myuni_events')
      .select('id, title, slug, status, is_active')
      .order('title')
      .limit(1000),
  ]);

  const failed = [courses, products, events].find((result) => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  const items: MembershipCatalogItem[] = [
    ...(courses.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      type: 'course' as const,
      subtype: item.course_type,
      isActive: item.is_active === true,
    })),
    ...(products.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      type: 'product' as const,
      subtype: item.product_type,
      isActive: item.is_active === true,
    })),
    ...(events.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      type: 'event' as const,
      subtype: item.status,
      isActive: item.is_active === true,
    })),
  ];

  return NextResponse.json({ items });
}
