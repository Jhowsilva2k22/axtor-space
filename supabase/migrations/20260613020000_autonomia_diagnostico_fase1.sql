-- Fase 1 autonomia do diagnostico: config do diagnostico + destino generalizado.
-- Aditivo (so adiciona colunas, com defaults). Linhas existentes seguem validas.
-- RLS das tabelas inalterada (colunas novas herdam as politicas existentes).
-- Aplicado em prod (pybgqassjzcynzaakzhz) em 2026-06-13.

-- 1) Config do diagnostico em deep_funnels
alter table public.deep_funnels
  add column if not exists objetivo text,
  add column if not exists num_perguntas integer not null default 12,
  add column if not exists cenario text not null default 'equilibrado';

-- 2) Destino generalizado (produto/aula/live/grupo) + capa + flag de principal
alter table public.deep_funnel_products
  add column if not exists tipo text not null default 'produto',
  add column if not exists imagem_url text,
  add column if not exists is_principal boolean not null default false;

-- 3) Integridade basica (defaults ja deixam as linhas atuais validas)
alter table public.deep_funnels
  drop constraint if exists deep_funnels_cenario_chk,
  add  constraint deep_funnels_cenario_chk check (cenario in ('educar','equilibrado','conversao'));
alter table public.deep_funnels
  drop constraint if exists deep_funnels_numperguntas_chk,
  add  constraint deep_funnels_numperguntas_chk check (num_perguntas in (5,8,12));
alter table public.deep_funnel_products
  drop constraint if exists deep_funnel_products_tipo_chk,
  add  constraint deep_funnel_products_tipo_chk check (tipo in ('produto','aula','live','grupo','outro'));

-- 4) No maximo 1 destino principal por funil
create unique index if not exists deep_funnel_products_one_principal
  on public.deep_funnel_products (funnel_id) where is_principal;
