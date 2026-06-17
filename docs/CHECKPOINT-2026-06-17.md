# Checkpoint 2026-06-17 — PWA / Service Worker

> Fecha o item: app virou PWA de verdade. PR **#201** (squash `5a685ef`), mergeado e deployado na Vercel.

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

## Fora de escopo / próximos

- **Push notification** = fase 2 separada (precisa backend de push + permissão; iOS
  só 16.4+ e instalado).
- Cache de imagens sem teto no v1 (aceitável; dá pra limitar depois).

## Atrito registrado

- O mount do sandbox serviu uma cópia **truncada** do `sw.js` recém-escrito, fazendo o
  `node --check` falhar lá apesar do arquivo no Windows estar íntegro. Lição: não
  confiar no `node --check`/leitura do sandbox logo após editar; conferir pelo editor.
