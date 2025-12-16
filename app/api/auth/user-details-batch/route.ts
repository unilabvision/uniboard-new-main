import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

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

    // Limit batch size to prevent overwhelming the API
    const limitedUserIds = userIds.slice(0, 100);

    // Fetch user details from Clerk in batch
    const clerk = await clerkClient();
    const users = await Promise.all(
      limitedUserIds.map(async (userId: string) => {
        try {
          const user = await clerk.users.getUser(userId);
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            emailAddresses: user.emailAddresses,
            imageUrl: user.imageUrl
          };
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return {
            id: userId,
            firstName: null,
            lastName: null,
            username: null,
            emailAddresses: [],
            imageUrl: null
          };
        }
      })
    );

    // Convert to map format for easier lookup
    const usersMap: Record<string, unknown> = {};
    users.forEach(user => {
      usersMap[user.id] = user;
    });

    return NextResponse.json({ users: usersMap });

  } catch (error) {
    console.error('Error fetching batch user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}