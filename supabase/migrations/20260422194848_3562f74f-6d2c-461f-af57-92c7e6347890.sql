
-- =========================================================
-- FASE 1: Fundação multi-tenant
-- =========================================================

-- 1) Enum app_role: adicionar 'tenant_owner'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'tenant_owner'
      AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'tenant_owner';
  END IF;
END$$;

-- 2) Tabela tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  owner_user_id uuid,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed do tenant "joanderson" usando o admin atual
INSERT INTO public.tenants (slug, display_name, owner_user_id, plan, status)
SELECT 'joanderson',
       COALESCE((SELECT display_name FROM public.bio_config LIMIT 1), 'Joanderson Silva'),
       (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1),
       'pro',
       'active'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'joanderson');

-- 4) Função is_tenant_owner (SECURITY DEFINER, sem recursão)
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = _tenant_id
      AND owner_user_id = auth.uid()
      AND status = 'active'
  )
$$;

-- 5) Função resolve_tenant_by_slug (público / leitura)
CREATE OR REPLACE FUNCTION public.resolve_tenant_by_slug(_slug text)
RETURNS TABLE(id uuid, slug text, display_name text, plan text, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, slug, display_name, plan, status
  FROM public.tenants
  WHERE slug = _slug AND status = 'active'
  LIMIT 1
$$;

-- 6) Adicionar tenant_id em todas as tabelas (nullable primeiro)
ALTER TABLE public.bio_config                  ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.bio_blocks                  ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.bio_categories              ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.bio_block_campaigns         ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.leads                       ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.diagnostics                 ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.bio_clicks                  ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.funnel_events               ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.page_views                  ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.user_feedback               ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.improvement_runs            ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.improvement_recommendations ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.bio_icon_generations        ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 7) Backfill: tudo aponta para joanderson
DO $$
DECLARE
  _tid uuid;
BEGIN
  SELECT id INTO _tid FROM public.tenants WHERE slug = 'joanderson';

  UPDATE public.bio_config                  SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.bio_blocks                  SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.bio_categories              SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.bio_block_campaigns         SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.leads                       SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.diagnostics                 SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.bio_clicks                  SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.funnel_events               SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.page_views                  SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.user_feedback               SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.improvement_runs            SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.improvement_recommendations SET tenant_id = _tid WHERE tenant_id IS NULL;
  UPDATE public.bio_icon_generations        SET tenant_id = _tid WHERE tenant_id IS NULL;
END$$;

-- 8) NOT NULL + FK + default (default = joanderson, garante zero quebra de inserts existentes)
DO $$
DECLARE
  _tid uuid;
BEGIN
  SELECT id INTO _tid FROM public.tenants WHERE slug = 'joanderson';

  EXECUTE format('ALTER TABLE public.bio_config                  ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.bio_blocks                  ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.bio_categories              ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.bio_block_campaigns         ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.leads                       ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.diagnostics                 ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.bio_clicks                  ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.funnel_events               ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.page_views                  ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.user_feedback               ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.improvement_runs            ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.improvement_recommendations ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
  EXECUTE format('ALTER TABLE public.bio_icon_generations        ALTER COLUMN tenant_id SET DEFAULT %L', _tid);
END$$;

ALTER TABLE public.bio_config                  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bio_blocks                  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bio_categories              ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bio_block_campaigns         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.leads                       ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.diagnostics                 ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bio_clicks                  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.funnel_events               ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.page_views                  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_feedback               ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.improvement_runs            ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.improvement_recommendations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bio_icon_generations        ALTER COLUMN tenant_id SET NOT NULL;

-- FKs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_config_tenant_fk')                  THEN ALTER TABLE public.bio_config                  ADD CONSTRAINT bio_config_tenant_fk                  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_blocks_tenant_fk')                  THEN ALTER TABLE public.bio_blocks                  ADD CONSTRAINT bio_blocks_tenant_fk                  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_categories_tenant_fk')              THEN ALTER TABLE public.bio_categories              ADD CONSTRAINT bio_categories_tenant_fk              FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_block_campaigns_tenant_fk')         THEN ALTER TABLE public.bio_block_campaigns         ADD CONSTRAINT bio_block_campaigns_tenant_fk         FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_tenant_fk')                       THEN ALTER TABLE public.leads                       ADD CONSTRAINT leads_tenant_fk                       FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diagnostics_tenant_fk')                 THEN ALTER TABLE public.diagnostics                 ADD CONSTRAINT diagnostics_tenant_fk                 FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_clicks_tenant_fk')                  THEN ALTER TABLE public.bio_clicks                  ADD CONSTRAINT bio_clicks_tenant_fk                  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_events_tenant_fk')               THEN ALTER TABLE public.funnel_events               ADD CONSTRAINT funnel_events_tenant_fk               FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_views_tenant_fk')                  THEN ALTER TABLE public.page_views                  ADD CONSTRAINT page_views_tenant_fk                  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_feedback_tenant_fk')               THEN ALTER TABLE public.user_feedback               ADD CONSTRAINT user_feedback_tenant_fk               FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'improvement_runs_tenant_fk')            THEN ALTER TABLE public.improvement_runs            ADD CONSTRAINT improvement_runs_tenant_fk            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'improvement_recommendations_tenant_fk') THEN ALTER TABLE public.improvement_recommendations ADD CONSTRAINT improvement_recommendations_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_icon_generations_tenant_fk')        THEN ALTER TABLE public.bio_icon_generations        ADD CONSTRAINT bio_icon_generations_tenant_fk        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE; END IF;
END$$;

