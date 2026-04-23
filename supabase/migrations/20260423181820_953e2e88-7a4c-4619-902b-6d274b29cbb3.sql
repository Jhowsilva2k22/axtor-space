DO $$
DECLARE
  v_user_id uuid := 'e4bc0a7c-49fa-41d9-bbc3-082ac36be275';
  v_slug text := 'stefany';
  v_display text := 'Stefany Mello';
  v_tenant_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.tenants WHERE owner_user_id = v_user_id) THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  INSERT INTO public.tenants (slug, display_name, owner_user_id, plan, status)
  VALUES (v_slug, v_display, v_user_id, 'partner', 'active')
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.bio_config (tenant_id, display_name, headline, singleton)
  VALUES (v_tenant_id, v_display, 'Bem-vinda à sua bio', false);

  UPDATE public.invite_codes
  SET used_at = now(), used_by_user_id = v_user_id
  WHERE code = 'P-DQ4FBTQ5' AND used_at IS NULL AND revoked_at IS NULL;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'tenant_owner')
  ON CONFLICT DO NOTHING;
END $$;