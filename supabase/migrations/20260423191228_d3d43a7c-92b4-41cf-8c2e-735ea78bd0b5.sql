-- Tabela de parceiros da landing principal
CREATE TABLE public.landing_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  utm_source text NOT NULL,
  note text,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT landing_partners_utm_source_unique UNIQUE (utm_source),
  CONSTRAINT landing_partners_utm_source_format CHECK (utm_source ~ '^[a-z0-9][a-z0-9_-]{1,40}$')
);

CREATE INDEX idx_landing_partners_tenant ON public.landing_partners(tenant_id);
CREATE INDEX idx_landing_partners_active ON public.landing_partners(is_active) WHERE is_active = true;

-- Trigger de updated_at
CREATE TRIGGER set_landing_partners_updated_at
BEFORE UPDATE ON public.landing_partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.landing_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage landing partners"
ON public.landing_partners FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant owners read own landing partners"
ON public.landing_partners FOR SELECT
TO authenticated
USING (is_tenant_owner(tenant_id));

-- Função pública pra resolver tenant a partir do utm_source da landing
CREATE OR REPLACE FUNCTION public.resolve_landing_tenant(_utm_source text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lp.tenant_id
  FROM public.landing_partners lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.is_active = true
    AND t.status = 'active'
    AND lower(lp.utm_source) = lower(coalesce(_utm_source, ''))
  ORDER BY lp.priority DESC, lp.created_at ASC
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.resolve_landing_tenant(text) TO anon, authenticated;