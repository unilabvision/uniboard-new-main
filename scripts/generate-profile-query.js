const fs = require('fs');
const path = require('path');

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'user-record.json'), 'utf8')
);
const ids = data.map((r) => r.user_id);
const quoted = ids.map((id) => `  '${id}'`).join(',\n');

// myuni_profiles does not exist in this project — run on LMS DB (NEXT_PUBLIC_SUPABASE_URL2)
const sql = `-- Run on LMS database (emfvwpztyuykqtepnsfp / NEXT_PUBLIC_SUPABASE_URL2)
-- Student names live in Clerk, not Supabase. This checks enrollment records only.

SELECT
  user_id,
  COUNT(*) AS enrollment_count,
  MIN(created_at) AS first_enrolled_at,
  MAX(created_at) AS last_enrolled_at
FROM myuni_enrollments
WHERE user_id IN (
${quoted}
)
GROUP BY user_id
ORDER BY enrollment_count DESC;
`;

const outPath = path.join(__dirname, '..', 'query-profiles.sql');
fs.writeFileSync(outPath, sql);
console.log(`Generated ${outPath} with ${ids.length} user IDs`);
