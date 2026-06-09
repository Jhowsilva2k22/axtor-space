# Auditoria ponta a ponta — Axtor Space — 2026-06-09

Escopo: estado do `main` @ `c6dcc71` (produção). Banco auditado: projeto
conectado `pybgqassjzcynzaakzhz` — **confirmado como produção** pelos dados
reais (90 leads, 712 page_views, 647 funnel_events, 5 tenants, 84 diagnostics).

Severidade: ALTA = corrigir antes da próxima alteração. MÉDIA = corrigir em
seguida. BAIXA/INFO = higiene. Nada foi alterado nesta auditoria (só leitura).

---

## ALTA

### A1. RLS de `deep_diagnostics` permite UPDATE por qualquer anônimo
Policy `Anyone can update own session deep diagnostics` (UPDATE, roles
anon+authenticated) tem `USING true` e `WITH CHECK true`. O nome diz "own
session", mas não há escopo — **qualquer pessoa não autenticada pode editar
qualquer linha** de `deep_diagnostics` (29 registros de leads reais). Risco de
adulteração de dados de diagnóstico.
Correção: escopar o UPDATE por `session_id`/identificador do lead (ou remover o
UPDATE público e fazer via edge function com service_role).

### A2. Config do repo aponta para um Supabase diferente do de produção
`supabase/config.toml` (`project_id`) e `.env` apontam para
`bdxkcfngskagriaapepo`, mas a produção real é `pybgqassjzcynzaakzhz`
(`.env.local`). Risco concreto: rodar `supabase db push`/migration pelo CLI
mira o projeto errado/abandonado. 
Correção: confirmar o ref canônico, alinhar `config.toml` + `.env`, e conferir
que a env var `VITE_SUPABASE_URL` no Vercel (produção) aponta para
`pybgqassjzcynzaakzhz`.
STATUS 2026-06-09: RESOLVIDO (PR #142) — `config.toml` + `.env` alinhados para
`pybgqassjzcynzaakzhz`; env var do Vercel confirmada. Resta só o repoint dos
emails (ver A4).

### A4. "Cérebro dividido": branding de email no projeto Supabase antigo
O app/banco roda em `pybgqassjzcynzaakzhz`, mas **10 templates de email**
(signup, recovery, magic-link, invite, email-change, reauthentication,
partner-invite, tester-invite, welcome-tenant) carregam o logo/avatar de
`https://bdxkcfngskagriaapepo.supabase.co/.../email-assets/`. O bucket
`email-assets` da produção atual está **vazio** — ou seja, os emails dependem do
projeto antigo continuar vivo. Repontar sem antes migrar os assets quebra o logo.
Correção (ordem): 1) subir os assets (logo claro/escuro, avatar) pro bucket
`email-assets`/`avatars` de `pybgqassjzcynzaakzhz`; 2) repontar os 10 templates;
3) redeployar as edge functions e validar um email real.

### A3. Dependência de Lovable em funções vivas (você parou de usar Lovable)
Usam `LOVABLE_API_KEY` (gateway de IA da Lovable): `auth-email-hook`,
`generate-icon`, `generate-improvements`, `handle-email-suppression`,
`preview-transactional-email`. Se a chave/assinatura Lovable cair, essas quebram
— sendo `auth-email-hook` a mais crítica (emails de autenticação).
Observação: `analyze-deep`, `analyze-instagram` e `generate-deep-funnel` já usam
Anthropic direto (ANTHROPIC_API_KEY) — essas estão OK.
Correção: confirmar se `LOVABLE_API_KEY` ainda é válida ou migrar essas funções
para Anthropic direto.

---

## MÉDIA

### M1. Buckets públicos permitem listagem de arquivos
`bio-covers`, `deep-diagnostic-media`, `email-assets` têm SELECT amplo em
`storage.objects` que permite listar todos os arquivos. URL de objeto público
não precisa disso; expõe mais do que o necessário.
Correção: remover a policy de listagem ampla (manter só leitura por URL direta).

### M2. Proteção contra senha vazada desligada (Auth)
Supabase Auth pode checar senhas contra HaveIBeenPwned. Está desativado.
Correção: ativar no painel Auth (1 toggle).

### M3. Saúde de build não verificada + node_modules defasado
Não consegui buildar no sandbox (timeout + `node_modules` antigo pré-migração
Vite 8, PR #110). Precisa rodar local:
`npm install` → `npm run build` → typecheck. Reportar erros antes de codar.

---

## BAIXA / INFO

### B1. Função com search_path mutável
`public.update_conversation_status_timestamp` — definir `search_path` fixo.

### B2. Tabelas com RLS ativa e zero policies
`agent_config`, `contacts`, `conversation_status`, `sectors` (todas 0 linhas).
Travadas por padrão (seguro), mas parecem ser de CRM/atende-zap — decidir se
deveriam estar neste banco. Adicionar policies antes de usar.

### B3. ~50 funções SECURITY DEFINER executáveis por anon/authenticated
Maioria são RPCs públicas intencionais (ex: resolução de tenant por slug).
Revisar a lista para garantir que nenhuma expõe operação sensível.

### B5. `.env` commitado e anon key hardcoded em scripts de dev
`.env` está rastreado no git com a chave publishable; `check_db.ts` e
`check_full.ts` têm URL + anon key hardcoded. A chave é `anon` (pública,
protegida por RLS), risco baixo, mas a regra do projeto pede `.env` no
`.gitignore`. Higiene: mover `.env` pro gitignore (manter `.env.example`) e
limpar as keys dos scripts de dev.

### B4. 3 funções com CORS `'*'` hardcoded
`auth-email-hook` (webhook server-side), `handle-email-unsubscribe` (link
público), `preview-transactional-email` (admin). Baixo risco; normalizar para a
allowlist `_shared/cors.ts` por consistência.

---

## OK — sem ação (pontos fortes confirmados)

- RLS ativa nas 40 tabelas públicas.
- Isolamento multi-tenant correto em `leads` (só owner/admin), `tenants` (anon
  só lê funil publicado), `tenant_subscriptions` (sem escrita direta — só via
  webhook), `tenant_addons`.
- `asaas-webhook`: fail-closed (401 sem token) + idempotente via `webhook_events`.
- Nenhuma chave `service_role` exposta no frontend.
- Allowlist de CORS aplicada na maioria das edge functions.
- Deploy Vercel saudável; produção = PR #140; CI/CD automático do `main`.

---

## Ordem sugerida de correção

1. A2 (confirmar ref de produção) — RESOLVIDO (PR #142).
2. A1 (RLS deep_diagnostics) — fechar o buraco de escrita anônima.
3. A3 (dependência Lovable) — confirmar/migrar antes que quebre.
4. A4 (repoint dos emails, após migrar assets).
5. M1, M2 — rápidos.
6. M3 (build local) — antes de qualquer feature nova.
7. Baixa/info conforme houver tempo.
