# CHECKPOINT — 2026-06-12 (madrugada)

> Estado vivo: ver `MEMORY.md` na raiz. Este doc registra o que entrou no ar nesta sessão.

## O que foi pro ar (main)

Dois merges fecharam o acúmulo desde o `#172`:

- **#173 (`1286db4`)** — Guest checkout Pix ("Caminho Y": paga primeiro, conta
  depois) + fix de domínio (`PUBLIC_BASE_URL` canônico = `axtor.space`) + GlowPanel
  como casca única das telas externas + **passada mobile-first do painel** (bottom
  nav, app bar compacta, bordas padrão `rounded-xl/2xl`, `border-gold/20`) + **fix
  do plano Premium** (usePlanLimits reconhecendo premium/owner) + date picker custom
  (Popover+Calendar, funciona no iPhone) + **rotas por seção** (`/painel/secao/:section`).
- **#174 (`e16bb3f`)** — Fix do link do diagnóstico + lazy do fundo 3D + jargão.

## Fixes desta sessão (#174)

### 1. Link do "Diagnóstico de Instagram" caía na página de vendas
- **Causa:** a raiz `/` virou a página de vendas (`Vendas`). O diagnóstico de
  Instagram vive em `/diagnostico` (`Index`). Mas os CTAs apontavam pra `/`.
- **Código:** geradores em `MyLinksCard.tsx` e `AdminLandingPartners.tsx` passaram
  de `${ORIGIN}/?utm_source=` para `${ORIGIN}/diagnostico?utm_source=`.
- **Banco (produção, direto via SQL):** todos os blocos `cta_diagnostico` de
  Instagram normalizados para `https://axtor.space/diagnostico?utm_source=<slug>`.
  O bloco do `joanderson` estava SEM utm — recebeu `?utm_source=joanderson&utm_medium=instagram`.
  Tenants afetados: joanderson, stefany, rafaeldepaula1, axtor-labs. Blocos
  imersivos (`/d/funnel/<slug>`) não foram tocados (já estavam certos).

### 2. Perf do fundo 3D (DottedSurface)
- `Three.js` agora carrega via **import dinâmico** dentro de `requestIdleCallback`
  (pós-primeira-pintura). Tira ~150KB do caminho crítico. Visual idêntico, mesma onda.
- Beneficia as 8 páginas que usam o fundo.

### 3. Jargão "tenant" fora dos textos visíveis
- Loja, DeepDiagnosticReviewView, MetricsDashboard, Admin, BioTemplatePicker,
  ActivationBanner, Painel: "tenant"/"page views"/"ecossistema"/"fallback" trocados
  por linguagem natural ("conta", "visualizações", "na sua conta", etc.).
  "tenant" que sobra está só em código/variáveis (não visível ao usuário).

## ⚠️ EM ABERTO — Desempenho mobile das páginas de marketing

- `/vendas` e `/planos`: PageSpeed **mobile continua ~60** (desktop 93-96, ótimo).
- O lazy do fundo 3D NÃO resolveu — o fundo era só parte do problema.
- **Gargalo real:** são um app React **client-side**. HTML chega vazio; o navegador
  baixa+executa todo o JS do React antes de pintar (FCP/LCP ~6s no 4G).
- **Lever de verdade (não feito):** **pré-renderizar** `/vendas` e `/planos` (SSG/
  prerender no build) pra servir HTML pronto. É o que leva pra 85-95. Mudança de
  build, não destrutiva. Fica pra uma sessão com cabeça descansada.
- O agente PROMETEU "85+" e errou — recalibrar expectativa: só prerender move isso.

## Resolvidos (atualizar pendências antigas)

- ✓ Guest checkout (Etapa B / "Caminho Y") — estava EM ABERTO no MEMORY, agora NO AR (#173).
  Validado com pagamento Pix real de R$6 na sessão anterior (conta provisionada, Premium ativo).
- ✓ Fix de domínio (links vazando `vercel.app`) — `PUBLIC_BASE_URL` (#173).

## Notas de ambiente

- **Deploy = Vercel** a partir do `main`. NÃO existe Lovable no projeto (a instrução
  do projeto que menciona Lovable está errada — ignorar).
- **CRLF:** o Windows mostra arquivos como "modified" por causa de fim de linha
  (autocrlf). Na resolução do merge do #174, isso travou o `git merge` — resolvido
  com `git stash` (guardar o ruído CRLF) antes do merge. Considerar normalizar via
  `.gitattributes` (`* text=auto eol=lf`) numa próxima pra parar de incomodar.
- **Resolução de conflito #174:** `PainelHeaderActions.tsx` e `UpgradeModal.tsx`
  conflitaram (main tinha versão antiga `rounded-sm/full`; branch tinha a nova
  mobile). Resolvido com `--ours` (versão do branch = superset). Nada perdido.
