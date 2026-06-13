-- Fase A — Leads Unificados: dedup de contatos + vínculo dos diagnósticos + campos.
-- DESTRUTIVO: funde leads duplicados por (tenant, lower(email)). Transacional.
-- Backups _bak_*_20260613 ficam no banco pra rollback manual se preciso.
-- APLICADA EM PROD 2026-06-13 via conector (resultado: 95 -> 43 contatos, 0 diag perdido).

begin;

-- 0. BACKUP (insurance — rollback manual: restaurar destes)
create table if not exists _bak_leads_20260613 as select * from leads;
create table if not exists _bak_diagnostics_20260613 as select * from diagnostics;
create table if not exists _bak_deep_diagnostics_20260613 as select * from deep_diagnostics;

-- 1. COLUNAS NOVAS (aditivo)
alter table leads
  add column if not exists status text not null default 'novo',
  add column if not exists last_activity_at timestamptz,
  add column if not exists diagnostics_count int not null default 0;
alter table leads drop constraint if exists leads_status_chk;
alter table leads add constraint leads_status_chk
  check (status in ('novo','quente','cliente','descartado'));

-- 2. DEDUP de leads por (tenant, lower(email)); mestre = mais antigo
create temp table _merge on commit drop as
select l.id as dup_id, m.master_id
from leads l
join lateral (
  select id as master_id from leads l2
  where l2.tenant_id = l.tenant_id and lower(l2.email) = lower(l.email)
  order by created_at asc, id asc limit 1
) m on true
where l.email is not null and l.id <> m.master_id;

-- religa os diagnostics (instagram) dos duplicados pro mestre (antes de apagar)
update diagnostics d set lead_id = mm.master_id
from _merge mm where d.lead_id = mm.dup_id;

-- apaga os leads duplicados
delete from leads where id in (select dup_id from _merge);

-- 3. BACKFILL imersivo (só os com email): liga ao contato existente
update deep_diagnostics dd set lead_id = l.id
from leads l
where dd.lead_id is null
  and dd.lead_email is not null and dd.lead_email <> ''
  and l.tenant_id = dd.tenant_id and lower(l.email) = lower(dd.lead_email);

-- 3b. imersivos órfãos (com email, sem contato): cria contato e liga
insert into leads (tenant_id, email, full_name, phone, instagram_handle, source,
                   utm_source, utm_medium, utm_campaign, created_at)
select distinct on (dd.tenant_id, lower(dd.lead_email))
  dd.tenant_id, dd.lead_email, dd.lead_name, dd.lead_phone, dd.instagram_handle,
  'imersivo', dd.utm_source, dd.utm_medium, dd.utm_campaign, dd.created_at
from deep_diagnostics dd
where dd.lead_id is null and dd.lead_email is not null and dd.lead_email <> ''
order by dd.tenant_id, lower(dd.lead_email), dd.created_at asc;

update deep_diagnostics dd set lead_id = l.id
from leads l
where dd.lead_id is null
  and dd.lead_email is not null and dd.lead_email <> ''
  and l.tenant_id = dd.tenant_id and lower(l.email) = lower(dd.lead_email);

-- 4. ÍNDICE ÚNICO — DEFERIDO PRA FASE B.
-- O índice (tenant, lower(email)) só pode entrar JUNTO com o upsert nas edge
-- functions; com o INSERT puro atual, ele quebraria leads recorrentes. Volta na Fase B.
-- create unique index if not exists leads_tenant_email_uniq
--   on leads (tenant_id, lower(email)) where email is not null;

-- 5. RECOMPUTAR contagem / última atividade / status "quente" (2+ diagnósticos)
with counts as (
  select lead_id, count(*) c, max(created_at) last_at
  from (
    select lead_id, created_at from diagnostics where lead_id is not null
    union all
    select lead_id, created_at from deep_diagnostics where lead_id is not null
  ) u group by lead_id
)
update leads l set
  diagnostics_count = c.c,
  last_activity_at = greatest(coalesce(l.last_activity_at, l.created_at), c.last_at),
  status = case when c.c >= 2 and l.status = 'novo' then 'quente' else l.status end
from counts c where c.lead_id = l.id;

commit;
