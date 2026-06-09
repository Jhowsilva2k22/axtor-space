# MEMORY.md — Axtor Space

> Leia este arquivo no início de cada conversa para entender o estado atual.
> Memória aditiva: nunca substituir, sempre acrescentar.
> Última atualização: 2026-06-09 (estado do `main` @ PR #140).

## O que é

SaaS multi-tenant: link na bio + funil + diagnóstico imersivo. Organização
separada de Habithus e de Pai Presente. Copy e naming neutros, voz SaaS.

## Repositório e deploy

- Repo: github.com/Jhowsilva2k22/axtor-space (branch principal: `main`).
- Vercel: projeto `axtor-space` (team `joanderson-silvas-projects`). Deploy
  automático a partir do `main`.
- Último commit no `main`: `a4dc256` — PR #140, 2026-06-01.
- Último deploy de produção: 2026-06-01, estado READY, a partir do #140.
  O que está no ar = último commit. CI/CD saudável.

## Ambientes Supabase

- Produção: ref `bdxkcfngskagriaapepo` (definido em `.env` e
  `supabase/config.toml`).
- Staging: ref `pybgqassjzcynzaakzhz` (definido em `.env.local`, org
  `imuxrxdghkwbpgdxpttr`, projeto `axtor-staging`, região sa-east-1).
- Observação de conexão (2026-06-09): via conector MCP só o `axtor-staging`
  estava acessível. Confirmar acesso ao ref de produção antes de qualquer
  migration em prod.

## Stack

React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase. Mobile-first.
RLS sempre ativa. Sem emoji em UI, sem visual de chatbot.

## Estética

Gold-noir Axtor: `#c9a84c` sobre `#0d0d0d`, display Cormorant Garamond, corpo
Helvetica. Aplicar também em emails. Modo claro e ThemeToggle foram removidos
(PR #118).

## Estado atual — o que está pronto e no ar

- Autenticação completa: signup, login, forgot/reset password, sessão segura
  (nunca forçar logout antes de `getSession()` resolver).
- Bio / link na bio com templates por nicho, tema ao vivo e player ambiente
  com 20 faixas CC0.
- Página de captura (capture page) com foto própria, crop, checklist de
  campos vazios e link por slug do tenant.
- Diagnóstico imersivo (Deep Funnel): geração via IA, página pública,
  resultado com preview de bio e CTA, tela de obrigado, edição de briefing.
- Loja `/loja`: checkout Pix transparente via Asaas, addons, controle por
  plano (sócios/testers/owners veem "Incluído no seu plano").
- Painel do tenant: Leads (tabela paginada, seleção, exportar CSV, deletar),
  Métricas (dashboard MVP), Mídia (galeria por tipo), Configurações (perfil,
  assinatura, convites, slug em tempo real).
- Admin Hub: convites, landing partners, templates, analytics, diagnósticos,
  melhorias por IA.
- Onboarding: auto-provisionamento de tenant após confirmar email + tela de
  boas-vindas com mockup da capture page.
- Infra de email: domínio `notify.axtor.space` verificado, 2 queues pgmq,
  cron de processamento, templates auth + transacionais gold-noir PT-BR,
  unsubscribe e suppression.
- Legal: páginas Termos e Privacidade + rodapé legal (LGPD).
- Segurança: rate limit por email, detecção de padrão suspeito, CORS por
  allowlist nas edge functions, idempotência no webhook Asaas, Sentry no
  frontend e em 4 edge functions.

## Edge Functions (supabase/functions)

analyze-deep, analyze-instagram, asaas-create-payment, asaas-webhook,
auth-email-hook, delete-account, generate-deep-funnel, generate-icon,
generate-improvements, handle-email-suppression, handle-email-unsubscribe,
preview-transactional-email, process-email-queue, proxy-image,
send-transactional-email.

## Regras de ouro (resumo)

1. Cada edit resolve um problema. Sem refatorar de carona.
2. Mudança >2 linhas ou em arquivo crítico: mostrar diff antes, esperar ok.
3. Inspecionar artefato antes de entregar. Avisar o que pode quebrar antes de rodar.
4. Não commitar/pushar sem ok. Nunca push direto no `main` — sempre branch + PR.
5. Memória aditiva, nunca substituir.
6. Sem moralismo, sem clichê de coach, sem emoji em UI.
7. Antes de implementar feature: grep no projeto pra não duplicar.

## Pendências conhecidas

- Cópia local do repo pode estar atrasada em relação ao `main`. Rodar
  `git fetch && git pull` antes de codar local.
- Testes manuais de email nunca confirmados formalmente: `/signup`,
  `/forgot-password`, `/admin/invites`.
- Confirmar acesso ao Supabase de produção via conector.

## Ponteiros

- Detalhe do que entrou: [docs/CHECKPOINT-2026-06-09.md](docs/CHECKPOINT-2026-06-09.md)
- Memórias temáticas: [mem/index.md](mem/index.md)
- Regras operacionais do agente: [CLAUDE.md](CLAUDE.md)
- Planta técnica anterior: [docs/MANUAL-TECNICO-2026-04-23.md](docs/MANUAL-TECNICO-2026-04-23.md)
