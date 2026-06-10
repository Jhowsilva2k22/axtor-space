-- Fase 3 — provisionar créditos ao pagar + agendar concessão mensal.
-- ADITIVA: cria RPC nova e agenda cron. Não altera dados existentes.

begin;

-- Concede a cota do plano ATUAL do tenant (chamado pelo webhook ao ativar
-- a assinatura). Reseta plan_balance pro valor do plano e renova o período.
create or replace function public.grant_plan_credits(p_tenant uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_credits integer;
begin
  select coalesce(pf.monthly_credits, 0) into v_credits
    from public.tenants t
    left join public.plan_features pf on pf.plan_slug = coalesce(t.plan, 'free')
   where t.id = p_tenant;

  insert into public.tenant_credits (tenant_id, plan_balance, period_start, period_end, updated_at)
    values (p_tenant, coalesce(v_credits, 0), current_date, (current_date + interval '1 month')::date, now())
  on conflict (tenant_id) do update
    set plan_balance = excluded.plan_balance,
        period_start = excluded.period_start,
        period_end   = excluded.period_end,
        updated_at   = now();

  insert into public.credit_ledger(tenant_id, delta, reason)
    values (p_tenant, coalesce(v_credits, 0), 'plan_grant');
end; $$;

revoke all on function public.grant_plan_credits(uuid) from public;
grant execute on function public.grant_plan_credits(uuid) to service_role;

-- Agenda a concessão mensal (dia 1, 03:00) — só se pg_cron existir.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'grant-monthly-credits') then
      perform cron.unschedule('grant-monthly-credits');
    end if;
    perform cron.schedule('grant-monthly-credits', '0 3 1 * *', 'select public.grant_monthly_credits()');
  end if;
end $$;

commit;
