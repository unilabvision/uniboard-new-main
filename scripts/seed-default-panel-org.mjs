/**
 * Seed default panel org + attach legacy user_module_access rows.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-default-panel-org.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL2, SUPABASE_SERVICE_ROLE_KEY2
 * And SQL from scripts/sql/panel-organizations-rbac.sql already applied.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL2 or SUPABASE_SERVICE_ROLE_KEY2');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: org, error: orgErr } = await supabase
    .from('panel_organizations')
    .upsert(
      { slug: 'uniboard', name: 'UniBoard', is_active: true },
      { onConflict: 'slug' }
    )
    .select('id, slug, name')
    .single();

  if (orgErr) {
    console.error('panel_organizations upsert failed:', orgErr.message);
    console.error('Apply scripts/sql/panel-organizations-rbac.sql first.');
    process.exit(1);
  }

  console.log('Default org:', org);

  const { data: rows, error } = await supabase
    .from('user_module_access')
    .select('id, clerk_user_id, module_key, panel_organization_id, access_level')
    .eq('is_enabled', true)
    .is('panel_organization_id', null);

  if (error) {
    console.error('Select failed:', error.message);
    process.exit(1);
  }

  let updated = 0;
  for (const row of rows ?? []) {
    // Skip pure super-admin flag rows if desired — still attach org for consistency
    const { error: upErr } = await supabase
      .from('user_module_access')
      .update({
        panel_organization_id: org.id,
        access_level: row.access_level || 'admin',
      })
      .eq('id', row.id);

    if (upErr) {
      console.warn('Skip', row.id, upErr.message);
    } else {
      updated += 1;
    }
  }

  console.log(`Updated ${updated} legacy rows → org ${org.slug} / access_level admin`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
