ALTER TABLE public.deep_funnel_products
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;