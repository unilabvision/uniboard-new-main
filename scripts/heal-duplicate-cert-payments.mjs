/**
 * One-shot: Embriyoloji mükerrer pending → superseded
 * Run: node scripts/heal-duplicate-cert-payments.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      let v = l.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, i).trim(), v];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL2, env.SUPABASE_SERVICE_ROLE_KEY2, {
  auth: { persistSession: false },
});

const EVENT_ID = process.argv[2] || '85e0ac7b-13a5-46c6-aac1-e50bd505aa5d';

const { data: apps, error } = await sb
  .from('myuni_site_applications')
  .select('id, email, event_id, event_name, submission_data')
  .eq('event_id', EVENT_ID)
  .limit(500);

if (error) {
  console.error(error);
  process.exit(1);
}

const cert = (apps || []).filter(
  (a) => (a.submission_data || {}).registration_tier === 'certificate'
);

const paidByEmail = new Map();
for (const a of cert) {
  const s = a.submission_data || {};
  if (s.payment_status !== 'paid') continue;
  const email = String(a.email || '')
    .trim()
    .toLowerCase();
  if (email) paidByEmail.set(email, a.id);
}

let superseded = 0;
for (const a of cert) {
  const s = a.submission_data || {};
  if (s.payment_status !== 'pending') continue;
  const email = String(a.email || '')
    .trim()
    .toLowerCase();
  const sibling = paidByEmail.get(email);
  if (!sibling || sibling === a.id) continue;

  const next = {
    ...s,
    payment_status: 'superseded',
    payment_superseded_by: sibling,
    payment_superseded_at: new Date().toISOString(),
    payment_synced_from: 'duplicate_reconcile',
  };

  const { error: upErr } = await sb
    .from('myuni_site_applications')
    .update({ submission_data: next, updated_at: new Date().toISOString() })
    .eq('id', a.id);

  if (upErr) {
    console.error('fail', a.id, upErr.message);
    continue;
  }
  superseded += 1;
  console.log('superseded', a.email, a.id, '-> paid', sibling);
}

const pendingLeft = cert.filter((a) => {
  // re-read would be better; approximate from local if updated
  return true;
});

const { data: after } = await sb
  .from('myuni_site_applications')
  .select('submission_data')
  .eq('event_id', EVENT_ID)
  .limit(500);

const pending = (after || []).filter((a) => {
  const s = a.submission_data || {};
  return s.registration_tier === 'certificate' && s.payment_status === 'pending';
}).length;
const paid = (after || []).filter((a) => {
  const s = a.submission_data || {};
  return s.registration_tier === 'certificate' && s.payment_status === 'paid';
}).length;
const superCount = (after || []).filter((a) => {
  const s = a.submission_data || {};
  return s.registration_tier === 'certificate' && s.payment_status === 'superseded';
}).length;

console.log(JSON.stringify({ superseded, pending, paid, superCount }, null, 2));
