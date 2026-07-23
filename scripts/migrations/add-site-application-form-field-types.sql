-- Site application forms: Google Forms–style field types + package settings
-- Run on the MyUni / URL2 Supabase project (NEXT_PUBLIC_SUPABASE_URL2).
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Forms table: package_settings + optional form_type
-- ---------------------------------------------------------------------------
ALTER TABLE public.myuni_site_application_forms
  ADD COLUMN IF NOT EXISTS package_settings jsonb DEFAULT NULL;

ALTER TABLE public.myuni_site_application_forms
  ADD COLUMN IF NOT EXISTS form_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'myuni_site_application_forms_form_type_check'
  ) THEN
    ALTER TABLE public.myuni_site_application_forms
      ADD CONSTRAINT myuni_site_application_forms_form_type_check
      CHECK (form_type IS NULL OR form_type IN ('team', 'event'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Form fields: options as jsonb + expanded field_type allow-list
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Normalize options column to jsonb when it exists as text/json
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'myuni_site_application_form_fields'
      AND column_name = 'options'
      AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE public.myuni_site_application_form_fields
      ALTER COLUMN options TYPE jsonb
      USING CASE
        WHEN options IS NULL THEN '[]'::jsonb
        WHEN pg_typeof(options)::text IN ('json', 'jsonb') THEN options::jsonb
        ELSE COALESCE(options::text::jsonb, '[]'::jsonb)
      END;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Keep going if cast fails on legacy rows; fix those manually if needed
    RAISE NOTICE 'options column cast skipped: %', SQLERRM;
END $$;

ALTER TABLE public.myuni_site_application_form_fields
  ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb;

-- Drop any existing field_type CHECK so we can replace it
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'myuni_site_application_form_fields'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%field_type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.myuni_site_application_form_fields DROP CONSTRAINT IF EXISTS %I',
      r.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.myuni_site_application_form_fields
  ADD CONSTRAINT myuni_site_application_form_fields_field_type_check
  CHECK (
    field_type IN (
      'text',
      'email',
      'tel',
      'textarea',
      'number',
      'date',
      'time',
      'url',
      'select',
      'checkbox',
      'dropdown',
      'linear_scale',
      'rating',
      'file'
    )
  );

COMMENT ON CONSTRAINT myuni_site_application_form_fields_field_type_check
  ON public.myuni_site_application_form_fields IS
  'Allowed dynamic form field types (admin builder + public DynamicSiteApplicationForm)';

-- ---------------------------------------------------------------------------
-- Backfill form_type from event_id when missing
-- ---------------------------------------------------------------------------
UPDATE public.myuni_site_application_forms
SET form_type = CASE
  WHEN event_id IS NOT NULL THEN 'event'
  ELSE 'team'
END
WHERE form_type IS NULL;
