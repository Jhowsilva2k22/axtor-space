-- Motor de créditos — Fase 1 (ADITIVA, não destrutiva)
-- Adiciona: cota de créditos por plano, plano premium, packs avulsos,
-- saldo por tenant (tenant_credits), auditoria (credit_ledger) e RPCs.
-- Regras: cota do plano NÃO acumula (reseta no mês); avulso soma e expira
-- depois (controle de 12 meses fica na Fase 3). Débito consome plano primeiro.

begin;

-- 1) Cota de créditos por plano -------------------------------------------
alter table public.plan_features
  add column if not exists monthly_credits integer not null default 0;

update public.plan_features set monthly_credits = 5, price_monthly = 0   where plan_slug = 'free';
update public.plan_features set monthly_credits = 75, price_monthly = 47  where plan_slug = 'pro';
update public.plan_features set monthly_credits = 1000000                 where plan_slug in ('owner','partner','tester');

-- plano premium (espelha o pro + 200 créditos + R$127)
insert into public.plan_features
  (plan_slug, allowed_tabs, can_buy_addons, max_bio_blocks, price_monthly, show_axtor_badge, monthly_credits)
select 'premium', allowed_tabs, can_buy_addons, max_bio_blocks, 127, false, 200
  from public.plan_features where plan_slug = 'pro'
on conflict (plan_slug) do update
  set monthly_credits = excluded.monthly_credits,
      price_monthly   = excluded.price_monthly;

-- 2) Packs de crédito avulsos (no catálogo de addons existente) ------------
alter table public.addons_catalog
  add column if not exists grants_credits integer;

insert into public.addons_catalog (slug, name, description, price_brl, requires_plan, is_active, grants_credits)
values
  ('credit-50',  'Pacote 50 créditos',  '50 créditos avulsos (validade 12 meses)',  39,  null, true, 50),
  ('credit-150', 'Pacote 150 créditos', '150 créditos avulsos (validade 12 meses)', 99,  null, true, 150),
  ('credit-400', 'Pacote 400 créditos', '400 créditos avulsos (validade 12 meses)', 249, null, true, 400)
on conflict (slug) do update
  set price_brl = excluded.price_brl,
      grants_credits = excluded.grants_credits,
      is_active = true;

-- 3) Saldo por tenant ------------------------------------------------------
create table if not exists public.tenant_credits (
  tenant_id     uuid primary key references public.tenants(id) on delete cascade,
  plan_balance  integer not null default 0,   -- cota do plano (reseta no mês)
  topup_balance integer not null default 0,   -- avulso comprado (acumula)
  period_start  date not null default current_date,
  period_end    date not null default (current_date + interval '1 month')::date,
  updated_at    timestamptz not null default now()
);

-- 4) Ledger (auditoria de todo movimento) ---------------------------------
create table if not exists public.credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  delta      integer not null,   -- + concessão/compra, - débito
  reason     text not null,      -- monthly_grant|diag_instagram|funnel_conclusion|funnel_generation|pack_purchase|adjust
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_tenant_idx on public.credit_ledger (tenant_id, created_at desc);

-- 5) RLS: dono lê o próprio saldo; escrita só via service_role -------------
alter table public.tenant_credits enable row level security;
alter table public.credit_ledger  enable row level security;

create policy tenant_credits_owner_select on public.tenant_credits
  for select to authenticated
  using (
    exists (select 1 from public.tenants t
            where t.id = tenant_credits.tenant_id and t.owner_user_id = auth.uid())
    or exists (select 1 from public.user_roles
               where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::app_role)
  );

create policy credit_ledger_owner_select on public.credit_ledger
  for select to authenticated
  using (
    exists (select 1 from public.tenants t
            where t.id = credit_ledger.tenant_id and t.owner_user_id = auth.uid())
    or exists (select 1 from public.user_roles
               where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::app_role)
  );
-- (sem policy de INSERT/UPDATE/DELETE = bloqueado p/ anon/authenticated;
--  service_role das edge functions ignora RLS)

-- 6) RPCs (SECURITY DEFINER, search_path fixo) ----------------------------

-- débito atômico: consome plano primeiro, depois avulso. Retorna false se faltar.
create or replace function public.consume_credits(
  p_tenant uuid, p_amount integer, p_reason text, p_ref text default null
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_plan integer; v_top integer;
begin
  if p_amount is null or p_amount <= 0 then return true; end if;
  select plan_balance, topup_balance into v_plan, v_top
    from public.tenant_credits where tenant_id = p_tenant for update;
  if not found then return false; end if;
  if (v_plan + v_top) < p_amount then return false; end if;
  if v_plan >= p_amount then
    update public.tenant_credits
       set plan_balance = plan_balance - p_amount, updated_at = now()
     where tenant_id = p_tenant;
  else
    update public.tenant_credits
       set plan_balance = 0, topup_balance = topup_balance - (p_amount - v_plan), updated_at = now()
     where tenant_id = p_tenant;
  end if;
  insert into public.credit_ledger(tenant_id, delta, reason, ref)
    values (p_tenant, -p_amount, p_reason, p_ref);
  return true;
end; $$;

-- concessão mensal: reseta a cota do plano ativo (não acumula). Cron chama.
create or replace function public.grant_monthly_credits()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.tenant_credits (tenant_id, plan_balance, period_start, period_end, updated_at)
  select t.id, coalesce(pf.monthly_credits, 0),
         current_date, (current_date + interval '1 month')::date, now()
    from public.tenants t
    left join public.plan_features pf on pf.plan_slug = coalesce(t.plan, 'free')
  on conflict (tenant_id) do update
    set plan_balance = excluded.plan_balance,   -- reseta (não acumula)
        period_start = excluded.period_start,
        period_end   = excluded.period_end,
        updated_at   = now();

  insert into public.credit_ledger(tenant_id, delta, reason)
  select t.id, coalesce(pf.monthly_credits, 0), 'monthly_grant'
    from public.tenants t
    left join public.plan_features pf on pf.plan_slug = coalesce(t.plan, 'free');
end; $$;

-- adiciona avulso (chamado pelo webhook ao confirmar pack)
create or replace function public.add_topup_credits(
  p_tenant uuid, p_amount integer, p_ref text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.tenant_credits (tenant_id, topup_balance)
    values (p_tenant, p_amount)
  on conflict (tenant_id) do update
    set topup_balance = public.tenant_credits.topup_balance + p_amount, updated_at = now();
  insert into public.credit_ledger(tenant_id, delta, reason, ref)
    values (p_tenant, p_amount, 'pack_purchase', p_ref);
end; $$;

-- clientes NUNCA chamam essas RPCs direto (senão dariam crédito a si mesmos
-- ou drenariam o de outro tenant). Só o service_role das edge functions.
revoke all on function public.consume_credits(uuid,integer,text,text) from public;
revoke all on function public.grant_monthly_credits()                 from public;
revoke all on function public.add_topup_credits(uuid,integer,text)    from public;
grant execute on function public.consume_credits(uuid,integer,text,text) to service_role;
grant execute on function public.grant_monthly_credits()                 to service_role;
grant execute on function public.add_topup_credits(uuid,integer,text)    to service_role;

-- seed inicial: garante um registro de saldo pra todos os tenants atuais
select public.grant_monthly_credits();

commit;
