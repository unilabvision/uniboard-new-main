import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

type UserDetails = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string | null;
};

function clerkUserToDetails(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string;
}): UserDetails {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    emailAddresses: user.emailAddresses,
    imageUrl: user.imageUrl,
  };
}

/** Clerk getUserList accepts up to 100 user IDs per request. */
async function fetchClerkUsersBatch(userIds: string[]): Promise<UserDetails[]> {
  if (userIds.length === 0) return [];

  const clerk = await clerkClient();
  const results: UserDetails[] = [];

  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    try {
      const { data } = await clerk.users.getUserList({
        userId: chunk,
        limit: 100,
      });
      for (const user of data) {
        results.push(clerkUserToDetails(user));
      }
    } catch (error) {
      console.error('Error fetching Clerk user batch:', error);
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const limitedUserIds = [...new Set(userIds as string[])].slice(0, 100);
    const clerkUsers = await fetchClerkUsersBatch(limitedUserIds);

    const usersMap: Record<string, UserDetails> = {};
    clerkUsers.forEach((user) => {
      usersMap[user.id] = user;
    });

    return NextResponse.json({
      users: usersMap,
      meta: {
        total: limitedUserIds.length,
        fromClerk: clerkUsers.length,
        missing: limitedUserIds.length - clerkUsers.length,
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
