# MEMORY.md — Axtor Space

> Leia este arquivo no início de cada conversa para entender o estado atual.
> Memória aditiva: nunca substituir, sempre acrescentar.
> 2026-06-17 (PWA + identidade): PWA de verdade — service worker próprio (#201, fix do offline #203). `start_url` do app instalado = `/painel` (#205). Identidade visual profissional: ícone AXTR + banner OG (#204); favicon CLARO na aba + ícone ESCURO do app (#206). Ver docs/CHECKPOINT-2026-06-17.md.
> 2026-06-13 (Hub + limpeza): Hub admin (/admin/hub) ganhou variação % (7d vs 7d anterior, ▲/▼) + FUNIL de conversão cross-tenant (views→cliques→leads→diagnósticos→assinaturas) (#196). DADOS DE TESTE LIMPOS em prod: 11 addons + 2 assinaturas apagados (backups `_bak_tenant_addons_20260613` / `_bak_tenant_subscriptions_20260613`). MRR agora = **R$0** = verdade pré-lançamento (NÃO é bug). Follow-up: dropar os `_bak_*` após validar; Hub pode ganhar sparkline diário + monitoramento real das functions (erros/latência via logs).
> 2026-06-13 (rota + leads unificados): rota /diagnostico/:slug por PATH (#187). LEADS UNIFICADOS COMPLETO (A=#188 dedup 95→43 + colunas; B=#189 RPC upsert_lead_contact + índice único + notificação só no 1º contato + fix aiResp nulo; C=#190 painel lê `leads` com origem/diag/quente + paginação 7-15). Contato único por (tenant,email); perfil privado não cobra crédito.
> 2026-06-13 (deploys + crédito + autonomia): edge functions alinhadas ao `main` (NÃO sobem no merge — deploy via CLI Supabase). DÉBITO DE CRÉDITO #158 ATIVO. AUTONOMIA COMPLETA: Fase 1 (#184), 2a (#185), 2b (#192) e 3 (#194, wizard 4 passos no painel). REGRA NOVA: nunca passar de fase sem conferir cada deploy/merge/doc. Ver docs/CHECKPOINT-2026-06-13.md.
> Última atualização: 2026-06-12 (sessão perf mobile: #176→#179). Desempenho mobile de /vendas e /planos investigado a fundo e ENCERRADO: a nota ~60 é teto da stack (SPA React pesado). NÃO re-tentar prerender/SSR sem decisão de migrar stack. Ver docs/CHECKPOINT-2026-06-12-perf-mobile.md.
> Antes (mesmo dia): #173 guest checkout Pix + domínio + GlowPanel + mobile-first do painel; #174 fix do link do diagnóstico /→/diagnostico + lazy do fundo 3D + jargão. Ver docs/CHECKPOINT-2026-06-12.md.

## O que é

SaaS multi-tenant: link na bio + funil + diagnóstico imersivo. Organização
separada de Habithus e de Pai Presente. Copy e naming neutros, voz SaaS.

## Repositório e deploy

- Repo: github.com/Jhowsilva2k22/axtor-space (branch principal: `main`).
- Vercel: projeto `axtor-space` (team `joanderson-silvas-projects`, id
  `team_Mf3vr6oYlp373wrEsowhFQT8`). Deploy automático a partir do `main`. ESTE é
  o CI/CD. Lovable NÃO é mais usado.
- IMPORTANTE: o merge no `main` só sobe o FRONT (Vercel). Edge function NÃO sobe no
  merge — deploy é via CLI Supabase (`npx supabase functions deploy <nome>
  --project-ref pybgqassjzcynzaakzhz`). Sempre conferir versão deployada vs `main`.

## Ambientes Supabase

- Produção (REAL): ref `pybgqassjzcynzaakzhz` (projeto nomeado `axtor-staging`,
  org `imuxrxdghkwbpgdxpttr`, sa-east-1). É o banco vivo (dados reais + env do Vercel).
- `config.toml` e `.env` alinhados para esse ref (PR #142).
- `bdxkcfngskagriaapepo` = projeto ANTIGO. Não usar. Ainda serve os logos dos emails.
- Env no Vercel (Production+Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VITE_SUPABASE_PROJECT_ID`, `VITE_SENTRY_DSN`. NÃO existe `VITE_SUPABASE_ANON_KEY` —
  código que precisa da anon key usa `VITE_SUPABASE_PUBLISHABLE_KEY` (lição do fix OG #166).

## Stack

React 18 + TypeScript + Vite 8 + Tailwind + shadcn/ui + Supabase. Mobile-first.
RLS sempre ativa. Sem emoji em UI, sem visual de chatbot.

## Estética / Tema

- Marca Axtor / painel admin do DONO: gold-noir (`#c9a84c` sobre `#0d0d0d`).
- TEMA PADRÃO DE ENTRADA (toda conta nova): **azul-copa** (navy + amarelo).
  Exceção: painel admin do dono = gold-noir.
- Cliente só troca de tema APÓS plano pago.
- Caixas = retangular de cantos arredondados, bordas douradas, sem quinas: cards
  `rounded-2xl border-gold/20`, botões `rounded-xl`. Padrão do sistema inteiro.
- Fundo pontilhado estático (`BGPattern`, variant dots) nas telas internas; brilho no hover.
- IDENTIDADE/ÍCONES (#204/#206): app instalado = ícone ESCURO (#100F0F) com lettermark
  AXTR; favicon da aba = CLARO. Logo-mestre `public/axtor-logo.png` é OPACO (quadriculado
  pintado, sem transparência real) — extrair por cor (azul) se precisar recompor.

## Estado atual — o que está pronto e no ar

- Auth completo (signup, login, forgot/reset; honra `?redirect=`).
- Bio/link na bio: templates por nicho, tema ao vivo, player ambiente, foto quadrada.
- Página de captura: foto própria, crop, checklist, link por slug.
- Diagnóstico imersivo (Deep Funnel): IA, página pública, resultado + CTA. Veredict com
  severidade por cenário. DONO cria/edita via wizard de 4 passos (objetivo→briefing→destinos→config).
- Landing: `/` = VENDAS; `/planos`; `/diagnostico` = diagnóstico de Instagram.
  Rota por path `/diagnostico/:slug` (parceiro); `/diagnostico` puro = vitrine `axtor-labs`.
- Loja `/loja`: Pro/Premium + pacotes. Checkout Pix via Asaas.
- Motor de créditos (Fases 1-4 no ar): saldo por tenant, débito nas 3 funções de IA
  (perfil privado não cobra), provisão ao pagar, cron mensal.
- LEADS UNIFICADOS (no ar): `leads` = contato único por (tenant,email); diagnósticos
  ligam por `lead_id`; captura via RPC `upsert_lead_contact`; painel "Leads" lista contatos.
- Hub admin (/admin/hub): Financeiro (MRR/ARR/assinaturas/extras), Clientes, Monitoramento,
  Analytics (visão cross-tenant + variação % 7d + funil de conversão).
- PWA (#201, fix #203): manifesto + service worker próprio (`public/sw.js`, sem dependência nova).
  Instalável + offline. Estratégia: navegação NetworkFirst→casca→offline; assets-hash
  CacheFirst; imagens StaleWhileRevalidate; Supabase/websockets NUNCA cacheados.
  Registro só em produção (`src/main.tsx`). `start_url`=/painel (#205). Push notification = fase 2 (não feito).
- IDENTIDADE VISUAL (#204/#206): ícone AXTR (lettermark, fundo escuro) no app instalado
  (`icon-512.png` + `apple-touch-icon.png`); favicon CLARO na aba (`favicon.png`/`favicon.ico`);
  banner OG profissional (`og-image.png`) + texto OG neutro (voz SaaS) no `index.html`.
- Preview de link por tenant (OG) validado em prod (#166).
- Admin Hub, Onboarding, Infra de email, Legal (LGPD), Segurança (rate limit/CORS/Sentry).

## IA das edge functions

- Anthropic direto (claude-sonnet-4-5): analyze-deep, analyze-instagram,
  generate-deep-funnel, generate-improvements.
- generate-icon (imagem): DESATIVADA no front (só aba Biblioteca/Lucide; invoke morto).

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

## Resolvido em 2026-06-17 (PWA)

- #201 (squash 5a685ef, mergeado/deploy): app virou PWA de verdade. Antes só tinha
  `public/manifest.webmanifest` (instalável) e nenhum service worker.
- Novos: `public/sw.js` (SW próprio, ZERO dependência nova — decisão consciente: não
  usar vite-plugin-pwa/workbox por causa do Vite 8 recém-saído + sandbox não builda
  projeto Windows; arquivo auditável de ~110 linhas) e `public/offline.html` (tela
  offline, tema #100F0F). `src/main.tsx`: registra `/sw.js` SÓ em produção
  (`import.meta.env.PROD`, após window load) — em dev não muda nada.
- Estratégia de cache: navegação (HTML) = NetworkFirst → cache da rota → casca do app
  (`/`) → offline.html; assets `/assets/*` (com hash) = CacheFirst; imagens =
  StaleWhileRevalidate (ajuda flicker de foto + 4G); Supabase (REST/RPC/functions) e
  websockets = passam direto, NUNCA cacheados (dado sempre fresco). Pré-cacheia
  `/` + offline.html no install.
- Const `VERSION` no topo do `sw.js`: subir pra purgar caches num deploy crítico (o
  `activate` apaga as antigas). Validado em build local (`npx serve dist`): SW
  activated, offline servindo tela cacheada, botão "Instalar" no Chrome.
- #203 (3b1a7cf): FIX do offline. O squash do #201 capturou o 1º commit (sw.js ANTIGO,
  sem o fix) → produção subiu com offline quebrado (ERR_FAILED). #203 reaplica a versão
  validada (install pré-cacheia `/`+offline.html via `addAll`; navegação offline cai em
  rota→casca→offline.html). LIÇÃO: depois de pushar fix numa branch de PR, CONFERIR que
  o head do PR atualizou (e o conteúdo do arquivo) ANTES de mergear; não mergear logo após o push.
- #205 (d5e0e4f): `start_url` do manifesto = `/painel` (workspace; cai no login se
  deslogado), não mais a landing `/`. iOS usa a PÁGINA ATUAL como launch URL e costuma
  ignorar o `start_url` → no iPhone instalar a partir de axtor.space/painel. Android/Chrome
  respeitam o `start_url`.
- FALTA (opcional): push notification (fase 2, precisa backend de push); teto no
  cache de imagens. Atrito: mount do sandbox serviu cópia TRUNCADA do sw.js → não
  confiar no `node --check` do sandbox pra arquivo recém-editado.

## Resolvido em 2026-06-17 (identidade visual)

- PROBLEMA: ícone do app, favicon e preview de compartilhamento saíam todos do mesmo
  quadrado, e o `public/axtor-logo.png` NÃO tem transparência real (o "quadriculado" é
  pintado, fundo opaco) → ícones com fundo feio (pior no iOS e no WhatsApp).
- SOLUÇÃO: logo extraída por COR (azul: blueness = B - max(R,G)) com Pillow/numpy no sandbox.
- #204 (50d1615): ícone = lettermark AXTR (sem "LABS", crop até o gap em x~1501) em fundo
  escuro #100F0F com glow azul → apple-touch-icon.png(180), favicon.png(512), favicon.ico.
  Banner og-image.png 1200x630 (logo + "Link na bio, funil e diagnóstico com IA" +
  axtor.space, fonte Poppins). `index.html`: og/twitter title+description neutros (voz SaaS),
  no lugar do texto antigo de diagnóstico.
- #206 (a2fc981): favicon CLARO na aba (`favicon.png`/`favicon.ico` brancos, azul salta a
  16-32px) + ícone ESCURO dedicado do app instalado (`icon-512.png`, NOVO). Manifesto aponta
  o 512 (any+maskable) pro `icon-512.png`; apple-touch-icon segue escuro. ATRITO: `.gitignore`
  tem `*.png` → PNG NOVO precisa `git add -f` (os antigos já eram tracked). Decisão do dono:
  marca é "Axtor" mas o mark visual AXTR da logo difundida pode ser usado.
- Caches pra ver o novo: aba (Ctrl+F5), iPhone (remover/readicionar o atalho), WhatsApp
  (depurador do Facebook → "Scrape Again").

## Resolvido em 2026-06-13 (Hub + limpeza de dados)

- #196 (mergeado/deploy): Hub admin mais "cockpit" — KpiCard ganhou prop `trend`
  (variação % 7d vs 7d anterior, ▲ verde/▼ vermelho); novas queries prev-7d no
  carregamento; nova seção FUNIL de conversão cross-tenant (views→cliques→leads→
  diagnósticos→assinaturas) com % de cada etapa.
- LIMPEZA de dados de teste (via conector, transacional, com backup):
  `tenant_addons` 11→0 (deep_diagnostic R$197 seed + credit-150 pending, todos
  do Joanderson/axtor-labs) e `tenant_subscriptions` 2→0 (testando R$5 + lorena-lore
  R$6 — eram o MRR R$11 falso). Backups: `_bak_tenant_addons_20260613`,
  `_bak_tenant_subscriptions_20260613` (DROPAR após validar uns dias). NÃO mexeu em
  tenants/leads/analytics. MRR agora R$0 = verdade pré-lançamento.

## Resolvido em 2026-06-13 (rota + leads unificados)

- #187 (mergeado/deploy): rota `/diagnostico/:slug` — identidade do parceiro por PATH.
  Ordem no Index: `path → utm (legado) → axtor-labs neutro`. Links do painel geram
  `/diagnostico/<slug>`. ResultStep sem fallbacks fixos de Pai Presente.
- LEADS UNIFICADOS — COMPLETO (A+B+C). Plano: docs/PLANO-leads-unificados.md.
  - Fase A (#188, migration `20260613060000`, backups `_bak_*_20260613`): dedup
    `leads` por (tenant,lower(email)) 95→43, 0 diagnóstico perdido. Colunas status/
    last_activity_at/diagnostics_count. "quente" (2+) = 17.
  - Fase B (#189, migration `20260613070000`): RPC `upsert_lead_contact` + ÍNDICE
    ÚNICO `(tenant,lower(email))`. analyze-instagram/analyze-deep fazem upsert, setam
    `lead_id`, notificam SÓ no 1º contato. Perfil privado = `private_profile`, sem
    cobrança. Fix: aiResp nulo não estoura mais 500.
  - Fase C (#190): `useLeads` lê `leads` (1 linha/contato, origem/diag/quente, paginação 7/10/15).
  - FALTA (opcional): Fase C.2 (modal de histórico por contato). Limpar `_bak_*_20260613`.

## Resolvido em 2026-06-13 (deploys + crédito + autonomia)

- Edge functions estavam atrasadas vs `main`. REDEPLOYADAS: generate-deep-funnel,
  analyze-deep, analyze-instagram (crédito #158), proxy-image (CORS #123).
- CRÉDITO #158 ATIVO: cada diagnóstico consome 1 crédito do dono. Instagram sem saldo
  → lead retido (no_credit, cache 12h); imersivo sem saldo → veredito-template.
- AUTONOMIA — COMPLETA (docs/PLANO-autonomia-diagnostico.md):
  - #184 (Fase 1) migration `20260613020000` (objetivo/num_perguntas/cenario + destino tipo/imagem/principal).
  - #185 (Fase 2a) generate-deep-funnel usa esses campos.
  - #192 (Fase 2b) analyze-deep ajusta severidade do veredict pelo cenário.
  - #194 (Fase 3) BriefingWizard virou wizard de 4 passos no painel. Follow-ups:
    uploader de capa com crop; prefill de objetivo/cenário/quantidade no modo edição.
- generate-icon: morto no front. LIÇÃO: `origin/main` do sandbox fica STALE — conferir pelo GitHub.

## Resolvido em 2026-06-12 (sessão perf mobile)

- #176–#179: investigação de perf mobile de /vendas e /planos. Prerender não roda na
  Vercel (revertido #177). Ganhos reais (#178): lazy Bio + lucide fora do manualChunk,
  título instantâneo no mobile, fundo escuro no 1º byte. Copy (#179).
- DECISÃO: nota mobile é TETO da stack (SPA). Único lever real = SSR (migrar). NÃO re-tentar prerender.

## Resolvido em 2026-06-11

- #168 CTAs Vendas→/signup + padrão telas externas. #169 hero /planos modo decisão + StickyCTA.
- #170 FASE 4 frontend de créditos. SEGURANÇA: .env vazado só tinha chaves VITE_ públicas (baixo risco).

## Resolvido em 2026-06-10

- #158 azul-copa + Loja + funil. #159 foto perfil. #161 home=vendas, tenant `axtor-labs`.
  #163/#166 OG por tenant. Motor de créditos fases 1-3.

## Resolvido em 2026-06-09 (auditoria)

- A2 config (#142) · A1 RLS deep_diagnostics (#144) · A3 Anthropic (#145) · npm audit 0 vulns (#147).

## Pendências conhecidas

- ✓ RESOLVIDO 2026-06-17 (#201/#203/#205): PWA + offline + `start_url` /painel. FALTA (opcional): push notification (fase 2); teto no cache de imagens.
- ✓ RESOLVIDO 2026-06-17 (#204/#206): identidade visual (ícone do app escuro, favicon claro, banner OG, texto OG neutro).
- ✓ RESOLVIDO 2026-06-13 (#187): rota /diagnostico/:slug. Pendente: funil-demo + WhatsApp no axtor-labs pro CTA do /diagnostico puro.
- ✓ RESOLVIDO 2026-06-13 (#188/#189/#190): LEADS UNIFICADOS. FALTA (opcional): Fase C.2 (histórico por contato).
- ✓ RESOLVIDO 2026-06-13 (#194): AUTONOMIA completa (wizard). Follow-ups: uploader de capa; prefill no modo edição.
- ✓ RESOLVIDO 2026-06-13 (#196): Hub trend + funil.
- ⚠️ FAZER: DROPAR os backups após validar — `_bak_*_20260613` (leads), `_bak_tenant_addons_20260613`, `_bak_tenant_subscriptions_20260613`.
- Hub follow-ups (opcionais): sparkline diário (RPC de agregação), monitoramento real das edge functions (erros/latência via logs), alertas acionáveis (tenant sem crédito/churn).
- Fase 6: QA ponta a ponta + 1 pagamento Pix REAL de teste antes de cliente pagar.
- ⚠️ EM ABERTO: desempenho MOBILE de /vendas e /planos (~60). Lever real = SSR (migrar stack).
- M2: ativar "leaked password protection" no Supabase (Auth). Ação do dono. AINDA DESLIGADO.
- OG por tenant: validado; falta teste num WhatsApp real + "Scrape Again" no FB.
- Cópia local pode estar atrasada vs `main`: SEMPRE `git pull` antes de codar.

## Atrito de ambiente (importante pro próximo chat)

- Git no Windows: lock fantasma `.git/index.lock` aparece (fechar IDE + `Remove-Item ...\.git\index.lock -Force`).
  O git do sandbox fica STALE (`origin/main` em cache). NÃO confiar no `git status` do sandbox; conferir pelo GitHub e commitar pelo Windows.
- PowerShell quebra `stash@{0}`; usar aspas: `git checkout "stash@{0}" -- <arquivos>`.
- Repo SEM `.gitattributes`, arquivos CRLF — NÃO subir arquivo EXISTENTE via API do GitHub (churn de fim de linha); editar existente pelo Windows. Arquivos NOVOS via API OK. (MEMORY.md é exceção: está em LF, edição via API é limpa.)
- `.gitignore` tem `*.png` → PNG NOVO não entra no `git add` normal; usar `git add -f` (os ícones antigos já eram tracked).
- O mount do sandbox pode servir cópia TRUNCADA de arquivo recém-escrito — não confiar no `node --check`/leitura do sandbox logo após editar; conferir pelo editor/Windows.
- Squash de PR pode capturar o head ANTIGO se mergear logo após um push novo (aconteceu no #201, corrigido no #203). Conferir o head/conteúdo do PR antes de mergear.
- Fluxo que funcionou: editar no sandbox (Write/Edit) → `git switch -c <branch>` no Windows → add/commit/push → eu abro/mergeio o PR pelo GitHub.
- Migration: aplicar via conector + versionar. Edge function: deploy via CLI Supabase.

## Ponteiros

- Plano leads unificados: [docs/PLANO-leads-unificados.md](docs/PLANO-leads-unificados.md)
- Plano autonomia diagnóstico: [docs/PLANO-autonomia-diagnostico.md](docs/PLANO-autonomia-diagnostico.md)
- Checkpoint 2026-06-17 (PWA + identidade): [docs/CHECKPOINT-2026-06-17.md](docs/CHECKPOINT-2026-06-17.md)
- Checkpoint 2026-06-13: [docs/CHECKPOINT-2026-06-13.md](docs/CHECKPOINT-2026-06-13.md)
- Auditoria: [docs/AUDITORIA-2026-06-09.md](docs/AUDITORIA-2026-06-09.md)
- Memórias temáticas: [mem/index.md](mem/index.md) · Regras: [CLAUDE.md](CLAUDE.md)
