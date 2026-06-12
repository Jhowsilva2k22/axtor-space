-- Variante admin do create_tenant_for_user: recebe o user_id direto (em vez de
-- auth.uid()) e já aplica o plano pago. Usada pelo webhook ao provisionar uma
-- conta de guest checkout. SECURITY DEFINER, só service_role.
-- Aditiva — não altera a função original.

create or replace function public.create_tenant_for_user_admin(
  _user_id uuid, _slug text, _display_name text, _plan text default 'free'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  _new_tenant_id uuid;
  _normalized_slug text := lower(trim(_slug));
  _clean_name text := trim(_display_name);
  _check jsonb;
  _limits jsonb;
begin
  if _user_id is null then raise exception 'no_user'; end if;
  if _clean_name is null or length(_clean_name) < 2 then raise exception 'invalid_display_name'; end if;

  _check := public.check_slug_available(_normalized_slug);
  if (_check->>'available')::boolean = false then
    raise exception 'slug_unavailable: %', (_check->>'reason');
  end if;

  -- planos pagos/internos = limites desbloqueados; free = restrito
  if _plan in ('pro','premium','partner','tester','owner') then
    _limits := '{"max_blocks": 9999, "analytics": true, "campaigns": true, "improvements": true, "themes": true, "show_badge": false}'::jsonb;
  else
    _limits := '{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}'::jsonb;
  end if;

  insert into public.tenants (slug, display_name, owner_user_id, plan, status, plan_limits)
  values (_normalized_slug, _clean_name, _user_id, _plan, 'active', _limits)
  returning id into _new_tenant_id;

  insert into public.bio_config (tenant_id, display_name, headline, sub_headline, footer_text, active_theme_slug, singleton)
  values (_new_tenant_id, _clean_name, 'Bem-vindo à minha bio', null, 'axtor.space/' || _normalized_slug, 'azul-copa', true);

  insert into public.bio_categories (tenant_id, name, slug, icon, position, is_active)
  values (_new_tenant_id, 'Meus links', 'meus-links', 'Link2', 0, true);

  insert into public.user_roles (user_id, role)
  values (_user_id, 'tenant_owner') on conflict do nothing;

  return jsonb_build_object('tenant_id', _new_tenant_id, 'slug', _normalized_slug, 'plan', _plan);
end; $$;

revoke all on function public.create_tenant_for_user_admin(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.create_tenant_for_user_admin(uuid,text,text,text) to service_role;
