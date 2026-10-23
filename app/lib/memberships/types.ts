export type MembershipPlanStatus = 'draft' | 'published' | 'archived';
export type MembershipResourceType = 'course' | 'product' | 'event';
export type MembershipAccessScope = 'catalog' | 'specific';
export type MembershipCapability = 'view' | 'participate' | 'certificate';

export type MembershipBenefit = {
  id?: string;
  plan_id?: string;
  resource_type: MembershipResourceType;
  access_scope: MembershipAccessScope;
  resource_id: string | null;
  capability: MembershipCapability;
  label_tr?: string | null;
  label_en?: string | null;
  sort_order?: number;
};

export type MembershipPlan = {
  id: string;
  family_code: string;
  code: string;
  version: number;
  duration_months: 1 | 3 | 6;
  name_tr: string;
  name_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  price: number;
  currency: string;
  status: MembershipPlanStatus;
  is_visible: boolean;
  published_at: string | null;
  updated_at: string;
  myuni_membership_plan_benefits: MembershipBenefit[];
};

export type MembershipCatalogItem = {
  id: string;
  title: string;
  slug: string | null;
  type: MembershipResourceType;
  subtype: string | null;
  isActive: boolean;
};
