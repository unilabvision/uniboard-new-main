-- Site-applications opportunities: tenant + form link + banner
ALTER TABLE myuni_opportunities
  ADD COLUMN IF NOT EXISTS panel_organization_id UUID NULL,
  ADD COLUMN IF NOT EXISTS site_form_id UUID NULL,
  ADD COLUMN IF NOT EXISTS opportunity_type TEXT NOT NULL DEFAULT 'staj',
  ADD COLUMN IF NOT EXISTS created_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS banner_url TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_myuni_opportunities_panel_org
  ON myuni_opportunities(panel_organization_id);

CREATE INDEX IF NOT EXISTS idx_myuni_opportunities_site_form
  ON myuni_opportunities(site_form_id);

CREATE INDEX IF NOT EXISTS idx_myuni_opportunities_type
  ON myuni_opportunities(opportunity_type);

COMMENT ON COLUMN myuni_opportunities.panel_organization_id IS 'Tenant scope for site-applications panel orgs';
COMMENT ON COLUMN myuni_opportunities.site_form_id IS 'Linked myuni_site_application_forms.id for apply CTA';
COMMENT ON COLUMN myuni_opportunities.opportunity_type IS 'staj | gonullu | is';
COMMENT ON COLUMN myuni_opportunities.created_by IS 'Clerk user id of creator';
COMMENT ON COLUMN myuni_opportunities.banner_url IS 'Public URL for /stajlar/{slug} detail banner';
