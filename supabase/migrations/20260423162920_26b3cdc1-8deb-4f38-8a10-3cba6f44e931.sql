
-- ============================================================
-- 1. WHATSAPP NUMBER em tenants
-- ============================================================
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- ============================================================
-- 2. TENANT_ADDONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  addon_slug text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active | canceled | past_due
  purchase_type text NOT NULL DEFAULT 'one_time', -- one_time | subscription
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, addon_slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_addons_tenant ON public.tenant_addons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_addons_status ON public.tenant_addons(status);

ALTER TABLE public.tenant_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin or owner read tenant addons"
  ON public.tenant_addons FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(tenant_id));

CREATE POLICY "Service role manages tenant addons"
  ON public.tenant_addons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_tenant_addons_updated
  BEFORE UPDATE ON public.tenant_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. has_addon() com bypass partner/tester
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_addon(_tenant_id uuid, _addon_slug text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.tenants
        WHERE id = _tenant_id AND plan IN ('partner','tester')
      ) THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.tenant_addons
        WHERE tenant_id = _tenant_id
          AND addon_slug = _addon_slug
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > now())
      )
    END
$$;

-- ============================================================
-- 4. DEEP_FUNNELS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deep_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  briefing jsonb NOT NULL DEFAULT '{}'::jsonb,
  welcome_text text,
  welcome_media_url text,
  welcome_media_type text, -- image | video | audio
  welcome_media_caption text,
  result_intro text,
  lock_until_media_ends boolean NOT NULL DEFAULT true,
  allow_skip_after_seconds integer NOT NULL DEFAULT 5,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_funnels_tenant ON public.deep_funnels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deep_funnels_slug ON public.deep_funnels(slug);

ALTER TABLE public.deep_funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published funnels"
  ON public.deep_funnels FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(tenant_id));

CREATE POLICY "Admin or owner manage funnels"
  ON public.deep_funnels FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(tenant_id))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(tenant_id));

CREATE TRIGGER trg_deep_funnels_updated
  BEFORE UPDATE ON public.deep_funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: bloqueia publicar sem addon
CREATE OR REPLACE FUNCTION public.enforce_deep_funnel_addon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_published = true THEN
    IF NOT public.has_addon(NEW.tenant_id, 'deep_diagnostic') THEN
      RAISE EXCEPTION 'deep_diagnostic_addon_required'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deep_funnels_addon_check
  BEFORE INSERT OR UPDATE ON public.deep_funnels
  FOR EACH ROW EXECUTE FUNCTION public.enforce_deep_funnel_addon();

-- ============================================================
-- 5. DEEP_FUNNEL_QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deep_funnel_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.deep_funnels(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  question_text text NOT NULL,
  subtitle text,
  question_type text NOT NULL DEFAULT 'single', -- single | multi | scale | short_text
  options jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{ label, pain_weights: { marketing:2, vendas:3, ... } }]
  media_url text,
  media_type text, -- image | video | audio
  media_caption text,
  lock_until_media_ends boolean NOT NULL DEFAULT false,
  allow_skip_after_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_questions_funnel ON public.deep_funnel_questions(funnel_id, position);

ALTER TABLE public.deep_funnel_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read questions of published funnels"
  ON public.deep_funnel_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deep_funnels f
      WHERE f.id = funnel_id
        AND (f.is_published = true OR has_role(auth.uid(),'admin'::app_role) OR is_tenant_owner(f.tenant_id))
    )
  );

CREATE POLICY "Admin or owner manage questions"
  ON public.deep_funnel_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deep_funnels f WHERE f.id = funnel_id
      AND (has_role(auth.uid(),'admin'::app_role) OR is_tenant_owner(f.tenant_id)))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.deep_funnels f WHERE f.id = funnel_id
      AND (has_role(auth.uid(),'admin'::app_role) OR is_tenant_owner(f.tenant_id)))
  );

CREATE TRIGGER trg_deep_questions_updated
  BEFORE UPDATE ON public.deep_funnel_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. DEEP_FUNNEL_PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deep_funnel_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.deep_funnels(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text,
  pain_tag text NOT NULL, -- marketing | gestao | vendas | ia | estrutura
  price_hint text,
  whatsapp_template text,
  result_media_url text,
  result_media_type text,
  result_media_caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_products_funnel ON public.deep_funnel_products(funnel_id);
CREATE INDEX IF NOT EXISTS idx_deep_products_pain ON public.deep_funnel_products(funnel_id, pain_tag);

ALTER TABLE public.deep_funnel_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products of published funnels"
  ON public.deep_funnel_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deep_funnels f
      WHERE f.id = funnel_id
        AND (f.is_published = true OR has_role(auth.uid(),'admin'::app_role) OR is_tenant_owner(f.tenant_id))
    )
  );

CREATE POLICY "Admin or owner manage products"
  ON public.deep_funnel_products FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deep_funnels f WHERE f.id = funnel_id
      AND (has_role(auth.uid(),'admin'::app_role) OR is_tenant_owner(f.tenant_id)))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.deep_funnels f WHERE f.id = funnel_id
      AND (has_role(auth.uid(),'admin'::app_role) OR is_tenant_owner(f.tenant_id)))
  );

CREATE TRIGGER trg_deep_products_updated
  BEFORE UPDATE ON public.deep_funnel_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. DEEP_DIAGNOSTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deep_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.deep_funnels(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  lead_id uuid,
  parent_diagnostic_id uuid,
  session_id text,
  lead_name text,
  lead_email text,
  lead_phone text,
  instagram_handle text,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  pain_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  pain_detected text,
  recommended_product_id uuid,
  ai_veredict text,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress | completed | failed
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_diagnostics_tenant ON public.deep_diagnostics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deep_diagnostics_funnel ON public.deep_diagnostics(funnel_id);

ALTER TABLE public.deep_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert deep diagnostics"
  ON public.deep_diagnostics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update own session deep diagnostics"
  ON public.deep_diagnostics FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin or owner read deep diagnostics"
  ON public.deep_diagnostics FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(tenant_id));

CREATE POLICY "Admin or owner delete deep diagnostics"
  ON public.deep_diagnostics FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_tenant_owner(tenant_id));

CREATE TRIGGER trg_deep_diagnostics_updated
  BEFORE UPDATE ON public.deep_diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. STORAGE BUCKET deep-diagnostic-media
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('deep-diagnostic-media', 'deep-diagnostic-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read deep diagnostic media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deep-diagnostic-media');

CREATE POLICY "Owner uploads deep diagnostic media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deep-diagnostic-media'
    AND (
      has_role(auth.uid(),'admin'::app_role)
      OR is_tenant_owner(((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "Owner updates deep diagnostic media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'deep-diagnostic-media'
    AND (
      has_role(auth.uid(),'admin'::app_role)
      OR is_tenant_owner(((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "Owner deletes deep diagnostic media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deep-diagnostic-media'
    AND (
      has_role(auth.uid(),'admin'::app_role)
      OR is_tenant_owner(((storage.foldername(name))[1])::uuid)
    )
  );
