/**
 * Smoke check for Clerk JWT template + live email lookup env.
 * Usage: node scripts/smoke-clerk-jwt.mjs
 */
import { readFileSync } from 'fs';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) {
    process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
}

const template = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || 'supabase';
const liveKey =
  process.env.CLERK_SECRET_KEY_LIVE || process.env.CLERK_LOOKUP_SECRET_KEY || '';
const primaryKey = process.env.CLERK_SECRET_KEY || '';

console.log('JWT template env:', template);
console.log('Primary Clerk key set:', Boolean(primaryKey), primaryKey.slice(0, 10) + '...');
console.log('Live Clerk key set:', Boolean(liveKey), liveKey ? liveKey.slice(0, 10) + '...' : '(missing)');

const lms = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL2,
  process.env.SUPABASE_SERVICE_ROLE_KEY2,
  { auth: { persistSession: false } }
);

const { data: enrs } = await lms
  .from('myuni_enrollments')
  .select('user_id')
  .or('is_active.eq.true,is_active.is.null')
  .limit(20);

const sampleIds = [...new Set((enrs || []).map((e) => e.user_id))].slice(0, 10);
console.log('Sample enrollment user ids:', sampleIds.length);

async function tryClerk(label, secretKey, ids) {
  if (!secretKey) {
    console.log(`[${label}] skipped — no key`);
    return 0;
  }
  const clerk = createClerkClient({ secretKey });
  try {
    const { data } = await clerk.users.getUserList({ userId: ids, limit: 100 });
    let withEmail = 0;
    for (const u of data) {
      const email =
        u.primaryEmailAddress?.emailAddress ||
        u.emailAddresses?.[0]?.emailAddress ||
        '';
      if (email) withEmail += 1;
    }
    console.log(
      `[${label}] returned ${data.length}/${ids.length}, withEmail ${withEmail}`
    );
    return withEmail;
  } catch (e) {
    console.log(`[${label}] error:`, e.status || e.message);
    return 0;
  }
}

await tryClerk('primary', primaryKey, sampleIds);
await tryClerk('live', liveKey, sampleIds);

if (!liveKey) {
  console.log(
    '\nACTION: Set CLERK_SECRET_KEY_LIVE=sk_live_... in .env.local ' +
      '(MyUniLab / clerk.myunilab.net) then re-run this script.'
  );
}

console.log(
  '\nJWKS (Supabase third-party auth): https://clerk.myunilab.net/.well-known/jwks.json'
);
console.log(
  'Dev token check (while logged in): GET /api/auth/clerk-jwt-status'
);
