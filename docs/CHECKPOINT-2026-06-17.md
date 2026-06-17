# Checkpoint 2026-06-17 — PWA + Identidade Visual

> PRs do dia: **#201** (SW), **#203** (fix offline), **#205** (start_url), **#204**/**#206** (ícones + banner OG). Todos mergeados e deployados na Vercel.

## Contexto

Antes desta entrega o app tinha apenas `public/manifest.webmanifest` (nome, ícones,
tema → permitia "adicionar à tela inicial"), mas **nenhum service worker**. Ou seja:
não havia cache de assets, nem offline, nem base para push. Isso também explicava
parte da fragilidade em 4G (nada ficava em cache local do app).

## O que entrou (#201)

Arquivos:

- `public/sw.js` (novo) — service worker próprio, **zero dependência nova**.
- `public/offline.html` (novo) — tela offline mínima, self-contained, tema `#100F0F`.
- `src/main.tsx` (+8 linhas) — registra `/sw.js` **só em produção**
  (`import.meta.env.PROD`, após `window load`). Em dev não muda nada.

## Decisão de arquitetura

Optou-se por **service worker manual** em vez de `vite-plugin-pwa`/Workbox:

- O projeto está em **Vite 8** (recém-saído); adicionar a toolchain (`vite-plugin-pwa`
  + `workbox-build` + `workbox-window`) traria risco de peer-deps justo nesse momento.
- O sandbox de trabalho não builda o projeto Windows, dificultando validar a toolchain.
- Um `sw.js` de ~110 linhas é auditável e resolve o caso sem precache automático,
  porque os assets já têm hash no nome (imutáveis → CacheFirst funciona sozinho).

## Estratégia de cache

- **Navegação (HTML):** NetworkFirst → cache da rota → casca do app (`/`) → `offline.html`.
  Sempre fresco quando online; deploy novo é pego de imediato (sem versão velha presa).
- **Assets `/assets/*` (com hash):** CacheFirst. Imutáveis; deploy gera nome novo.
- **Imagens (storage/proxy cross-origin incluso):** StaleWhileRevalidate. Ajuda o
  flicker de foto na captura e a confiabilidade em 4G.
- **Supabase (REST/RPC/functions) e websockets:** passam direto, **nunca cacheados**
  (dado sempre fresco).
- Install pré-cacheia `/` (casca) + `offline.html`. Activate limpa caches fora do
  conjunto da `VERSION` atual e dá `clients.claim()`.

## Operação

- Const `VERSION` no topo do `sw.js`: **incrementar** para purgar todas as caches num
  deploy crítico (o `activate` apaga as antigas automaticamente).
- O `AppErrorBoundary` já recarrega em erro de chunk (rede de segurança extra).

## Validação

Build local (`npm run build` + `npx serve dist`):

- DevTools › Application › Service Workers: `sw.js` **activated and running**.
- Offline (checkbox) + reload: serve a tela cacheada / `offline.html` (não mais o
  erro nativo `ERR_FAILED` do Chrome — corrigido com o pré-cache da casca + fallback
  em cadeia).
- Botão **"Instalar"** apareceu na barra do Chrome (app instalável).

## Fix do offline (#203, `3b1a7cf`)

O squash do #201 capturou o **1º commit** do branch (sw.js antigo, sem o fix do
offline) — corrida entre o push do fix e o merge. Produção subiu com o SW velho, cujo
offline dava `ERR_FAILED`. **#203** reaplica a versão validada: install pré-cacheia
`/` + `offline.html` via `addAll`; navegação offline cai em **rota → casca → offline.html**.

**Lição:** depois de pushar um fix numa branch de PR, conferir que o head do PR (e o
conteúdo do arquivo) atualizou ANTES de mergear; não mergear logo após o push.

## start_url do app instalado (#205, `d5e0e4f`)

O app instalado abria na landing (`/`). `start_url` do manifesto passou para `/painel`
(workspace do usuário; cai no login se não autenticado) — padrão de PWA de SaaS.

Nota iOS: o iOS usa a **página atual** como launch URL e costuma ignorar o `start_url`.
Por isso, no iPhone, instalar a partir de `axtor.space/painel`. Android/Chrome respeitam
o `start_url`.

## Identidade visual — ícones, favicon e banner OG (#204, #206)

**Problema:** o ícone do app, o favicon e o preview de compartilhamento saíam todos do
mesmo quadrado; e o `public/axtor-logo.png` NÃO tem transparência real (o "quadriculado"
é pintado, fundo opaco) → ícones com fundo feio, principalmente no iOS e no WhatsApp.

**Solução:** logo extraída por **cor** (azul: `blueness = B - max(R,G)`) com Pillow/numpy.

- **#204 (`50d1615`):** ícone = lettermark **AXTR** (sem "LABS", crop até o gap em
  x~1501) em fundo escuro `#100F0F` com glow azul → `apple-touch-icon.png` (180),
  `favicon.png` (512), `favicon.ico`. Banner `og-image.png` 1200×630 (logo + descritor
  "Link na bio, funil e diagnóstico com IA" + `axtor.space`, fonte Poppins). `index.html`:
  og/twitter title e description neutros (voz SaaS) no lugar do texto de diagnóstico.
- **#206 (`a2fc981`):** favicon **claro** na aba (`favicon.png`/`favicon.ico` brancos —
  o azul salta a 16–32px) + ícone **escuro** dedicado do app instalado (`icon-512.png`,
  novo). O `manifest.webmanifest` aponta o ícone 512 (any+maskable) para `icon-512.png`;
  `apple-touch-icon.png` segue escuro. **Atrito:** `.gitignore` tem `*.png` → PNG novo
  precisa `git add -f` (os ícones antigos já eram tracked).
- Decisão do dono: a marca é "Axtor", mas o mark visual **AXTR** da logo difundida pode
  ser usado no ícone.
- Caches para ver o novo: aba (Ctrl+F5), iPhone (remover/readicionar o atalho), WhatsApp
  (depurador do Facebook → "Scrape Again").

## Fora de escopo / próximos

- **Push notification** = fase 2 separada (precisa backend de push + permissão; iOS
  só 16.4+ e instalado).
- Cache de imagens sem teto no v1 (aceitável; dá pra limitar depois).

## Atrito registrado

- O mount do sandbox serviu uma cópia **truncada** do `sw.js` recém-escrito, fazendo o
  `node --check` falhar lá apesar do arquivo no Windows estar íntegro. Lição: não
  confiar no `node --check`/leitura do sandbox logo após editar; conferir pelo editor.
- Squash de PR pode capturar o head antigo se mergear logo após um push (vide #201→#203).
