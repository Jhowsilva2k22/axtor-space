-- 1) Adicionar coluna plan_limits em tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS plan_limits jsonb NOT NULL DEFAULT '{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}'::jsonb;

-- Backfill: tenants existentes no plano "pro"/"premium" ou já criados manualmente ficam sem limites
UPDATE public.tenants
SET plan_limits = '{"max_blocks": 9999, "analytics": true, "campaigns": true, "improvements": true, "themes": true, "show_badge": false}'::jsonb
WHERE plan <> 'free';

-- 2) Função para checar disponibilidade de slug (pública, security definer)
CREATE OR REPLACE FUNCTION public.check_slug_available(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reserved text[] := ARRAY[
    'admin','bio','auth','api','signup','login','logout','register',
    'r','d','www','app','dashboard','help','support','docs','blog',
    'about','contact','terms','privacy','pricing','home','index',
    'static','public','assets','uploads','cdn','mail','email',
    'settings','account','profile','user','users','tenant','tenants',
    'axtor','lovable','supabase'
  ];
  _normalized text := lower(trim(_slug));
BEGIN
  IF _normalized IS NULL OR length(_normalized) < 3 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'too_short');
  END IF;
  IF length(_normalized) > 40 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'too_long');
  END IF;
  IF _normalized !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' THEN
    RETURN jsonb_build_object('available', false, 'reason', 'invalid_format');
  END IF;
  IF _normalized = ANY(_reserved) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'reserved');
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = _normalized) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'taken');
  END IF;
  RETURN jsonb_build_object('available', true, 'slug', _normalized);
END;
$$;

-- 3) Função para criar tenant + bio_config inicial para o usuário logado
CREATE OR REPLACE FUNCTION public.create_tenant_for_user(_slug text, _display_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _check jsonb;
  _new_tenant_id uuid;
  _normalized_slug text := lower(trim(_slug));
  _clean_name text := trim(_display_name);
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _clean_name IS NULL OR length(_clean_name) < 2 THEN
    RAISE EXCEPTION 'invalid_display_name';
  END IF;

  _check := public.check_slug_available(_normalized_slug);
  IF (_check->>'available')::boolean = false THEN
    RAISE EXCEPTION 'slug_unavailable: %', (_check->>'reason');
  END IF;

  -- Limite anti-abuso: máximo 3 tenants por usuário
  IF (SELECT count(*) FROM public.tenants WHERE owner_user_id = _uid) >= 3 THEN
    RAISE EXCEPTION 'tenant_limit_reached';
  END IF;

  INSERT INTO public.tenants (slug, display_name, owner_user_id, plan, status, plan_limits)
  VALUES (
    _normalized_slug,
    _clean_name,
    _uid,
    'free',
    'active',
    '{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}'::jsonb
  )
  RETURNING id INTO _new_tenant_id;

  -- Criar bio_config inicial
  INSERT INTO public.bio_config (tenant_id, display_name, headline, sub_headline, footer_text, active_theme_slug)
  VALUES (
    _new_tenant_id,
    _clean_name,
    'Bem-vindo à minha bio',
    NULL,
    'axtor.space/' || _normalized_slug,
    'gold-noir'
  );

  RETURN jsonb_build_object(
    'tenant_id', _new_tenant_id,
    'slug', _normalized_slug,
    'url', 'https://axtor.space/' || _normalized_slug
  );
END;
$$;

-- 4) Trigger para reforçar limite de blocos ativos no plano Free
CREATE OR REPLACE FUNCTION public.enforce_free_plan_block_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_blocks int;
  _current_active int;
  _plan text;
  _limits jsonb;
BEGIN
  -- Só valida quando o bloco está ativo
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  -- Para UPDATE, ignora se já estava ativo (não é uma "nova ativação")
  IF TG_OP = 'UPDATE' AND OLD.is_active = true THEN
    RETURN NEW;
  END IF;

  SELECT plan, plan_limits INTO _plan, _limits
  FROM public.tenants
  WHERE id = NEW.tenant_id;

  -- Sem tenant ou plano não-free: libera
  IF _plan IS NULL OR _plan <> 'free' THEN
    RETURN NEW;
  END IF;

  _max_blocks := COALESCE((_limits->>'max_blocks')::int, 3);

  SELECT count(*) INTO _current_active
  FROM public.bio_blocks
  WHERE tenant_id = NEW.tenant_id
    AND is_active = true
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF _current_active >= _max_blocks THEN
    RAISE EXCEPTION 'free_plan_block_limit_reached: max % active blocks', _max_blocks
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_free_plan_block_limit ON public.bio_blocks;
CREATE TRIGGER trg_enforce_free_plan_block_limit
BEFORE INSERT OR UPDATE OF is_active ON public.bio_blocks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_free_plan_block_limit();

-- 5) Permitir que a função check_slug_available seja chamada anonimamente (necessário no signup)
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_for_user(text, text) TO authenticated;