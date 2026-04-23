ALTER TABLE public.deep_funnel_products
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS cta_mode text NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS thankyou_text text,
  ADD COLUMN IF NOT EXISTS thankyou_media_url text,
  ADD COLUMN IF NOT EXISTS thankyou_media_type text,
  ADD COLUMN IF NOT EXISTS thankyou_media_caption text,
  ADD COLUMN IF NOT EXISTS thankyou_whatsapp_template text;

ALTER TABLE public.deep_funnel_products
  DROP CONSTRAINT IF EXISTS deep_funnel_products_cta_mode_check;
ALTER TABLE public.deep_funnel_products
  ADD CONSTRAINT deep_funnel_products_cta_mode_check
  CHECK (cta_mode IN ('whatsapp','checkout','both'));

ALTER TABLE public.deep_funnels
  ADD COLUMN IF NOT EXISTS thankyou_text text,
  ADD COLUMN IF NOT EXISTS thankyou_media_url text,
  ADD COLUMN IF NOT EXISTS thankyou_media_type text,
  ADD COLUMN IF NOT EXISTS thankyou_media_caption text;