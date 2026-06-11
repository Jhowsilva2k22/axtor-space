# MEMORY.md — Axtor Space

> Leia este arquivo no início de cada conversa para entender o estado atual.
> Memória aditiva: nunca substituir, sempre acrescentar.
> Última atualização: 2026-06-11 (telas externas no design do login + CTA Vendas→/signup + copy de decisão na /planos + barra fixa de CTA + Fase 4 frontend de créditos — tudo no ar).

## O que é

SaaS multi-tenant: link na bio + funil + diagnóstico imersivo. Organização
separada de Habithus e de Pai Presente. Copy e naming neutros, voz SaaS.

## Repositório e deploy

- Repo: github.com/Jhowsilva2k22/axtor-space (branch principal: `main`).
- Vercel: projeto `axtor-space` (team `joanderson-silvas-projects`, id
  `team_Mf3vr6oYlp373wrEsowhFQT8`). Deploy automático a partir do `main`. ESTE é
  o CI/CD. Lovable NÃO é mais usado.
- O que está no ar = último commit no `main`. Hoje: `#170` (Fase 4 créditos).

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
- Diagnóstico imersivo (Deep Funnel): IA, página pública, resultado + CTA.
- Landing comercial: `/` = página de VENDAS (diagnóstico como oferta principal,
  "pra qualquer nicho"); `/planos` (Landing) com pricing animado; `/diagnostico`
  = diagnóstico imersivo (Index). Tenant padrão de divulgação = `axtor-labs`.
- Loja `/loja` (e `/painel/loja`): mostra Pro E Premium + "Pacotes avulsos".
  Lê `?plan=pro|premium`. Checkout Pix via Asaas. Logado-out → login com redirect.
- Motor de créditos (Fases 1-3 no ar): saldo por tenant, débito nas 3 funções de
  IA (sem perder lead em falha), provisão de crédito ao pagar (plano+pacote),
  cron mensal. Planos: Free 5cr / Pro R$47-75cr / Premium R$127-200cr (margem ≥75%).
- Preview de link por tenant (OG): `api/og.ts` (edge) + rewrite por user-agent no
  `vercel.json`. Crawler em `axtor.space/:slug` → foto+nome+headline do tenant
  (não mais o genérico da Axtor). Validado em prod (#166).
- Painel: Leads, Métricas (MVP), Mídia, Configurações.
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

## Resolvido em 2026-06-11

- #168 (mergeado/deploy): CTAs da página de Vendas (`/`) apontam pra `/signup`
  em vez de `/planos` — mata o loop entre as duas telas quase idênticas. E
  padronização de TODAS as telas externas no design do login (`/admin/login`):
  `/signup`, `/forgot-password`, `/reset-password` e 404 usam fundo navy +
  `DottedSurface` + `useBrasilLockedTheme` + `data-glow` + card arredondado.
  Antes forgot/reset eram gold-noir (`useAdminLockedTheme`) com auroras.
  Spec de copy: `docs/COPY-CTA-vendas-planos.md`.
- #169 (mergeado/deploy): hero da `/planos` virou modo DECISÃO ("Escolha seu
  plano e comece hoje") — não é mais clone da Vendas. Escassez real ("+30% ao
  chegar a 1.000 assinantes"). Link "Ver planos" no hero da Vendas. Componente
  novo `StickyCTA` (barra fixa de CTA mobile, `md:hidden`) em `/` e `/planos`.
  Card do signup no tamanho do login, mais compacto.
- #170 (mergeado/deploy): FASE 4 frontend de créditos. Hook `useCredits` (lê
  `tenant_credits` via RLS owner-select). `CreditsCard` no header do painel
  (saldo + renovação; âmbar + "Recarregar" quando ≤6; "Ilimitado" pra dono).
  Badge "Premium" no `PLAN_LABELS`. `CreditsBlockModal` ao gerar funil sem os 6
  créditos (proativo + backstop no 402). Loja blindada: separa packs de crédito
  (`grants_credits`) dos addons de função (seção "Recursos avulsos" só aparece
  se houver addon de função ativo).
- Lógica de funil firmada: Vendas (`/`) = desejo → ativação (`/signup`).
  Planos (`/planos`) = decisão → checkout (`/loja?plan=`). Telas internas
  (Painel/Admin) = gold-noir; telas externas = design do login.
- SEGURANÇA (refino): a investigação a fundo do histórico mostrou que o `.env`
  que vazou continha SÓ chaves `VITE_` públicas (anon/publishable + URL +
  project_id). service_role/Anthropic/Asaas nunca tiveram valor real no git (só
  placeholder no `.env.example`). Anon é pública por design (vai no bundle JS,
  protegida por RLS). Logo a rotação vira higiene opcional de baixo risco, não
  emergência — a "prioridade 1" anterior estava superestimada.

## Resolvido em 2026-06-10

- #158 tema azul-copa global + Loja Pro/Premium/pacotes + pontilhado interno +
  funil (redirect de intenção no login/signup; CTAs de planos → /loja?plan=).
- #159 foto de perfil maior e quadrada-arredondada + cropper rect.
- #161 home `/` = vendas; `/diagnostico`; tenant padrão `axtor-labs`.
- #162 (middleware OG — abordagem morta, removida depois) · #163 `/api/og`
  edge function + rewrite por user-agent; remove middleware morto.
- #166 fix OG: lê `VITE_SUPABASE_PUBLISHABLE_KEY` (nome correto da env). Preview
  por tenant validado em produção (título/descrição/avatar do tenant).
