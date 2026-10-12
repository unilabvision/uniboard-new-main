import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const centralMediaUrl = request.nextUrl.clone();
  centralMediaUrl.pathname = '/api/admin/media';
  centralMediaUrl.search = '';
  centralMediaUrl.searchParams.set('scope', 'course');
  centralMediaUrl.searchParams.set('entityId', id);
  return NextResponse.redirect(centralMediaUrl, 307);
}
