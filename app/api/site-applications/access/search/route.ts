import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import {
  isEmailQuery,
  isValidAccessSearchQuery,
} from '@/app/lib/internship/accessQuery';
import {
  clerkUserToResult,
  requireSiteApplicationsAccessManager,
} from '../_helpers';

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

    const clerk = await clerkClient();
    const { data } = isEmailQuery(q)
      ? await clerk.users.getUserList({ emailAddress: [q.toLowerCase()], limit: 10 })
      : await clerk.users.getUserList({ query: q, limit: 10 });

    const users = await Promise.all(data.map((u) => clerkUserToResult(u)));

    return NextResponse.json({ users, query: q });
  } catch (err) {
    console.error('Site applications access search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
