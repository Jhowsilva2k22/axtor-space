# Checkpoint 2026-06-13 — Deploys alinhados, crédito no ar, autonomia (fases 1 + 2a)

## Contexto
Sessão de fechamento: garantir que nada da etapa anterior ficou pra trás (deploy,
merge, doc) antes de avançar. Regra firmada: **nunca passar de fase sem conferir
item a item cada deploy/merge/doc.**

## Deploys de edge function (prod, ref `pybgqassjzcynzaakzhz`)
Edge functions NAO sobem no merge — só o front via Vercel. Deploy é via CLI Supabase
(`npx supabase functions deploy <nome> --project-ref pybgqassjzcynzaakzhz`). Estavam
atrasadas vs `main`; redeployadas nesta sessão:

- `generate-deep-funnel` v29 — Fase 2a (num_perguntas / cenario / objetivo + destinos).
- `analyze-deep` v15 — débito de crédito do #158.
- `analyze-instagram` v21 — débito de crédito do #158.
- `proxy-image` v12 — CORS allowlist do #123.

## Crédito #158 AGORA ATIVO em prod
Cada diagnóstico consome 1 crédito do dono do tenant (RPC `consume_credits`,
saldo em `tenant_credits` = plan_balance + topup_balance):

- Instagram (`analyze-instagram`): sem saldo → lead RETIDO (status `no_credit`),
  não roda IA. Cache de 12h por @handle (não debita de novo se já analisado).
- Imersivo (`analyze-deep`): sem saldo → veredito-template (fallback), o lead
  nunca fica sem resposta; o dono é notificado.

## Merges
- #185 — Fase 2a do `generate-deep-funnel` (já estava no `main`; era cache stale do
  sandbox que indicava o contrário).
- #184 — Fase 1 autonomia (migration `20260613020000` já aplicada em prod + plano).
  Mergeado nesta sessão (squash).

## generate-icon
Confirmado DESATIVADO no front: `IconPicker` só renderiza a aba Biblioteca (Lucide).
`handleGenerate`/`supabase.functions.invoke("generate-icon")` existem, mas não há
gatilho na UI (sem `TabsTrigger` pra aba "ai"). É código morto. Não precisa deploy.
Limpar quando der.

## Próxima etapa — rota /diagnostico (lógica de atribuição)
Problema: o parceiro é identificado por `?utm_source=<slug>` (query param), frágil
(some em bio do Instagram, encurtador, recópia). Sem `utm`, o código cai em
`slug = "joanderson"` (Index.tsx:124) → mostra a marca Pai Presente, atribui o lead
ao tenant errado e, com crédito ligado, debita do tenant errado.

Plano (a detalhar em PR próprio): identidade do parceiro no PATH
(`/diagnostico/:slug`, como o resto do app), `/diagnostico` puro = `axtor-labs`
neutro, `?utm_source=` vira compatibilidade (não quebra links já espalhados).
Pré-requisitos: `axtor-labs` sem `whatsapp_number` e sem funil publicado; o
`ResultStep` tem fallbacks fixos de Pai Presente (Stefany/`stefany.mello_`/número)
que precisam ser neutralizados.

## Checklist de qualidade
- [x] Deploys conferidos via API (versões/timestamps atualizados hoje).
- [x] Merges conferidos via GitHub (fonte da verdade; cache do sandbox estava stale).
- [x] Crédito ativo confirmado em código (consumeCredits em analyze-deep/instagram).
- [x] Docs atualizados (este checkpoint + MEMORY.md).

## Riscos
- O `git status` do sandbox do agente é NÃO confiável (lock fantasma `.git/index.lock`,
  CRLF marcando todo arquivo como modificado). Confiar no GitHub/PowerShell, não no sandbox.
- Crédito ligado = conta free passa a bater no limite (comportamento projetado).
