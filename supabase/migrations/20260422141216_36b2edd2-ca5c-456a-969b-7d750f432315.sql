-- Table for per-block campaign links with UTM tracking
CREATE TABLE public.bio_block_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id uuid NOT NULL REFERENCES public.bio_blocks(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  is_active boolean NOT NULL DEFAULT true,
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bio_block_campaigns_block ON public.bio_block_campaigns (block_id);
CREATE INDEX idx_bio_block_campaigns_slug ON public.bio_block_campaigns (slug);

ALTER TABLE public.bio_block_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns"
  ON public.bio_block_campaigns
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active campaigns"
  ON public.bio_block_campaigns
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bio_block_campaigns_updated_at
  BEFORE UPDATE ON public.bio_block_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Track which campaign brought each click
ALTER TABLE public.bio_clicks ADD COLUMN IF NOT EXISTS campaign_slug text;
CREATE INDEX IF NOT EXISTS idx_bio_clicks_campaign_slug ON public.bio_clicks (campaign_slug);

-- Public function to resolve a campaign slug and atomically increment click count.
-- Returns the resolved block URL + UTMs so the redirect page can build the final URL.
CREATE OR REPLACE FUNCTION public.resolve_campaign(_slug text)
RETURNS TABLE(
  block_id uuid,
  block_url text,
  block_label text,
  block_kind text,
  utm_source text,
  utm_medium text,
  utm_campaign text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _campaign_id uuid;
BEGIN
  SELECT c.id INTO _campaign_id
  FROM bio_block_campaigns c
  WHERE c.slug = _slug AND c.is_active = true
  LIMIT 1;

  IF _campaign_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE bio_block_campaigns
  SET clicks_count = clicks_count + 1
  WHERE id = _campaign_id;

  RETURN QUERY
  SELECT
    b.id, b.url, b.label, b.kind,
    c.utm_source, c.utm_medium, c.utm_campaign
  FROM bio_block_campaigns c
  JOIN bio_blocks b ON b.id = c.block_id
  WHERE c.id = _campaign_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.resolve_campaign(text) TO anon, authenticated;