-- Índices em tenant_id
CREATE INDEX IF NOT EXISTS idx_bio_config_tenant                  ON public.bio_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bio_blocks_tenant                  ON public.bio_blocks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bio_categories_tenant              ON public.bio_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bio_block_campaigns_tenant         ON public.bio_block_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant                       ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_tenant                 ON public.diagnostics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bio_clicks_tenant                  ON public.bio_clicks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_tenant               ON public.funnel_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_page_views_tenant                  ON public.page_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_tenant               ON public.user_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_improvement_runs_tenant            ON public.improvement_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_improvement_recommendations_tenant ON public.improvement_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bio_icon_generations_tenant        ON public.bio_icon_generations(tenant_id);

-- 9) RLS da tabela tenants
DROP POLICY IF EXISTS "Admins manage tenants" ON public.tenants;
CREATE POLICY "Admins manage tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Tenant owners read own tenant" ON public.tenants;
CREATE POLICY "Tenant owners read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Tenant owners update own tenant" ON public.tenants;
CREATE POLICY "Tenant owners update own tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 10) Reescrever RLS das tabelas tenant-scoped
-- Padrão: admin OU dono do tenant

-- bio_config
DROP POLICY IF EXISTS "Admins can insert bio config" ON public.bio_config;
DROP POLICY IF EXISTS "Admins can update bio config" ON public.bio_config;
DROP POLICY IF EXISTS "Public can read bio config"   ON public.bio_config;
CREATE POLICY "Public can read bio config" ON public.bio_config
  FOR SELECT USING (true);
CREATE POLICY "Admin or owner insert bio config" ON public.bio_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner update bio config" ON public.bio_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner delete bio config" ON public.bio_config
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- bio_blocks
DROP POLICY IF EXISTS "Admins manage blocks"         ON public.bio_blocks;
DROP POLICY IF EXISTS "Public can read active blocks" ON public.bio_blocks;
CREATE POLICY "Public can read active blocks" ON public.bio_blocks
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner manage blocks" ON public.bio_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- bio_categories
DROP POLICY IF EXISTS "Admins manage categories"          ON public.bio_categories;
DROP POLICY IF EXISTS "Public can read active categories" ON public.bio_categories;
CREATE POLICY "Public can read active categories" ON public.bio_categories
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner manage categories" ON public.bio_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- bio_block_campaigns
DROP POLICY IF EXISTS "Admins manage campaigns"          ON public.bio_block_campaigns;
DROP POLICY IF EXISTS "Public can read active campaigns" ON public.bio_block_campaigns;
CREATE POLICY "Public can read active campaigns" ON public.bio_block_campaigns
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner manage campaigns" ON public.bio_block_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- leads
DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
DROP POLICY IF EXISTS "Admins manage leads"   ON public.leads;
CREATE POLICY "Admin or owner manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- diagnostics
DROP POLICY IF EXISTS "Admins can read diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Admins manage diagnostics"   ON public.diagnostics;
CREATE POLICY "Admin or owner manage diagnostics" ON public.diagnostics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- bio_clicks (anon insert continua livre, admin/owner leem)
DROP POLICY IF EXISTS "Admins read bio clicks"      ON public.bio_clicks;
DROP POLICY IF EXISTS "Anyone can insert bio clicks" ON public.bio_clicks;
CREATE POLICY "Anyone can insert bio clicks" ON public.bio_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin or owner read bio clicks" ON public.bio_clicks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- funnel_events
DROP POLICY IF EXISTS "Admins read funnel events"      ON public.funnel_events;
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;
CREATE POLICY "Anyone can insert funnel events" ON public.funnel_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin or owner read funnel events" ON public.funnel_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- page_views
DROP POLICY IF EXISTS "Admins read page views"      ON public.page_views;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin or owner read page views" ON public.page_views
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- user_feedback
DROP POLICY IF EXISTS "Admins delete feedback"     ON public.user_feedback;
DROP POLICY IF EXISTS "Admins manage feedback"     ON public.user_feedback;
DROP POLICY IF EXISTS "Admins read feedback"       ON public.user_feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;
CREATE POLICY "Anyone can submit feedback" ON public.user_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(message) >= 3 AND char_length(message) <= 2000 AND char_length(category) <= 50);
CREATE POLICY "Admin or owner read feedback" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner update feedback" ON public.user_feedback
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
CREATE POLICY "Admin or owner delete feedback" ON public.user_feedback
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- improvement_runs
DROP POLICY IF EXISTS "Admins manage runs" ON public.improvement_runs;
CREATE POLICY "Admin or owner manage runs" ON public.improvement_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- improvement_recommendations
DROP POLICY IF EXISTS "Admins manage recommendations" ON public.improvement_recommendations;
CREATE POLICY "Admin or owner manage recommendations" ON public.improvement_recommendations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));

-- bio_icon_generations
DROP POLICY IF EXISTS "Admins delete icon generations" ON public.bio_icon_generations;
DROP POLICY IF EXISTS "Admins insert icon generations" ON public.bio_icon_generations;
DROP POLICY IF EXISTS "Admins read icon generations"   ON public.bio_icon_generations;
CREATE POLICY "Admin or owner manage icon generations" ON public.bio_icon_generations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_owner(tenant_id));
