-- Sistema de convites: sócios (partner) e testers (tester)

-- 1) Tabela invite_codes
CREATE TABLE public.invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('partner','tester')),
  mode text NOT NULL CHECK (mode IN ('link','email')),
  target_email text,
  note text,
  created_by uuid NOT NULL,
  used_by_user_id uuid,
  used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invite_email_required CHECK (
    (mode = 'link') OR (mode = 'email' AND target_email IS NOT NULL)
  )
);

CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_target_email ON public.invite_codes(target_email);
CREATE INDEX idx_invite_codes_created_at ON public.invite_codes(created_at DESC);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Só admin lê/cria/atualiza/deleta
CREATE POLICY "Admins manage invites"
ON public.invite_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_invite_codes_updated_at
BEFORE UPDATE ON public.invite_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Função pública pra validar código (anon pode chamar)
CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text, _email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.invite_codes%ROWTYPE;
  _normalized_code text := upper(trim(_code));
  _normalized_email text := lower(trim(coalesce(_email, '')));
BEGIN
  IF _normalized_code IS NULL OR length(_normalized_code) < 4 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_format');
  END IF;

  SELECT * INTO _inv FROM public.invite_codes WHERE code = _normalized_code LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF _inv.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF _inv.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_used');
  END IF;

  IF _inv.expires_at IS NOT NULL AND _inv.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  IF _inv.mode = 'email' THEN
    IF _normalized_email = '' THEN
      RETURN jsonb_build_object('valid', true, 'type', _inv.type, 'requires_email', true, 'target_email_hint', regexp_replace(_inv.target_email, '(.{2}).*(@.*)', '\1***\2'));
    END IF;
    IF lower(_inv.target_email) <> _normalized_email THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'email_mismatch');
    END IF;
  END IF;

  RETURN jsonb_build_object('valid', true, 'type', _inv.type, 'mode', _inv.mode);
END;
$$;

-- 3) Substituir create_tenant_for_user pra aceitar invite_code opcional
DROP FUNCTION IF EXISTS public.create_tenant_for_user(text, text);

CREATE OR REPLACE FUNCTION public.create_tenant_for_user(
  _slug text,
  _display_name text,
  _invite_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _check jsonb;
  _new_tenant_id uuid;
  _normalized_slug text := lower(trim(_slug));
  _clean_name text := trim(_display_name);
  _inv public.invite_codes%ROWTYPE;
  _plan text := 'free';
  _limits jsonb := '{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}'::jsonb;
  _normalized_code text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  IF _clean_name IS NULL OR length(_clean_name) < 2 THEN
    RAISE EXCEPTION 'invalid_display_name';
  END IF;

  _check := public.check_slug_available(_normalized_slug);
  IF (_check->>'available')::boolean = false THEN
    RAISE EXCEPTION 'slug_unavailable: %', (_check->>'reason');
  END IF;

  IF (SELECT count(*) FROM public.tenants WHERE owner_user_id = _uid) >= 3 THEN
    RAISE EXCEPTION 'tenant_limit_reached';
  END IF;

  -- Processa invite code se fornecido
  IF _invite_code IS NOT NULL AND length(trim(_invite_code)) > 0 THEN
    _normalized_code := upper(trim(_invite_code));
    SELECT * INTO _inv FROM public.invite_codes WHERE code = _normalized_code FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'invite_invalid: not_found';
    END IF;
    IF _inv.revoked_at IS NOT NULL THEN
      RAISE EXCEPTION 'invite_invalid: revoked';
    END IF;
    IF _inv.used_at IS NOT NULL THEN
      RAISE EXCEPTION 'invite_invalid: already_used';
    END IF;
    IF _inv.expires_at IS NOT NULL AND _inv.expires_at < now() THEN
      RAISE EXCEPTION 'invite_invalid: expired';
    END IF;
    IF _inv.mode = 'email' AND lower(_inv.target_email) <> lower(_email) THEN
      RAISE EXCEPTION 'invite_invalid: email_mismatch';
    END IF;

    _plan := _inv.type; -- 'partner' ou 'tester'
    _limits := '{"max_blocks": 9999, "analytics": true, "campaigns": true, "improvements": true, "themes": true, "show_badge": false}'::jsonb;
  END IF;

  INSERT INTO public.tenants (slug, display_name, owner_user_id, plan, status, plan_limits)
  VALUES (_normalized_slug, _clean_name, _uid, _plan, 'active', _limits)
  RETURNING id INTO _new_tenant_id;

  INSERT INTO public.bio_config (tenant_id, display_name, headline, sub_headline, footer_text, active_theme_slug)
  VALUES (
    _new_tenant_id,
    _clean_name,
    'Bem-vindo à minha bio',
    NULL,
    'axtor.space/' || _normalized_slug,
    'gold-noir'
  );

  -- Marca invite como usado (atomicamente)
  IF _inv.id IS NOT NULL THEN
    UPDATE public.invite_codes
    SET used_at = now(), used_by_user_id = _uid
    WHERE id = _inv.id;
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', _new_tenant_id,
    'slug', _normalized_slug,
    'plan', _plan,
    'url', 'https://axtor.space/' || _normalized_slug
  );
END;
$$;