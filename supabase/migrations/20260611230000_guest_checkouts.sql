-- Guest checkout (Caminho Y): pagar primeiro, criar conta depois.
-- ADITIVA — cria só esta tabela, não altera nada existente.
-- Escrita/leitura só via service_role (edge functions). RLS travada.

begin;

create table if not exists public.guest_checkouts (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,                 -- email do convidado (vira login)
  display_name     text not null,                 -- nome
  cpf              text,                          -- só dígitos (Asaas)
  slug             text not null,                 -- @ escolhido no checkout
  plan_slug        text not null check (plan_slug in ('pro','premium')),
  asaas_payment_id text unique,                   -- id da cobrança Pix
  status           text not null default 'pending'
                     check (status in ('pending','paid','provisioned','failed')),
  tenant_id        uuid references public.tenants(id) on delete set null, -- preenchido ao provisionar
  user_id          uuid,                          -- auth user criado no provisionamento
  error            text,                          -- motivo, se o provisionamento falhar
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists guest_checkouts_payment_idx on public.guest_checkouts (asaas_payment_id);
create index if not exists guest_checkouts_status_idx  on public.guest_checkouts (status, created_at desc);

-- RLS travada: nenhuma policy = anon/authenticated bloqueados.
-- Só o service_role das edge functions lê/escreve (ignora RLS).
alter table public.guest_checkouts enable row level security;

commit;
