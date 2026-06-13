# MEMORY.md — Axtor Space

> Leia este arquivo no início de cada conversa para entender o estado atual.
> Memória aditiva: nunca substituir, sempre acrescentar.
> 2026-06-13 (rota + leads unificados): rota /diagnostico/:slug por PATH (#187). LEADS UNIFICADOS COMPLETO (A=#188 dedup 95→43 + colunas; B=#189 RPC upsert_lead_contact + índice único + notificação só no 1º contato + fix aiResp nulo; C=#190 painel lê `leads` com origem/diag/quente + paginação 7-15). Contato único por (tenant,email); perfil privado não cobra crédito; backups _bak_*_20260613 a limpar depois de validar. Ver docs/PLANO-leads-unificados.md.
> 2026-06-13 (deploys + crédito + autonomia): edge functions alinhadas ao `main` (NÃO sobem no merge — deploy via CLI Supabase). Redeploy em prod: generate-deep-funnel v29, analyze-deep, analyze-instagram, proxy-image. DÉBITO DE CRÉDITO #158 agora ATIVO. Autonomia: Fase 1 (#184), 2a (#185) e 2b (#192, severidade do veredict por cenário) mergeadas; falta só Fase 3 (wizard). REGRA NOVA: nunca passar de fase sem conferir cada deploy/merge/doc. Ver docs/CHECKPOINT-2026-06-13.md.
> Última atualização: 2026-06-12 (sessão perf mobile: #176→#179). Desempenho mobile de /vendas e /planos investigado a fundo e ENCERRADO: a nota ~60 é teto da stack (SPA React pesado) — prerender NÃO roda no build da Vercel e renderia só ~70 mesmo. Shipados ganhos reais (sem pipeline) + copy. NÃO re-tentar prerender/SSR sem decisão de migrar stack. Ver docs/CHECKPOINT-2026-06-12-perf-mobile.md.
> Antes (mesmo dia): #173 guest checkout Pix + domínio + GlowPanel + mobile-first do painel; #174 fix do link do diagnóstico /→/diagnostico + lazy do fundo 3D + jargão. Ver docs/CHECKPOINT-2026-06-12.md.

## O que é

SaaS multi-tenant: link na bio + funil + diagnóstico imersivo. Organização
separada de Habithus e de Pai Presente. Copy e naming neutros, voz SaaS.

## Repositório e deploy

- Repo: github.com/Jhowsilva2k22/axtor-space (branch principal: `main`).
- Vercel: projeto `axtor-space` (team `joanderson-silvas-projects`, id
  `team_Mf3vr6oYlp373wrEsowhFQT8`). Deploy automático a partir do `main`. ESTE é
  o CI/CD. Lovable NÃO é mais usado.
- O que está no ar = último commit no `main`. Hoje: `#170` (Fase 4 créditos).
- IMPORTANTE: o merge no `main` só sobe o FRONT (Vercel). Edge function NÃO sobe no
  merge — deploy é via CLI Supabase (`npx supabase functions deploy <nome>
  --project-ref pybgqassjzcynzaakzhz`). Sempre conferir versão deployada vs `main`.

## Ambientes Supabase

- Produção (REAL): ref `pybgqassjzcynzaakzhz` (projeto nomeado `axtor-staging`,
  org `imuxrxdghkwbpgdxpttr`, sa-east-1). O nome ainda não foi trocado, mas
  é o banco vivo (confirmado por dados reais + env do Vercel).
- `config.toml` e `.env` alinhados para esse ref (PR #142).
- `bdxkcfngskagriaapepo` = projeto ANTIGO. Não usar. Ainda serve os logos dos
  emails (ver pendência A4).
- Env no Vercel (Production+Preview, desde 27/abr): `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SENTRY_DSN`.
  NÃO existe `VITE_SUPABASE_ANON_KEY` — código que precisa da anon key usa
  `VITE_SUPABASE_PUBLISHABLE_KEY` (lição do fix OG #166).

## Stack

React 18 + TypeScript + Vite 8 + Tailwind + shadcn/ui + Supabase. Mobile-first.
RLS sempre ativa. Sem emoji em UI, sem visual de chatbot.

## Estética / Tema

- Marca Axtor / painel admin do DONO: gold-noir (`#c9a84c` sobre `#0d0d0d`,
  display Cormorant Garamond, corpo Helvetica). Emails seguem gold-noir.
- TEMA PADRÃO DE ENTRADA (todo o sistema, toda conta nova): **azul-copa** (Brasil)
  — navy + amarelo. brand 52/98%/52% · surface 223/68%/6% (card 10%). Definido no
  `:root` do index.css (mata FOUC). Login/signup usam `useBrasilLockedTheme`.
  Exceção: painel admin do dono = gold-noir (`useAdminLockedTheme`).
- Cliente só troca de tema APÓS plano pago. Modo claro/ThemeToggle livre removidos.
- Fundo pontilhado estático (`BGPattern`, variant dots) em todas as telas internas.
  Reflexo de brilho no hover (`data-glow` + `useGlowEffect`), só em mouse.

## Estado atual — o que está pronto e no ar

- Auth completo (signup, login, forgot/reset, sessão segura; honra `?redirect=`).
- Bio/link na bio: templates por nicho, tema ao vivo, player ambiente (20 faixas CC0).
  Foto de perfil maior e quadrada-arredondada (cropper rect).
- Página de captura: foto própria, crop, checklist, link por slug.
- Diagnóstico imersivo (Deep Funnel): IA, página pública, resultado + CTA. Veredict
  com severidade por cenário (educar/equilibrado/conversão).
- Landing comercial: `/` = página de VENDAS (diagnóstico como oferta principal,
  "pra qualquer nicho"); `/planos` (Landing) com pricing animado; `/diagnostico`
  = diagnóstico de Instagram (Index). Rota por path `/diagnostico/:slug` (parceiro);
  `/diagnostico` puro = vitrine `axtor-labs` neutra.
- Loja `/loja` (e `/painel/loja`): mostra Pro E Premium + "Pacotes avulsos".
  Lê `?plan=pro|premium`. Checkout Pix via Asaas. Logado-out → login com redirect.
- Motor de créditos (Fases 1-4 no ar): saldo por tenant, débito nas 3 funções de
  IA (sem perder lead em falha; perfil privado não cobra), provisão ao pagar,
  cron mensal. Planos: Free 5cr / Pro R$47-75cr / Premium R$127-200cr (margem ≥75%).
- LEADS UNIFICADOS (no ar): `leads` = contato único por (tenant,email); os dois
  diagnósticos ligam por `lead_id`; captura via RPC `upsert_lead_contact` (1º contato
  notifica, retorno enriquece+quente sem 2º email); painel "Leads" lista contatos.
- Preview de link por tenant (OG): `api/og.ts` (edge) + rewrite por user-agent no
  `vercel.json`. Validado em prod (#166).
- Painel: Leads (contatos unificados), Métricas (MVP), Mídia, Configurações.
- Admin Hub: convites, landing partners, templates, analytics, diagnósticos, melhorias por IA.
- Onboarding: auto-provisionamento de tenant + boas-vindas.
- Infra de email: notify.axtor.space, queues pgmq, cron, templates PT-BR, unsubscribe/suppression.
- Legal: Termos + Privacidade + rodapé (LGPD).
- Segurança: rate limit, detecção de padrão suspeito, CORS allowlist, webhook Asaas idempotente, Sentry.

## IA das edge functions

- Anthropic direto (claude-sonnet-4-5): analyze-deep, analyze-instagram,
  generate-deep-funnel, generate-improvements (migrada da Lovable em PR #145).
- generate-icon (imagem): DESATIVADA no front (PR #146). Lovable fora do caminho.

## Regras de ouro (resumo)

1. Cada edit resolve um problema. Sem refatorar de carona.
2. Mudança >2 linhas ou em arquivo crítico: mostrar diff antes, esperar ok.
3. Inspecionar artefato antes de entregar. Avisar o que pode quebrar antes de rodar.
4. Não commitar/pushar sem ok. Nunca push direto no `main` — sempre branch + PR.
5. Memória aditiva, nunca substituir.
6. Sem moralismo, sem clichê de coach, sem emoji em UI.
7. Antes de implementar feature: grep no projeto pra não duplicar.
8. Ao fechar algo importante: ATUALIZAR os docs do sistema no mesmo fluxo.
9. Nunca passar de fase sem conferir item a item cada deploy/merge/doc (nada pra trás).

## Resolvido em 2026-06-13 (rota + leads unificados)

- #187 (mergeado/deploy): rota `/diagnostico/:slug` — identidade do parceiro por
  PATH (não mais `?utm_source=`, frágil). Ordem de resolução no Index:
  `path → utm (legado) → axtor-labs neutro` (não mais `joanderson`). O path
  alimenta partnerCtas + atribuição do lead (utm.source = pathSlug), então métrica
  e notifyLead (por tenant_id) ficam certas SEM mexer na edge function. Links do
  painel (`MyLinksCard`, `AdminLandingPartners`) geram `/diagnostico/<slug>`.
  ResultStep: removidos fallbacks fixos de Pai Presente (Stefany/handle/número).
- LEADS UNIFICADOS — COMPLETO (A+B+C). Plano: docs/PLANO-leads-unificados.md.
  - Fase A (#188, banco, migration `20260613060000` via conector + backups
    `_bak_*_20260613`): `leads` é o contato único. Dedup por (tenant,lower(email))
    **95 → 43 contatos** (joanderson 67→26), 0 diagnóstico perdido (89→89). Colunas
    `status`/`last_activity_at`/`diagnostics_count`. Imersivos com email religados
    (9); 21 sem email intactos. "quente" (2+) = 17.
  - Fase B (#189, edge fns, migration `20260613070000`): RPC `upsert_lead_contact`
    (retorna lead_id + was_new) + ÍNDICE ÚNICO `(tenant,lower(email))` ativo.
    `analyze-instagram` e `analyze-deep` fazem upsert (dedup), setam `lead_id`,
    notificam o dono SÓ no 1º contato (was_new). Retorno = enriquece + "quente",
    SEM 2º email. Duplicata exata = nada. Perfil privado = `private_profile`, NÃO
    cobra crédito. Fix: `aiResp` nulo (sem crédito) não estoura mais 500.
  - Fase C (#190, painel): `useLeads` lê `leads` (1 linha/contato), colunas
    Nome/E-mail/Telefone/Instagram/Origem/Diag./Status(badge quente)/Última atividade.
    Paginação 7/10/15 (padrão 7). Devolveu os leads de Instagram que sumiam.
  - FALTA (opcional): Fase C.2 = modal de histórico de diagnósticos por contato
    (Instagram/imersivo, score, dor) via `lead_id`. Limpar `_bak_*_20260613` após validar.

## Resolvido em 2026-06-13 (sessão deploys + crédito + autonomia)

- Edge functions estavam atrasadas vs `main` (NÃO sobem no merge; só o front via
  Vercel — deploy é CLI Supabase). REDEPLOYADAS em prod (ref pybgqassjzcynzaakzhz):
  generate-deep-funnel v29 (Fase 2a #185), analyze-deep + analyze-instagram
  (débito de crédito #158), proxy-image (CORS #123).
- CRÉDITO #158 AGORA ATIVO em prod: cada diagnóstico (instagram/imersivo) consome 1
  crédito do dono. Instagram sem saldo → lead retido (status `no_credit`, cache 12h);
  imersivo sem saldo → veredito-template (fallback), lead nunca fica sem resposta.
- AUTONOMIA DO DIAGNÓSTICO (plano docs/PLANO-autonomia-diagnostico.md):
  - #184 (Fase 1): migration `20260613020000` (deep_funnels: objetivo/num_perguntas/
    cenario; deep_funnel_products: tipo/imagem_url/is_principal) + plano.
  - #185 (Fase 2a): generate-deep-funnel usa num_perguntas/cenario/objetivo + destinos.
  - #192 (Fase 2b): analyze-deep ajusta a SEVERIDADE do veredict pelo `cenario`
    (educar=leve, equilibrado=médio, conversão=afiado-honesto). Sem migration.
  - FALTA: Fase 3 = painel/wizard pro dono criar/editar o próprio diagnóstico (UI).
- generate-icon: CONFIRMADO morto no front (IconPicker só tem aba Biblioteca/Lucide;
  handleGenerate/invoke sem gatilho na UI). Não precisa deploy. Limpar quando der.
- LIÇÃO: o `origin/main` em cache do sandbox estava STALE. Conferir merge/branch sempre pelo GitHub.

## Resolvido em 2026-06-12 (sessão perf mobile)

Investigação completa do desempenho mobile de /vendas e /planos (estava ~60).
Sequência de PRs (todos mergeados/deploy):

- #176: prerender de /vendas e /planos (HTML pronto via Chromium). FUNCIONOU local
  (~72), mas no build da Vercel o Chromium NÃO sobe (falta libnss3) → sem ganho.
- #177: REVERTE o prerender e volta o 3D no mobile.
- #178 (no ar): ganhos REAIS sem pipeline — `Bio` lazy + lucide fora do manualChunk;
  título do hero instantâneo no MOBILE; `index.html` com fundo escuro desde o 1º byte.
- #179 (no ar): copy de clareza na /vendas.

LIÇÃO/DECISÃO: a nota mobile de laboratório é TETO desta stack (SPA React). O único
lever real é SSR de verdade (migrar stack) — fora de escopo. NÃO re-tentar prerender/SSR.

## Resolvido em 2026-06-11

- #168 CTAs da Vendas → `/signup` + padronização das telas externas no design do login.
- #169 hero da `/planos` modo DECISÃO + `StickyCTA` mobile.
- #170 FASE 4 frontend de créditos (`useCredits`, `CreditsCard`, `CreditsBlockModal`, loja blindada).
- Lógica de funil firmada: Vendas (`/`) = desejo → `/signup`; Planos = decisão → `/loja?plan=`.
- SEGURANÇA (refino): o `.env` que vazou tinha SÓ chaves `VITE_` públicas; rotação = higiene de baixo risco.

## Resolvido em 2026-06-10

- #158 tema azul-copa global + Loja + pontilhado + funil. #159 foto perfil quadrada.
- #161 home `/` = vendas; tenant padrão `axtor-labs`. #163/#166 OG por tenant.
- Motor de créditos fases 1-3 (banco, débito, provisão ao pagar, cron mensal).

## Resolvido em 2026-06-09 (auditoria)

- A2 config no banco certo (#142) · A1 RLS deep_diagnostics (#144) · A3 Anthropic (#145)
  · A3 imagem desativada (#146) · npm audit 0 vulns (#147) · build Vite 8 verde.

## Pendências conhecidas

- ✓ RESOLVIDO 2026-06-13 (#187): rota /diagnostico/:slug por PATH. Pendente só:
  publicar funil-demo + WhatsApp no axtor-labs pro CTA do /diagnostico puro.
- ✓ RESOLVIDO 2026-06-13 (A #188 / B #189 / C #190): LEADS UNIFICADOS (dedup +
  upsert + notificação 1º contato + painel de contatos). FALTA (opcional): Fase C.2
  (modal de histórico por contato) + LIMPAR backups `_bak_*_20260613` após validar.
- ⚠️ EM ABERTO: AUTONOMIA Fase 3 = painel/wizard pro dono criar/editar o próprio
  diagnóstico (UI). Backend pronto (Fase 1 #184 / 2a #185 / 2b #192). Plano em
  docs/PLANO-autonomia-diagnostico.md. Reestrutura o BriefingWizard: objetivo →
  briefing → destino(s) → config (5/8/12 perguntas, cenário) → gerar IA → editar/publicar.
- Fase 6: QA ponta a ponta + 1 pagamento Pix REAL de teste antes de cliente pagar.
- ✓ RESOLVIDO 2026-06-12 (#173): guest checkout "Caminho Y" — validado com Pix real R$6.
- ⚠️ EM ABERTO 2026-06-12: desempenho MOBILE de `/vendas` e `/planos` (~60). Lever real = SSR (migrar stack).
- M2: ativar "leaked password protection" no painel Supabase (Auth). Ação do dono. AINDA DESLIGADO.
- ✓ RESOLVIDO 2026-06-11: A4 logos de email em `public/email/`.
- OG por tenant: validado; falta só teste num WhatsApp real + "Scrape Again" no FB.
- Cópia local pode estar atrasada vs `main`: SEMPRE `git pull` antes de codar.

## Atrito de ambiente (importante pro próximo chat)

- O git RODA bem no Windows do dono, MAS o lock fantasma `.git/index.lock` aparece
  (resolver: fechar IDE/GitHub Desktop e `Remove-Item ...\.git\index.lock -Force`).
  O git do sandbox fica dessincronizado (`origin/main` em cache STALE). NÃO confiar
  no `git status` do sandbox; conferir merge/branch pelo GitHub e commitar pelo Windows.
- PowerShell quebra `stash@{0}` (interpreta `@{}`); usar aspas: `git checkout "stash@{0}" -- <arquivos>`.
- Repo SEM `.gitattributes` e arquivos são CRLF — NÃO subir arquivo EXISTENTE via API
  do GitHub (vira churn de fim de linha); editar existente é melhor pelo Windows.
  Arquivos NOVOS via API são OK.
- Fluxo de commit que funcionou: editar no sandbox (Write/Edit) → `git switch -c <branch>`
  no Windows → `git add <arquivos>` → commit → push → eu abro/mergeio o PR pelo GitHub.
- Edge function: deploy via CLI Supabase (não sobe no merge). Migration: aplicar via conector + versionar.

## Ponteiros

- Plano leads unificados: [docs/PLANO-leads-unificados.md](docs/PLANO-leads-unificados.md)
- Plano autonomia diagnóstico: [docs/PLANO-autonomia-diagnostico.md](docs/PLANO-autonomia-diagnostico.md)
- Checkpoint de hoje: [docs/CHECKPOINT-2026-06-13.md](docs/CHECKPOINT-2026-06-13.md)
- Auditoria completa: [docs/AUDITORIA-2026-06-09.md](docs/AUDITORIA-2026-06-09.md)
- Memórias temáticas: [mem/index.md](mem/index.md)
- Regras do agente: [CLAUDE.md](CLAUDE.md)