- Motor de créditos fases 1-3 (banco, débito, provisão ao pagar, cron mensal).

## Resolvido em 2026-06-09 (auditoria)

- A2 config no banco certo (#142) · A1 RLS deep_diagnostics escopada (#144)
  · M1 listagem de buckets públicos removida (#144) · B1 search_path (#144)
  · A3 texto migrado p/ Anthropic (#145) · A3 imagem desativada (#146)
  · deps: npm audit fix, 0 vulnerabilidades (#147) · build Vite 8 verde.

## Prioridade do próximo chat (ERROS/RISCOS primeiro, depois features)

PRIORIDADE 1 — erros e riscos (resolver antes de tudo):
1. SEGURANÇA: repo é PÚBLICO. Checar se `.env` real já esteve no histórico do git;
   se esteve, ROTACIONAR chaves (service_role Supabase, Anthropic, Asaas). Mergear
   o PR #150 (untrack `.env` + `.env.example`). Fechar #160 (duplicado). Apagar
   branch `fix/og-rpc`.
2. INTEGRIDADE LOCAL: rodar `git status` no Windows e confirmar working tree limpa
   — checar se nada de real se perdeu no `git reset --hard` de ontem (havia ~16
   arquivos "modified", provavelmente só ruído de CRLF, mas CONFIRMAR).
3. OG real: testar o preview num WhatsApp de verdade; usar o depurador do Facebook
   ("Scrape Again") nos links já compartilhados (cache do WhatsApp).
4. Mobile: conferir telas novas (vendas, planos, loja, bio) — possíveis quebras.

PRIORIDADE 2 — features e pendências antigas:
- Etapa B (guest checkout) e M2 (leaked password protection) seguem abertos.
  Fase 4, A4 e tema do `axtor-labs` foram RESOLVIDOS/CONFIRMADOS em 2026-06-11.

## Pendências conhecidas

- ✓ RESOLVIDO 2026-06-11 (#170): Fase 4 frontend de créditos — card de saldo no
  painel, modal de bloqueio ao gerar funil sem saldo, loja blindada (packs vs addons).
- Fase 6: QA ponta a ponta + 1 pagamento Pix REAL de teste antes de cliente pagar.
  (O caminho pagamento → ativação → /bem-vindo JÁ está construído no front.)
- Etapa B do funil (guest checkout "Caminho Y": paga primeiro, cria conta depois) —
  desenhada, não construída. EM ABERTO.
- M2: ativar "leaked password protection" no painel Supabase (Auth). Ação do dono.
  CONFIRMADO AINDA DESLIGADO via advisors 2026-06-11. (Auditoria de segurança no
  mesmo dia: 0 ERROR; os WARNs são INSERT públicos por design — cliques/diagnósticos/
  leads — e RPCs security-definer com search_path fixo. Nada crítico.)
- ✓ RESOLVIDO 2026-06-11: A4 logos de email — templates apontam pra
  `axtor.space/email/axtor-logo(.png|-light.png)`, assets em `public/email/`, não
  mais o bucket antigo. Resíduo inofensivo: `inviterAvatarUrl` de EXEMPLO em 2 convites.
- ✓ CONFIRMADO 2026-06-11: tenant `axtor-labs` está em `azul-copa` (active_theme_slug).
- OG por tenant: CÓDIGO pronto/validado (#163/#166). Falta só teste manual num
  WhatsApp real + "Scrape Again" no depurador do FB pra limpar cache de links antigos.
- B2/B3/B4/B5: higiene de baixa prioridade, sem risco de produção (ver auditoria).
- Cópia local pode estar atrasada vs `main`: SEMPRE `git pull` antes de codar.

## Atrito de ambiente (importante pro próximo chat)

- O git RODA bem no Windows do dono. O git dentro do sandbox do agente pode
  ficar dessincronizado (lock fantasma `.git/index.lock`, visão "No commits yet").
  Quando isso acontecer: NÃO confiar no `git status` do sandbox; fazer commit/push
  pelo Windows. Locks fantasma do mount não aparecem no Windows.
- Edição de arquivo (Read/Write/Edit) grava no Windows e funciona normalmente.
- Lição OG: env com prefixo `VITE_` configurada como Production+Preview no Vercel
  FICA disponível no runtime da edge function via `process.env` — desde que o NOME
  bata exato. A função tinha `VITE_SUPABASE_ANON_KEY` (inexistente) → genérico.
- Cache do `/api/og`: `s-maxage=300, stale-while-revalidate=86400`. Após deploy,
  slug já cacheado pode mostrar o antigo por alguns minutos. WhatsApp tem cache
  próprio — usar o depurador do Facebook ("Scrape Again") pra forçar.

## Ponteiros

- Checkpoint de hoje: [docs/CHECKPOINT-2026-06-10.md](docs/CHECKPOINT-2026-06-10.md)
- Fixes da auditoria: [docs/CHECKPOINT-2026-06-09-auditoria-fixes.md](docs/CHECKPOINT-2026-06-09-auditoria-fixes.md)
- Auditoria completa: [docs/AUDITORIA-2026-06-09.md](docs/AUDITORIA-2026-06-09.md)
- Estado até #140: [docs/CHECKPOINT-2026-06-09.md](docs/CHECKPOINT-2026-06-09.md)
- Memórias temáticas: [mem/index.md](mem/index.md)
- Regras do agente: [CLAUDE.md](CLAUDE.md)
