-- Prefer the full migration:
--   scripts/migrations/add-site-application-form-field-types.sql
-- This file only adds package_settings (kept for older error-message references).

ALTER TABLE public.myuni_site_application_forms
  ADD COLUMN IF NOT EXISTS package_settings jsonb DEFAULT NULL;
