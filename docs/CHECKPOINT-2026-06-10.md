# Checkpoint — 2026-06-10

Estado vivo resumido. Para o panorama completo, ver `MEMORY.md` na raiz.

## O que entrou em produção hoje

Tudo no `main`, deploy automático no Vercel. Último deploy: `#166` (3ed779e), READY.

- **#158** — Tema azul-copa (Brasil) como padrão global de entrada em todo o
  sistema (exceto painel admin do dono = gold-noir). Loja mostrando Pro E Premium
  + seção "Pacotes avulsos". Fundo pontilhado (`BGPattern`) nas telas internas.
  Funil: redirect de intenção no login/signup, CTAs de planos → `/loja?plan=`.
  Correções de copy em `/vendas` e `/planos` (remoção de em-dashes, ajustes).
- **#159** — Foto de perfil da bio maior e quadrada-arredondada; cropper em modo
  retângulo (rect) com raio, em todos os ambientes de crop.
- **#161** — Home `/` passa a ser a **página de vendas**; diagnóstico imersivo move
  para `/diagnostico`; tenant padrão de divulgação = `axtor-labs` (não mais
  `joanderson`).
- **#163** — `api/og.ts` (Vercel edge function) + rewrite por user-agent no
  `vercel.json`. Remove a `middleware.ts` (abordagem que não roda em projeto Vite).
- **#166** — Fix do OG: a função lia `VITE_SUPABASE_ANON_KEY` (env inexistente no
  Vercel); corrigido para `VITE_SUPABASE_PUBLISHABLE_KEY`. **Validado em produção**:
  `GET /api/og?slug=joanderson` retorna título, descrição e avatar do tenant.

Motor de créditos (fases 1-3) já estava no ar: saldo por tenant, débito nas 3
funções de IA sem perder lead, provisão de crédito ao pagar (plano + pacote),
cron mensal.

## Preview de link por tenant (OG) — como funciona

A bio é SPA (React); crawlers (WhatsApp, etc.) não rodam JS, então liam só as meta
fixas do `index.html` (genéricas, com logo da Axtor). Agora:

1. `vercel.json` detecta user-agent de crawler em `axtor.space/:slug` e reescreve
   para `/api/og?slug=:slug`.
2. `api/og.ts` resolve o tenant via RPC `resolve_tenant_by_slug` + lê `bio_config`
   (anon/publishable key, RLS público), e injeta `og:title`, `og:description` e
   `og:image` (avatar do tenant) no HTML antes de devolver.
3. Usuário normal (browser) continua na SPA — não passa pela função.

Cache: `s-maxage=300, stale-while-revalidate=86400`. Após deploy, slug já cacheado
pode mostrar o antigo por minutos. WhatsApp tem cache próprio → usar o depurador do
Facebook ("Scrape Again") para forçar.

## Atrito de ambiente observado hoje

- Git do dono (Windows): saudável. Git do sandbox do agente: ficou dessincronizado
  (lock fantasma `.git/index.lock`, `packed-refs`/`HEAD` corrompidos por crash).
  Recuperado: `packed-refs` truncado e `HEAD` com bytes nulos foram restaurados.
  Regra prática: commit/push pelo Windows; não confiar no `git status` do sandbox.
- Conflito de squash: PR a partir de branch antiga contra `main` já squashada gera
  conflito de "arquivo adicionado dos dois lados". Solução usada: branch nova a
  partir da `main` atualizada + `git cherry-pick` do commit do fix → diff limpo.

## Aberto / pendente

- **PRs abertos:** #160 (home/vendas — duplicado do #161 já mergeado → fechar);
  #150 (hygiene: untrack `.env` + `.env.example` → revisar diff e mergear, é
  segurança). Branch `fix/og-rpc` é resto do OG → ignorar/apagar.
- **Segurança:** repo é PÚBLICO. Verificar se `.env` real já esteve no histórico;
  se sim, rotacionar chaves (service_role, Anthropic, Asaas). Ver #150.
- **Fase 4** (frontend de créditos): card de saldo, modal de bloqueio ao zerar,
  checkout premium/pacotes ligado no front.
- **Fase 6:** QA ponta a ponta + 1 Pix REAL de teste antes de cliente pagar.
- **Etapa B do funil:** guest checkout "Caminho Y" (paga, depois cria conta) — só desenhado.
- M2 (leaked password protection no Supabase, ação do dono) e A4 (logo dos emails
  no projeto antigo) seguem pendentes da auditoria.
- Confirmar tema do tenant `axtor-labs` (deve ser azul-copa).
