import { NextRequest, NextResponse } from 'next/server';
import { isValidAccessSearchQuery } from '@/app/lib/internship/accessQuery';
import {
  clerkUserToResult,
  requireSiteApplicationsAccessManager,
} from '../_helpers';
import { searchClerkUsers } from '@/app/lib/moduleAccess/helpers';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSiteApplicationsAccessManager();
    if (authResult.error || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (!isValidAccessSearchQuery(q)) {
      return NextResponse.json(
        {
          error:
            'Geçersiz arama. Yalnızca isim veya e-posta girin (en az 2 karakter).',
        },
        { status: 400 }
      );
    }

    const data = await searchClerkUsers(q, 15);
    const users = await Promise.all(data.map((u) => clerkUserToResult(u)));

    return NextResponse.json({ users, query: q });
  } catch (err) {
    console.error('Site applications access search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
