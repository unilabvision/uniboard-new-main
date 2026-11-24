export type SupabaseDatabase = 'identity' | 'learning' | 'forms';

/**
 * Cross-project ownership contract.
 *
 * A table must have exactly one owner. Cross-database relations are resolved in
 * the application layer; they must never be implemented by silently falling
 * back to another Supabase project.
 */
export const KNOWN_TABLES_BY_DATABASE = {
  identity: [
    'campaigns',
    'certificate_issuance_queue',
    'certificate_templates',
    'certificates',
    'discount_codes',
    'modules',
    'myuni_certificates',
    'myuni_commissions',
    'myuni_enrollments',
    'myuni_event_certificates',
    'myuni_certificate_exceptions',
    'myuni_membership_audit_log',
    'myuni_membership_entitlements',
    'myuni_membership_passes',
    'myuni_membership_plan_benefits',
    'myuni_membership_plans',
    'myuni_package_enrollments',
    'myuni_products',
    'myuni_products_purchases',
    'orders',
    'organizations',
    'org_smtp_configs',
    'panel_organizations',
    'user_module_access',
    'user_profiles',
  ],
  learning: [
    'myuni_analytics',
    'myuni_career_tags',
    'myuni_case_result',
    'myuni_comments',
    'myuni_course_career_tags',
    'myuni_course_lessons',
    'myuni_course_objectives',
    'myuni_course_requirements',
    'myuni_course_sections',
    'myuni_course_tiers',
    'myuni_courses',
    'myuni_documents',
    'myuni_edge',
    'myuni_edge_content',
    'myuni_edge_data',
    'myuni_edge_progress',
    'myuni_edge_sections',
    'myuni_event_comments',
    'myuni_event_competition_results',
    'myuni_event_competitions',
    'myuni_event_enrollments',
    'myuni_event_lessons',
    'myuni_event_notes',
    'myuni_event_sections',
    'myuni_event_user_progress',
    'myuni_event_videos',
    'myuni_events',
    'myuni_kurum_course_lessons_user',
    'myuni_kurum_courses',
    'myuni_kurum_enrollments',
    'myuni_kurum_home',
    'myuni_kurum_lessons_data',
    'myuni_kurum_personalized_education',
    'myuni_kurum_personalized_education_user',
    'myuni_kurum_user_notes',
    'myuni_kurum_user_progress',
    'myuni_live_registrations',
    'myuni_live_sessions',
    'myuni_notes',
    'myuni_opportunities',
    'myuni_opportunity_career_tags',
    'myuni_opportunity_courses',
    'myuni_package_courses',
    'myuni_packages',
    'myuni_quicks',
    'myuni_session_attendance',
    'myuni_tier_sessions',
    'myuni_user_notes',
    'myuni_user_progress',
    'myuni_videos',
    'myuni_videos_backup',
    'unicom_event_control',
    'unicom_event_enrollments',
    'unicom_event_enrollments_attendance',
    'unicom_event_sessions',
    'unicom_event_sessions_attendance',
    'unicom_events',
    'unicom_home',
    'unicom_sponsors',
    'unicom_topics',
    'unicom_topics_meta',
    'unicom_user_data',
  ],
  forms: [
    'blog_comments',
    'form_configs',
    'form_submissions',
    'internship_applications',
    'internship_form_configs',
    'internship_form_fields',
    'internship_reviewers',
    'internship_status_history',
    'internship_votes',
    'mentorship_application_status_history',
    'mentorship_applications',
    'mentorships',
    'myuni_application_status_history',
    'myuni_applications',
    'myuni_contacts',
    'myuni_form_submissions',
    'myuni_opportunity_application_status_history',
    'myuni_opportunity_applications',
    'myuni_site_application_form_fields',
    'myuni_site_application_forms',
    'myuni_site_application_status_history',
    'myuni_site_applications',
    'partners',
    'unilab_vision_apply',
    'unilab_vision_blog_categories',
    'unilab_vision_blog_post_tags',
    'unilab_vision_blog_posts',
    'unilab_vision_contact_submissions',
    'unilab_vision_form_configs',
    'unilab_vision_form_fields',
    'unilab_vision_forms_management',
    'unilab_vision_newsletter_subscriptions',
    'unilab_vision_votes',
  ],
} as const satisfies Record<SupabaseDatabase, readonly string[]>;

const tableOwners = new Map<string, SupabaseDatabase>();

for (const [database, tables] of Object.entries(KNOWN_TABLES_BY_DATABASE) as Array<
  [SupabaseDatabase, readonly string[]]
>) {
  for (const table of tables) {
    const existingOwner = tableOwners.get(table);
    if (existingOwner) {
      throw new Error(
        `Supabase table ownership conflict: ${table} is assigned to ${existingOwner} and ${database}`
      );
    }
    tableOwners.set(table, database);
  }
}

export function databaseForTable(table: string): SupabaseDatabase {
  const owner = tableOwners.get(table);
  if (!owner) {
    throw new Error(
      `Unknown Supabase table "${table}". Add it to databaseOwnership.ts before querying it.`
    );
  }
  return owner;
}

const RPC_DATABASES: Readonly<Record<string, SupabaseDatabase>> = {
  get_course_rating_summary: 'learning',
  get_public_campaign: 'identity',
  match_case_result_with_user: 'learning',
  myuni_membership_deliver_pass: 'identity',
};

export function databaseForRpc(fn: string): SupabaseDatabase {
  const owner = RPC_DATABASES[fn];
  if (!owner) {
    throw new Error(
      `Unknown Supabase RPC "${fn}". Add it to databaseOwnership.ts before calling it.`
    );
  }
  return owner;
}
