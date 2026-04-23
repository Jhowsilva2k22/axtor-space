-- 1. Add columns to landing_partners
ALTER TABLE public.landing_partners
  ADD COLUMN IF NOT EXISTS bio_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text,
  ADD COLUMN IF NOT EXISTS secondary_cta_label text,
  ADD COLUMN IF NOT EXISTS secondary_cta_url text;

-- 2. Allow tenant owner to update their own landing_partner row
DROP POLICY IF EXISTS "Tenant owners update own landing partner" ON public.landing_partners;
CREATE POLICY "Tenant owners update own landing partner"
  ON public.landing_partners
  FOR UPDATE
  TO authenticated
  USING (is_tenant_owner(tenant_id))
  WITH CHECK (is_tenant_owner(tenant_id));

-- 3. Public RPC to fetch CTAs for a given utm_source
CREATE OR REPLACE FUNCTION public.get_landing_partner_ctas(_utm_source text)
RETURNS TABLE(
  tenant_id uuid,
  slug text,
  display_name text,
  bio_url text,
  instagram_handle text,
  whatsapp_number text,
  whatsapp_message text,
  secondary_cta_label text,
  secondary_cta_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lp.tenant_id,
    t.slug,
    t.display_name,
    lp.bio_url,
    lp.instagram_handle,
    lp.whatsapp_number,
    lp.whatsapp_message,
    lp.secondary_cta_label,
    lp.secondary_cta_url
  FROM public.landing_partners lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.is_active = true
    AND t.status = 'active'
    AND lower(lp.utm_source) = lower(coalesce(_utm_source, ''))
  ORDER BY lp.priority DESC, lp.created_at ASC
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_partner_ctas(text) TO anon, authenticated;