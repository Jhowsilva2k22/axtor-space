
ALTER TABLE public.deep_funnel_products
  ADD COLUMN IF NOT EXISTS who_for text,
  ADD COLUMN IF NOT EXISTS how_it_works text,
  ADD COLUMN IF NOT EXISTS benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS urgency_text text,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_secondary_label text;
