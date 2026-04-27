-- =============================================================================
-- Fase 1 — RBAC oficial (Onda 3 v2.0)
-- =============================================================================
-- Cria a tabela plan_features e as funções SECURITY DEFINER que controlam
-- acesso a abas e retornam o tier do usuário logado.
--
-- Roda primeiro no Supabase STAGING. Depois de validado, mesma cópia em PROD.
-- Idempotente: pode rodar múltiplas vezes sem quebrar.
-- =============================================================================


-- 1. TABELA plan_features ------------------------------------------------------
-- Source of truth do que cada plano tem direito.
CREATE TABLE IF NOT EXISTS public.plan_features (
  plan_slug         text PRIMARY KEY,
  max_bio_blocks    int NOT NULL DEFAULT 9999,
  show_axtor_badge  boolean NOT NULL DEFAULT false,
  can_buy_addons    boolean NOT NULL DEFAULT true,
  allowed_tabs      text[] NOT NULL DEFAULT ARRAY['captura','bio','imersivo','imagens','metricas']::text[],
  price_monthly     numeric(10,2),
  price_semestral   numeric(10,2),  -- estrutura agora, NULL no lançamento
  price_annual      numeric(10,2),  -- estrutura agora, NULL no lançamento
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plan_features IS
  'Define recursos por plano. Linha por plano (free/pro/partner/tester/owner). Read-only pra usuários comuns.';
COMMENT ON COLUMN public.plan_features.allowed_tabs IS
  'Quais abas do Painel esse plano vê. Free: captura+bio+metricas (resumo). Pro+: tudo.';
COMMENT ON COLUMN public.plan_features.price_semestral IS
  'ESTRUTURA AGORA, UI DEPOIS — coluna existe, valor NULL no lançamento (toggle desabilitado).';


-- 2. RLS de plan_features ------------------------------------------------------
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_features_read_authenticated ON public.plan_features;
CREATE POLICY plan_features_read_authenticated
  ON public.plan_features FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS plan_features_write_admin_only ON public.plan_features;
CREATE POLICY plan_features_write_admin_only
  ON public.plan_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- 3. SEED — 5 planos -----------------------------------------------------------
-- Aba 5 'metricas' fica disponível pra todos (Free com resumo, Pro+ com mais).
-- Aba 3 'imersivo' e Aba 4 'imagens' são exclusivas Pro+.
-- 'owner' é o plano do dono da plataforma (Joanderson) — tem tudo.

-- 'integracoes' é a sub-aba pendurada na Captura (ESTRUTURA AGORA pra agentes).
-- Tratamos como aba normal aqui pra evitar lógica espalhada no front.
INSERT INTO public.plan_features
  (plan_slug, max_bio_blocks, show_axtor_badge, can_buy_addons, allowed_tabs, price_monthly)
VALUES
  ('free',    3,    true,  false, ARRAY['captura','bio','metricas']::text[],                                                  0),
  ('pro',     9999, false, true,  ARRAY['captura','bio','imersivo','imagens','metricas','integracoes']::text[],               47.00),
  ('partner', 9999, false, true,  ARRAY['captura','bio','imersivo','imagens','metricas','integracoes']::text[],               NULL),
  ('tester',  9999, false, true,  ARRAY['captura','bio','imersivo','imagens','metricas','integracoes']::text[],               NULL),
  ('owner',   9999, false, true,  ARRAY['captura','bio','imersivo','imagens','metricas','integracoes']::text[],               NULL)
ON CONFLICT (plan_slug) DO UPDATE SET
  max_bio_blocks    = EXCLUDED.max_bio_blocks,
  show_axtor_badge  = EXCLUDED.show_axtor_badge,
  can_buy_addons    = EXCLUDED.can_buy_addons,
  allowed_tabs      = EXCLUDED.allowed_tabs,
  price_monthly     = EXCLUDED.price_monthly,
  updated_at        = now();


-- 4. RPC can_user_access_tab(_tenant_id, _tab) ---------------------------------
-- Retorna true se o user logado pode ver _tab no contexto de _tenant_id.
-- Regras:
--   - Admin (Joanderson) vê tudo, sempre.
--   - Owner do tenant vê o que o plano dele permite.
--   - Quem não é owner nem admin: false.
CREATE OR REPLACE FUNCTION public.can_user_access_tab(_tenant_id uuid, _tab text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin     boolean;
  v_tenant_plan  text;
  v_allowed_tabs text[];
BEGIN
  -- 1. Admin sempre passa
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- 2. Pegar plano do tenant — só se user é owner
  SELECT plan INTO v_tenant_plan
  FROM public.tenants
  WHERE id = _tenant_id
    AND owner_user_id = auth.uid();

  IF v_tenant_plan IS NULL THEN
    RETURN false;
  END IF;

  -- 3. Conferir allowed_tabs do plano
  SELECT allowed_tabs INTO v_allowed_tabs
  FROM public.plan_features
  WHERE plan_slug = v_tenant_plan;

  RETURN COALESCE(_tab = ANY(v_allowed_tabs), false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_user_access_tab(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.can_user_access_tab(uuid, text) IS
  'Onda 3 v2 RBAC — checa se o user logado pode ver _tab no contexto de _tenant_id. SECURITY DEFINER.';


-- 5. RPC get_user_tier_summary() -----------------------------------------------
-- Retorna JSON com is_admin + lista de tenants do user (id, slug, display_name, plan, status).
-- Admin vê todos os tenants. Owner vê só os seus.
CREATE OR REPLACE FUNCTION public.get_user_tier_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_tenants  json;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    SELECT json_agg(
      json_build_object(
        'id',           t.id,
        'slug',         t.slug,
        'display_name', t.display_name,
        'plan',         t.plan,
        'status',       t.status
      ) ORDER BY t.display_name
    ) INTO v_tenants
    FROM public.tenants t;
  ELSE
    SELECT json_agg(
      json_build_object(
        'id',           t.id,
        'slug',         t.slug,
        'display_name', t.display_name,
        'plan',         t.plan,
        'status',       t.status
      ) ORDER BY t.display_name
    ) INTO v_tenants
    FROM public.tenants t
    WHERE t.owner_user_id = auth.uid();
  END IF;

  RETURN json_build_object(
    'is_admin', v_is_admin,
    'user_id',  auth.uid(),
    'tenants',  COALESCE(v_tenants, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tier_summary() TO authenticated;

COMMENT ON FUNCTION public.get_user_tier_summary() IS
  'Onda 3 v2 RBAC — retorna is_admin + lista de tenants do user logado. SECURITY DEFINER.';


-- =============================================================================
-- TESTES (rodar separadamente após o script acima)
-- =============================================================================
-- Como admin (Joanderson logado), verifica:
--   SELECT public.get_user_tier_summary();
--   -> retorna is_admin=true e todos os tenants
--
--   SELECT public.can_user_access_tab('<seu-tenant-id>'::uuid, 'imersivo');
--   -> true (admin sempre passa)
--
-- Como user free (criar conta nova de teste depois), verifica:
--   SELECT public.can_user_access_tab('<tenant-free-id>'::uuid, 'imersivo');
--   -> false
--
--   SELECT public.can_user_access_tab('<tenant-free-id>'::uuid, 'bio');
--   -> true
-- =============================================================================
