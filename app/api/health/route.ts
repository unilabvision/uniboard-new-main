import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DatabaseCheck = {
  configured: boolean;
  reachable: boolean;
  status?: number;
  error?: string;
};

const DATABASES = {
  identity: {
    url: 'NEXT_PUBLIC_SUPABASE_IDENTITY_URL',
    key: 'NEXT_PUBLIC_SUPABASE_IDENTITY_PUBLISHABLE_KEY',
  },
  learning: {
    url: 'NEXT_PUBLIC_SUPABASE_LEARNING_URL',
    key: 'NEXT_PUBLIC_SUPABASE_LEARNING_PUBLISHABLE_KEY',
  },
  form: {
    url: 'NEXT_PUBLIC_SUPABASE_FORM_URL',
    key: 'NEXT_PUBLIC_SUPABASE_FORM_PUBLISHABLE_KEY',
  },
} as const;

async function checkDatabase(
  urlName: string,
  keyName: string
): Promise<DatabaseCheck> {
  const url = process.env[urlName];
  const key = process.env[keyName];

  if (!url || !key) {
    return { configured: false, reachable: false, error: 'Missing configuration' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: key },
      signal: controller.signal,
      cache: 'no-store',
    });

    return {
      configured: true,
      reachable: response.ok,
      status: response.status,
      ...(response.ok ? {} : { error: 'Supabase health endpoint returned an error' }),
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const entries = await Promise.all(
    Object.entries(DATABASES).map(async ([name, config]) => [
      name,
      await checkDatabase(config.url, config.key),
    ])
  );
  const databases = Object.fromEntries(entries) as Record<string, DatabaseCheck>;
  const databaseValues = Object.values(databases);
  const healthy = databaseValues.every((database) => database.configured && database.reachable);

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      service: 'uniboard-new-main',
      timestamp: new Date().toISOString(),
      databases,
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  );
}
