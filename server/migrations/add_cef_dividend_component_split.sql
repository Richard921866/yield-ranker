-- Add CEF dividend component split fields to dividends_detail
-- These fields allow representing "regular + special" combined payouts (e.g., year-end cap gains)
-- without creating a second dividend row (ticker+ex_date is unique).

DO $$
BEGIN
  -- regular_component
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dividends_detail'
      AND column_name = 'regular_component'
  ) THEN
    ALTER TABLE public.dividends_detail
      ADD COLUMN regular_component numeric(12,6);
  END IF;

  -- special_component
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dividends_detail'
      AND column_name = 'special_component'
  ) THEN
    ALTER TABLE public.dividends_detail
      ADD COLUMN special_component numeric(12,6);
  END IF;
END $$;


