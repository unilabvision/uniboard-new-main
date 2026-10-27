import 'server-only';

import { createHash } from 'crypto';
import { getMyuniPublicOrigin } from '@/app/lib/siteApplications/publicUrls';

function getRevalidationSecret(): string | null {
  const configuredSecret =
    process.env.MYUNI_CACHE_REVALIDATION_SECRET || process.env.CACHE_REVALIDATION_SECRET;
  if (configuredSecret) return configuredSecret;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!serviceRoleKey) return null;

  return createHash('sha256')
    .update(`myuni-cache-revalidation:${serviceRoleKey}`)
    .digest('hex');
}

export async function revalidatePublicCourseCache(): Promise<void> {
  const secret = getRevalidationSecret();
  if (!secret) return;

  try {
    const response = await fetch(`${getMyuniPublicOrigin()}/api/admin/cache/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cache-revalidation-secret': secret,
      },
      body: JSON.stringify({ resources: ['courses'] }),
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) {
      console.error('[lms] public course cache revalidation failed:', response.status);
    }
  } catch (error) {
    console.error(
      '[lms] public course cache revalidation failed:',
      error instanceof Error ? error.message : error
    );
  }
}
