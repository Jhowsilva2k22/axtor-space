-- Fase B — Leads Unificados: RPC de upsert de contato + índice único.
-- A RPC foi aplicada em prod via conector antes do deploy das edge functions.
-- O ÍNDICE ÚNICO deve ser aplicado SÓ DEPOIS do deploy das functions que usam o
-- upsert (com o INSERT puro antigo, o índice quebraria leads recorrentes).

-- 1. RPC: upsert do contato por (tenant, lower(email)). Retorna (lead_id, was_new).
--    was_new = true só no 1º contato do email (gate da notificação ao dono).
create or replace function upsert_lead_contact(
  p_tenant uuid,
  p_email text,
  p_phone text default null,
  p_name text default null,
  p_handle text default null,
  p_source text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
) returns table(lead_id uuid, was_new boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Sem email: nao da pra deduplicar -> cria contato novo sempre.
  if p_email is null or btrim(p_email) = '' then
    insert into leads(tenant_id, email, phone, full_name, instagram_handle, source,
                      utm_source, utm_medium, utm_campaign, diagnostics_count, status, last_activity_at)
    values (p_tenant, p_email, p_phone, p_name, p_handle, coalesce(p_source,'diagnostico'),
            p_utm_source, p_utm_medium, p_utm_campaign, 1, 'novo', now())
    returning id into v_id;
    return query select v_id, true; return;
  end if;

  select id into v_id from leads
  where tenant_id = p_tenant and lower(email) = lower(p_email)
  limit 1;

  if v_id is not null then
    update leads set
      diagnostics_count = coalesce(diagnostics_count,0) + 1,
      last_activity_at = now(),
      phone = coalesce(nullif(btrim(phone),''), p_phone),
      full_name = coalesce(nullif(btrim(full_name),''), p_name),
      instagram_handle = coalesce(nullif(btrim(instagram_handle),''), p_handle),
      status = case when status in ('cliente','descartado') then status else 'quente' end
    where id = v_id;
    return query select v_id, false; return;
  end if;

  begin
    insert into leads(tenant_id, email, phone, full_name, instagram_handle, source,
                      utm_source, utm_medium, utm_campaign, diagnostics_count, status, last_activity_at)
    values (p_tenant, p_email, p_phone, p_name, p_handle, coalesce(p_source,'diagnostico'),
            p_utm_source, p_utm_medium, p_utm_campaign, 1, 'novo', now())
    returning id into v_id;
    return query select v_id, true;
  exception when unique_violation then
    select id into v_id from leads
    where tenant_id = p_tenant and lower(email) = lower(p_email) limit 1;
    update leads set
      diagnostics_count = coalesce(diagnostics_count,0) + 1,
      last_activity_at = now(),
      status = case when status in ('cliente','descartado') then status else 'quente' end
    where id = v_id;
    return query select v_id, false;
  end;
end;
$$;

-- 2. ÍNDICE ÚNICO — aplicar SÓ APÓS o deploy das edge functions com upsert.
create unique index if not exists leads_tenant_email_uniq
  on leads (tenant_id, lower(email)) where email is not null;
