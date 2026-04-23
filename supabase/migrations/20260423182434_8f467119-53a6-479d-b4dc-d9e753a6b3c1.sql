ALTER TABLE public.bio_config DROP CONSTRAINT IF EXISTS bio_config_singleton_key;
ALTER TABLE public.bio_config ALTER COLUMN singleton SET DEFAULT true;
UPDATE public.bio_config SET singleton = true WHERE singleton = false;
CREATE UNIQUE INDEX IF NOT EXISTS bio_config_tenant_singleton_unique
  ON public.bio_config (tenant_id) WHERE singleton = true;

CREATE OR REPLACE FUNCTION public.create_tenant_for_user(_slug text, _display_name text, _invite_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    _plan := _inv.type;
    _limits := '{"max_blocks": 9999, "analytics": true, "campaigns": true, "improvements": true, "themes": true, "show_badge": false}'::jsonb;
  END IF;

  INSERT INTO public.tenants (slug, display_name, owner_user_id, plan, status, plan_limits)
  VALUES (_normalized_slug, _clean_name, _uid, _plan, 'active', _limits)
  RETURNING id INTO _new_tenant_id;

  INSERT INTO public.bio_config (tenant_id, display_name, headline, sub_headline, footer_text, active_theme_slug, singleton)
  VALUES (
    _new_tenant_id,
    _clean_name,
    'Bem-vindo à minha bio',
    NULL,
    'axtor.space/' || _normalized_slug,
    'gold-noir',
    true
  );

  IF _inv.id IS NOT NULL THEN
    UPDATE public.invite_codes
    SET used_at = now(), used_by_user_id = _uid
    WHERE id = _inv.id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'tenant_owner')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'tenant_id', _new_tenant_id,
    'slug', _normalized_slug,
    'plan', _plan,
    'url', 'https://axtor.space/' || _normalized_slug
  );
END;
$function$;