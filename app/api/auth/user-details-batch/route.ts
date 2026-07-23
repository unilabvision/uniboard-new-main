import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type UserDetails = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string | null;
  email: string;
  fullName: string;
  source?: string;
};

type ClerkLike = {
  users: {
    getUserList: (args: {
      userId: string[];
      limit: number;
    }) => Promise<{ data: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      emailAddresses: Array<{ emailAddress: string }>;
      primaryEmailAddress?: { emailAddress: string | null } | null;
      imageUrl: string;
    }> }>;
  };
};

function pickEmail(user: {
  emailAddresses?: Array<{ emailAddress?: string | null } | null> | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
}): string {
  return (
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    ''
  );
}

function pickFullName(
  user: {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  },
  email: string,
  userId: string
): string {
  const fromNames = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fromNames || user.username || email || `Kullanıcı ${userId.substring(0, 8)}`;
}

function emptyUser(userId: string): UserDetails {
  return {
    id: userId,
    firstName: null,
    lastName: null,
    username: null,
    emailAddresses: [],
    imageUrl: null,
    email: '',
    fullName: `Kullanıcı ${userId.substring(0, 8)}`,
  };
}

function ensureUser(
  usersMap: Record<string, UserDetails>,
  userId: string
): UserDetails {
  if (!usersMap[userId]) {
    usersMap[userId] = emptyUser(userId);
  }
  return usersMap[userId];
}

function applyEmail(user: UserDetails, email: string | null | undefined, source: string) {
  const normalized = (email || '').trim();
  if (!normalized || user.email) return;
  user.email = normalized;
  user.emailAddresses = [{ emailAddress: normalized }];
  user.source = user.source ? `${user.source}+${source}` : source;
  user.fullName = pickFullName(user, user.email, user.id);
}

function applyDisplayName(user: UserDetails, rawName: string | null | undefined) {
  const name = (rawName || '').trim();
  if (!name) return;
  const hasRealName = Boolean(user.firstName || user.lastName);
  if (hasRealName) return;
  if (user.username) return;
  if (user.fullName && !user.fullName.startsWith('Kullanıcı ')) return;

  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    user.firstName = parts[0];
    user.lastName = parts.slice(1).join(' ');
  } else {
    user.username = name;
  }
  user.fullName = pickFullName(user, user.email, user.id);
}

function applyName(
  user: UserDetails,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  username: string | null | undefined
) {
  if (!user.firstName && firstName) user.firstName = firstName;
  if (!user.lastName && lastName) user.lastName = lastName;
  if (!user.username && username) user.username = username;
  user.fullName = pickFullName(user, user.email, user.id);
}

function clerkUserToDetails(
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    emailAddresses: Array<{ emailAddress: string }>;
    primaryEmailAddress?: { emailAddress: string | null } | null;
    imageUrl: string;
  },
  source: string
): UserDetails {
  const email = pickEmail(user);
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    emailAddresses: email ? [{ emailAddress: email }] : [],
    imageUrl: user.imageUrl,
    email,
    fullName: pickFullName(user, email, user.id),
    source,
  };
}

function getProfilesSupabase(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://mzlvfmyrzytwvwndqgnz.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getLmsSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isClerkRateLimit(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: number }).status === 429
  );
}

function retryAfterMs(error: unknown): number {
  if (error && typeof error === 'object' && 'retryAfter' in error) {
    const seconds = Number((error as { retryAfter?: number }).retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }
  return 6000;
}

function mergeClerkUser(
  usersMap: Record<string, UserDetails>,
  details: UserDetails
) {
  const existing = usersMap[details.id];
  if (existing?.email && !details.email) {
    details.email = existing.email;
    details.emailAddresses = existing.emailAddresses;
  }
  if (existing && !details.firstName && !details.lastName) {
    details.firstName = existing.firstName;
    details.lastName = existing.lastName;
    details.username = existing.username || details.username;
  }
  details.fullName = pickFullName(details, details.email, details.id);
  if (existing?.source && details.source) {
    details.source = `${existing.source}+${details.source}`;
  }
  usersMap[details.id] = details;
}

async function fetchFromClerkInstance(
  clerk: ClerkLike,
  userIds: string[],
  usersMap: Record<string, UserDetails>,
  source: string
): Promise<number> {
  if (userIds.length === 0) return 0;
  let found = 0;

  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    let attempt = 0;
    while (attempt < 3) {
      try {
        const { data } = await clerk.users.getUserList({
          userId: chunk,
          limit: 100,
        });
        for (const user of data) {
          mergeClerkUser(usersMap, clerkUserToDetails(user, source));
          found += 1;
        }
        break;
      } catch (error) {
        if (isClerkRateLimit(error) && attempt < 2) {
          const wait = retryAfterMs(error);
          console.warn(`Clerk (${source}) rate limited; retrying in ${wait}ms`);
          await sleep(wait);
          attempt += 1;
          continue;
        }
        console.error(`Error fetching Clerk users (${source}):`, error);
        break;
      }
    }
  }

  return found;
}

/**
 * Lookup order:
 * 1) Default app Clerk (CLERK_SECRET_KEY)
 * 2) Optional live/prod Clerk — needed when LMS enrollments come from another instance
 *    Env: CLERK_SECRET_KEY_LIVE or CLERK_LOOKUP_SECRET_KEY
 */
