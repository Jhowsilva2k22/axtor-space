-- Onda 4 Fase 6 — tenant_addons: compras avulsas (não recorrentes)
--
-- Tabela separada de tenant_subscriptions porque:
--  - Subscriptions são recorrentes (mensal), com período de validade
--  - Addons são compras únicas (one-shot), que liberam recurso pra sempre ou até expires_at
--  - Misturar os dois conceitos numa tabela só polui schema e cria nullables esquisitos
--
-- Webhook do Asaas atualiza status='paid' quando PAYMENT_RECEIVED chega.

create table if not exists public.tenant_addons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  addon_slug text not null references public.addons_catalog(slug) on update cascade,
  gateway text not null default 'asaas',
  gateway_payment_id text,
  value_brl numeric(10, 2) not null,
  status text not null default 'pending', -- pending | paid | refunded | canceled
  purchased_at timestamptz not null default now(),
  expires_at timestamptz, -- null = sem expiração (acesso vitalício)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_addons_status_check check (status in ('pending', 'paid', 'refunded', 'canceled'))
);

-- Índice no payment_id pro webhook achar rapidamente
create unique index if not exists idx_tenant_addons_payment
  on public.tenant_addons(gateway_payment_id)
  where gateway_payment_id is not null;

create index if not exists idx_tenant_addons_tenant on public.tenant_addons(tenant_id);
create index if not exists idx_tenant_addons_status on public.tenant_addons(status);
create index if not exists idx_tenant_addons_slug on public.tenant_addons(addon_slug);

-- RLS — owner do tenant ou admin podem ler. Apenas service_role escreve.
alter table public.tenant_addons enable row level security;

drop policy if exists "tenant_addons_select_own" on public.tenant_addons;
create policy "tenant_addons_select_own"
on public.tenant_addons
for select
to authenticated
using (
  exists (
    select 1 from public.tenants t
    where t.id = tenant_addons.tenant_id
      and (
        t.owner_user_id = auth.uid()
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role = 'admin'
        )
      )
  )
);

-- Sem policies de INSERT/UPDATE/DELETE = só service_role consegue gravar (Edge Functions).

-- Trigger pra manter updated_at em sincronia
create or replace function public.tenant_addons_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenant_addons_updated_at on public.tenant_addons;
create trigger trg_tenant_addons_updated_at
before update on public.tenant_addons
for each row
execute function public.tenant_addons_set_updated_at();

-- Helper RPC: o tenant tem esse addon ativo?
create or replace function public.tenant_has_active_addon(p_tenant_id uuid, p_addon_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_addons
    where tenant_id = p_tenant_id
      and addon_slug = p_addon_slug
      and status = 'paid'
      and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function public.tenant_has_active_addon(uuid, text) from public;
grant execute on function public.tenant_has_active_addon(uuid, text) to authenticated, service_role;

comment on table public.tenant_addons is 'Onda 4 Fase 6 — Compras avulsas de addons (one-shot, não recorrente). Webhook Asaas atualiza status.';
comment on column public.tenant_addons.expires_at is 'NULL = acesso vitalício. Caso queira limitar, preencher (ex: 30 dias após purchased_at).';
