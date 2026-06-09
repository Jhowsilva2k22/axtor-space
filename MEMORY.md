# MEMORY.md — Axtor Space

> Leia este arquivo no início de cada conversa para entender o estado atual.
> Memória aditiva: nunca substituir, sempre acrescentar.
> Última atualização: 2026-06-09 (pós-auditoria; fixes A1/M1/B1/A2/A3 + deps no ar).

## O que é

SaaS multi-tenant: link na bio + funil + diagnóstico imersivo. Organização
separada de Habithus e de Pai Presente. Copy e naming neutros, voz SaaS.

## Repositório e deploy

- Repo: github.com/Jhowsilva2k22/axtor-space (branch principal: `main`).
- Vercel: projeto `axtor-space` (team `joanderson-silvas-projects`). Deploy
  automático a partir do `main`. ESTE é o CI/CD. Lovable NÃO é mais usado.
- O que está no ar = último commit no `main`.

## Ambientes Supabase

- Produção (REAL): ref `pybgqassjzcynzaakzhz` (projeto nomeado `axtor-staging`,
  org `imuxrxdghkwbpgdxpttr`, sa-east-1). O nome ainda não foi trocado, mas
  é o banco vivo (confirmado por dados reais + env do Vercel).
- `config.toml` e `.env` alinhados para esse ref (PR #142).
- `bdxkcfngskagriaapepo` = projeto ANTIGO. Não usar. Ainda serve os logos dos
  emails (ver pendência A4).

## Stack

React 18 + TypeScript + Vite 8 + Tailwind + shadcn/ui + Supabase. Mobile-first.
RLS sempre ativa. Sem emoji em UI, sem visual de chatbot.

## Estética

Gold-noir Axtor: `#c9a84c` sobre `#0d0d0d`, display Cormorant Garamond, corpo
Helvetica. Aplicar também em emails. Modo claro e ThemeToggle removidos (PR #118).

## Estado atual — o que está pronto e no ar

- Auth completo (signup, login, forgot/reset, sessão segura).
- Bio/link na bio: templates por nicho, tema ao vivo, player ambiente (20 faixas CC0).
- Página de captura: foto própria, crop, checklist, link por slug.
- Diagnóstico imersivo (Deep Funnel): IA, página pública, resultado + CTA, edição de briefing.
- Loja `/loja`: checkout Pix via Asaas, addons, controle por plano.
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

## Resolvido em 2026-06-09 (auditoria)

- A2 config no banco certo (#142) · A1 RLS deep_diagnostics escopada (#144)
  · M1 listagem de buckets públicos removida (#144) · B1 search_path (#144)
  · A3 texto migrado p/ Anthropic (#145) · A3 imagem desativada (#146)
  · deps: npm audit fix, 0 vulnerabilidades (#147) · build Vite 8 verde.

## Pendências conhecidas

- M2: ativar "leaked password protection" no painel Supabase (Auth). Ação do dono.
- A4: emails ainda puxam logo do projeto antigo (bdxkcfngskagriaapepo). Migrar
  assets pro bucket de produção antes de repontar os 10 templates.
- B2/B3/B4/B5: higiene de baixa prioridade, sem risco de produção (ver auditoria).
- Cópia local pode estar atrasada vs `main`: `git pull` antes de codar.

## Ponteiros

- Fixes de hoje: [docs/CHECKPOINT-2026-06-09-auditoria-fixes.md](docs/CHECKPOINT-2026-06-09-auditoria-fixes.md)
- Auditoria completa: [docs/AUDITORIA-2026-06-09.md](docs/AUDITORIA-2026-06-09.md)
- Estado até #140: [docs/CHECKPOINT-2026-06-09.md](docs/CHECKPOINT-2026-06-09.md)
- Memórias temáticas: [mem/index.md](mem/index.md)
- Regras do agente: [CLAUDE.md](CLAUDE.md)