async function fetchClerkUsersBatch(
  userIds: string[],
  usersMap: Record<string, UserDetails>
): Promise<{ primary: number; live: number }> {
  if (userIds.length === 0) return { primary: 0, live: 0 };

  const primaryClerk = (await clerkClient()) as unknown as ClerkLike;
  let remaining = userIds.filter((id) => !usersMap[id]?.email);
  const primary = await fetchFromClerkInstance(
    primaryClerk,
    remaining,
    usersMap,
    'clerk'
  );

  remaining = userIds.filter((id) => !usersMap[id]?.email);
  const liveKey =
    process.env.CLERK_SECRET_KEY_LIVE ||
    process.env.CLERK_LOOKUP_SECRET_KEY ||
    '';

  let live = 0;
  if (remaining.length > 0 && liveKey && liveKey !== process.env.CLERK_SECRET_KEY) {
    const liveClerk = createClerkClient({
      secretKey: liveKey,
    }) as unknown as ClerkLike;
    live = await fetchFromClerkInstance(
      liveClerk,
      remaining,
      usersMap,
      'clerk-live'
    );
  } else if (remaining.length > 0 && !liveKey) {
    console.warn(
      `[user-details-batch] ${remaining.length} users still missing email. ` +
        'They are likely from another Clerk instance. Set CLERK_SECRET_KEY_LIVE ' +
        '(production sk_live_...) in .env.local to resolve them.'
    );
  }

  return { primary, live };
}

async function enrichFromProfiles(
  userIds: string[],
  usersMap: Record<string, UserDetails>
): Promise<number> {
  const supabase = getProfilesSupabase();
  if (!supabase || userIds.length === 0) return 0;

  const tables = ['profiles', 'myuni_profiles'] as const;
  let enriched = 0;

  for (const table of tables) {
    let tableExists = true;
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100);
      const { data, error } = await supabase
        .from(table)
        .select('clerk_user_id, email, first_name, last_name')
        .in('clerk_user_id', chunk);

      if (error) {
        if (error.message.includes('does not exist')) {
          tableExists = false;
          break;
        }
        console.error(`${table} enrich error:`, error.message);
        continue;
      }

      for (const row of data || []) {
        const id = row.clerk_user_id as string;
        if (!id) continue;
        const user = ensureUser(usersMap, id);
        const before = user.email;
        applyName(
          user,
          (row.first_name as string) || null,
          (row.last_name as string) || null,
          null
        );
        applyEmail(user, row.email as string, 'profile');
        if (!before && user.email) enriched += 1;
      }
    }
    if (tableExists) break;
  }

  return enriched;
}

function orderUserId(custom: unknown): string | null {
  if (!custom || typeof custom !== 'object') return null;
  const data = custom as { userId?: unknown; clerkUserId?: unknown };
  const id = data.userId || data.clerkUserId;
  return typeof id === 'string' && id ? id : null;
}

function orderUserName(custom: unknown): string | null {
  if (!custom || typeof custom !== 'object') return null;
  const data = custom as { userName?: unknown; name?: unknown };
  const name = data.userName || data.name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

/**
 * Scan ALL orders (dataset is small) and map custom_data.userId -> email.
 * Course filter alone misses users who bought via other courses / older rows.
 */
async function enrichFromOrders(
  userIds: string[],
  usersMap: Record<string, UserDetails>,
  _courseIds: string[]
): Promise<number> {
  const supabase = getLmsSupabase();
  if (!supabase || userIds.length === 0) return 0;

  const wanted = new Set(userIds);
  let enriched = 0;
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('orders')
      .select('useremail, custom_data')
      .not('useremail', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('orders enrich error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const order of data) {
      const id = orderUserId(order.custom_data);
      if (!id || !wanted.has(id)) continue;
      const user = ensureUser(usersMap, id);
      const before = user.email;
      applyDisplayName(user, orderUserName(order.custom_data));
      applyEmail(user, order.useremail, 'order');
      if (!before && user.email) enriched += 1;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return enriched;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds } = body;
    const courseIds: string[] = Array.isArray(body.courseIds)
      ? [
          ...new Set(
            (body.courseIds as unknown[])
              .map((id) => String(id ?? '').trim())
              .filter((id): id is string => Boolean(id))
          ),
        ]
      : typeof body.courseId === 'string' && body.courseId.trim()
        ? [body.courseId.trim()]
        : [];

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const limitedUserIds = [...new Set(userIds as string[])].slice(0, 300);
    const usersMap: Record<string, UserDetails> = {};

    const fromProfiles = await enrichFromProfiles(limitedUserIds, usersMap);
    const fromOrders = await enrichFromOrders(
      limitedUserIds,
      usersMap,
      courseIds
    );

    const needingClerk = limitedUserIds.filter((id) => !usersMap[id]?.email);
    const clerkResult = await fetchClerkUsersBatch(needingClerk, usersMap);

    for (const id of limitedUserIds) {
      ensureUser(usersMap, id);
      const user = usersMap[id];
      user.fullName = pickFullName(user, user.email, id);
      if (user.email && user.emailAddresses.length === 0) {
        user.emailAddresses = [{ emailAddress: user.email }];
      }
    }

    const withEmail = limitedUserIds.filter((id) =>
      Boolean(usersMap[id]?.email)
    ).length;

    return NextResponse.json({
      users: usersMap,
      meta: {
        total: limitedUserIds.length,
        fromClerk: clerkResult.primary,
        fromClerkLive: clerkResult.live,
        fromProfiles,
        fromOrders,
        needingClerk: needingClerk.length,
        withEmail,
        missingEmail: limitedUserIds.length - withEmail,
        hasLiveClerkKey: Boolean(
          process.env.CLERK_SECRET_KEY_LIVE ||
            process.env.CLERK_LOOKUP_SECRET_KEY
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching batch user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
