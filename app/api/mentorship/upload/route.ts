import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const centralMediaUrl = request.nextUrl.clone();
  centralMediaUrl.pathname = '/api/admin/media';
  centralMediaUrl.search = '';
  centralMediaUrl.searchParams.set('scope', 'mentorship');
  return NextResponse.redirect(centralMediaUrl, 307);
}
