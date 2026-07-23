import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getModuleCapabilityKeys,
  parseModuleCapabilitiesInput,
  resolveCapabilitiesPrimaryKey,
} from '@/app/lib/moduleAccess/capabilities';
import { getModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';

export const ACCESS_LEVELS = ['viewer', 'editor', 'admin'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const ACCESS_LEVEL_LABELS: Record<
  AccessLevel,
  { tr: string; en: string }
> = {
  viewer: { tr: 'Görüntüleyici', en: 'Viewer' },
  editor: { tr: 'Editör', en: 'Editor' },
  admin: { tr: 'Admin', en: 'Admin' },
};

/** Seviye üstüne çıkmayan yazma / yönetim anahtarları */
const VIEWER_EXCLUDED = new Set([
  'edit',
  'create',
  'issuance',
  'ops',
  'access',
  'settings',
  'reviewers',
  'matching',
  'templates',
  'campaigns',
]);

const CAPABILITIES_NOTES_PREFIX = 'uba_caps:';

export type PanelMembership = {
  id: string;
  moduleKey: string;
  panelOrganizationId: string | null;
  accessLevel: AccessLevel | null;
  capabilities: string[] | null;
  isSuperAdmin: boolean;
  isEnabled: boolean;
};

export type ResolvedMembership = {
  isSuperAdmin: boolean;
  /** En güçlü üyelik (admin > editor > viewer); yoksa null */
  membership: PanelMembership | null;
  /** Aynı modüldeki tüm org üyelikleri */
  memberships: PanelMembership[];
  moduleKeys: string[];
};

export function isAccessLevel(value: unknown): value is AccessLevel {
  return (
    typeof value === 'string' &&
    (ACCESS_LEVELS as readonly string[]).includes(value)
  );
}

export function parseAccessLevelInput(raw: unknown): AccessLevel {
  if (isAccessLevel(raw)) return raw;
  return 'editor';
}

export function levelRank(level: AccessLevel | null | undefined): number {
  if (level === 'admin') return 3;
  if (level === 'editor') return 2;
  if (level === 'viewer') return 1;
  // Legacy null level = full (treat as admin for rank comparisons on old rows)
  if (level == null) return 3;
  return 0;
}

export function defaultCapabilitiesForLevel(
  moduleSlugOrPrimary: string,
  level: AccessLevel
): string[] {
  const all = getModuleCapabilityKeys(moduleSlugOrPrimary);
  if (all.length === 0) return [];
  if (level === 'admin') return [...all];
  if (level === 'editor') return all.filter((k) => k !== 'access');
  return all.filter((k) => !VIEWER_EXCLUDED.has(k));
}

/**
 * Seçilen özellikleri seviye tavanına clamp et (üstüne ekleme yok).
 */
export function clampCapabilitiesToLevel(
  moduleSlugOrPrimary: string,
  level: AccessLevel,
  requested: string[] | null | undefined
): string[] {
  const ceiling = new Set(defaultCapabilitiesForLevel(moduleSlugOrPrimary, level));
  const parsed = parseModuleCapabilitiesInput(
    moduleSlugOrPrimary,
    requested ?? defaultCapabilitiesForLevel(moduleSlugOrPrimary, level)
  );
  if (!parsed) return [...ceiling];
  const clamped = parsed.filter((k) => ceiling.has(k));
  return clamped.length > 0
    ? clamped
    : defaultCapabilitiesForLevel(moduleSlugOrPrimary, level);
}

export function decodeCapabilitiesFromRow(row: {
  capabilities?: unknown;
  notes?: unknown;
}): string[] | null {
  if (Array.isArray(row.capabilities)) {
    return row.capabilities.filter((c): c is string => typeof c === 'string');
  }
  if (
    typeof row.notes === 'string' &&
    row.notes.startsWith(CAPABILITIES_NOTES_PREFIX)
  ) {
    try {
      const parsed = JSON.parse(
        row.notes.slice(CAPABILITIES_NOTES_PREFIX.length)
      );
      if (Array.isArray(parsed)) {
        return parsed.filter((c): c is string => typeof c === 'string');
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function encodeCapabilitiesNotes(capabilities: string[]): string {
  return `${CAPABILITIES_NOTES_PREFIX}${JSON.stringify(capabilities)}`;
}

function rowToMembership(row: {
  id?: string;
  module_key: string;
  panel_organization_id?: string | null;
  access_level?: string | null;
  is_super_admin?: boolean;
  is_enabled?: boolean;
  capabilities?: unknown;
  notes?: unknown;
}): PanelMembership {
  return {
    id: row.id || `${row.module_key}`,
    moduleKey: row.module_key,
    panelOrganizationId: row.panel_organization_id ?? null,
    accessLevel: isAccessLevel(row.access_level) ? row.access_level : null,
    capabilities: decodeCapabilitiesFromRow(row),
    isSuperAdmin: row.is_super_admin === true,
    isEnabled: row.is_enabled !== false,
  };
}

export function pickStrongestMembership(
  memberships: PanelMembership[]
): PanelMembership | null {
  if (memberships.length === 0) return null;
  return [...memberships].sort(
    (a, b) => levelRank(b.accessLevel) - levelRank(a.accessLevel)
  )[0];
}

export async function loadUserAccessRows(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<
  Array<{
    id: string;
    clerk_user_id: string;
    module_key: string;
    is_enabled: boolean;
    is_super_admin: boolean;
    granted_at?: string;
    notes?: string | null;
    panel_organization_id?: string | null;
    access_level?: string | null;
    capabilities?: unknown;
  }>
> {
  const full = await supabase
    .from('user_module_access')
    .select(
      'id, clerk_user_id, module_key, is_enabled, is_super_admin, granted_at, notes, panel_organization_id, access_level, capabilities'
    )
    .eq('clerk_user_id', clerkUserId)
    .eq('is_enabled', true);

  if (!full.error) return (full.data as Array<Record<string, unknown>> ?? []) as Array<{
    id: string;
    clerk_user_id: string;
    module_key: string;
    is_enabled: boolean;
    is_super_admin: boolean;
    granted_at?: string;
    notes?: string | null;
    panel_organization_id?: string | null;
    access_level?: string | null;
    capabilities?: unknown;
  }>;

  // Migration henüz uygulanmadıysa legacy kolonlar
  const legacy = await supabase
    .from('user_module_access')
    .select(
      'id, clerk_user_id, module_key, is_enabled, is_super_admin, granted_at, notes'
    )
    .eq('clerk_user_id', clerkUserId)
    .eq('is_enabled', true);

  if (legacy.error) throw new Error(legacy.error.message);
  return (legacy.data ?? []) as Array<{
    id: string;
    clerk_user_id: string;
    module_key: string;
    is_enabled: boolean;
    is_super_admin: boolean;
    granted_at?: string;
    notes?: string | null;
    panel_organization_id?: string | null;
    access_level?: string | null;
    capabilities?: unknown;
  }>;
}

export function resolveMembershipFromRows(
  rows: Array<Record<string, unknown>>,
  moduleSlugOrPrimary: string
): ResolvedMembership {
  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const moduleKeys = rows.map((r) => String(r.module_key));
  const def = getModuleAccessDefinition(moduleSlugOrPrimary);
  const keys = def?.moduleKeys ?? [
    resolveCapabilitiesPrimaryKey(moduleSlugOrPrimary),
  ];

  const memberships = rows
    .filter((r) => keys.includes(String(r.module_key)))
    .map((r) =>
      rowToMembership(
        r as {
          id?: string;
          module_key: string;
          panel_organization_id?: string | null;
          access_level?: string | null;
          is_super_admin?: boolean;
          is_enabled?: boolean;
          capabilities?: unknown;
          notes?: unknown;
        }
      )
    );

  return {
    isSuperAdmin,
    membership: pickStrongestMembership(memberships),
    memberships,
    moduleKeys,
  };
}

export async function resolveMembership(
  supabase: SupabaseClient,
  clerkUserId: string,
  moduleSlugOrPrimary: string
): Promise<ResolvedMembership> {
  const rows = await loadUserAccessRows(supabase, clerkUserId);
  return resolveMembershipFromRows(rows, moduleSlugOrPrimary);
}

/** Legacy null level/caps = tam yetki */
export function hasFeature(
  membership: PanelMembership | null,
  required: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (!membership) return false;
  if (membership.accessLevel == null && membership.capabilities == null) {
    return true;
  }
  if (membership.accessLevel === 'admin') {
    const caps = membership.capabilities;
    if (caps == null || caps.length === 0) return true;
    return caps.includes(required);
  }
  const caps = membership.capabilities;
  if (caps == null || caps.length === 0) {
    // level set but empty caps → use level defaults
    const level = membership.accessLevel || 'editor';
    return defaultCapabilitiesForLevel(membership.moduleKey, level).includes(
      required
    );
  }
  return caps.includes(required);
}

export function canWrite(
  membership: PanelMembership | null,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (!membership) return false;
  return levelRank(membership.accessLevel) >= levelRank('editor');
}

export function isOrgAdmin(
  membership: PanelMembership | null,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (!membership) return false;
  if (membership.accessLevel == null && membership.capabilities == null) {
    // legacy full access can manage
    return true;
  }
  return membership.accessLevel === 'admin' || hasFeature(membership, 'access', false);
}

export function canManageAccess(
  resolved: ResolvedMembership,
  targetOrgId: string | null | undefined
): boolean {
  if (resolved.isSuperAdmin) return true;
  if (!isOrgAdmin(resolved.membership, false)) return false;
  // Org admin: must manage within their org(s)
  if (!targetOrgId) return false;
  return resolved.memberships.some(
    (m) =>
      m.panelOrganizationId === targetOrgId &&
      (m.accessLevel === 'admin' ||
        hasFeature(m, 'access', false) ||
        (m.accessLevel == null && m.capabilities == null))
  );
}

export function managedOrganizationIds(
  resolved: ResolvedMembership
): string[] | 'all' {
  if (resolved.isSuperAdmin) return 'all';
  return resolved.memberships
    .filter(
      (m) =>
        m.accessLevel === 'admin' ||
        hasFeature(m, 'access', false) ||
        (m.accessLevel == null && m.capabilities == null)
    )
    .map((m) => m.panelOrganizationId)
    .filter((id): id is string => Boolean(id));
}
