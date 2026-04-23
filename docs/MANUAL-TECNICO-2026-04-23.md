# Manual Técnico — Axtor / link-essence-suite

**Versão:** 2026-04-23  
**Domínio app:** https://axtor.space  
**Domínio sender:** notify.axtor.space (verificado ✅)  
**Stack:** React 18 + Vite 5 + Tailwind v3 + TS 5 + Supabase (Lovable Cloud) + Edge Functions Deno

---

## Parte 1 — Visão geral

Plataforma multi-tenant que entrega 3 produtos em um:

1. **Link-in-bio premium** (`/:slug`) — página pública gold-noir com blocos, categorias, QR code, ambient player, métricas.
2. **Diagnóstico Instagram** (`/`) — landing → form → análise IA com Apify+Gemini+GPT, resultado em `/share/:id`.
3. **Painel admin** (`/admin/*`) — CRUD bio, analytics por tenant, convites, templates, melhorias IA, métricas por bloco.

Cada conta = 1 tenant (até 3 por usuário). Plano free vs partner/tester (via invite).

---

## Parte 2 — Arquitetura

```
Browser ──HTTPS──▶ React SPA (Vite) ──supabase-js──▶ Supabase (Lovable Cloud)
                                                      ├─ Auth (JWT)
                                                      ├─ Postgres (RLS + RPCs SECDEF)
                                                      ├─ Storage (avatars/icons/covers)
                                                      ├─ pgmq queues
                                                      └─ pg_cron (5s drainer)
                                                            │
                                          invokes ──────────┴────────── webhook Auth
                                            │                                  │
                                            ▼                                  ▼
                                    Edge Functions (Deno)            auth-email-hook
                                            │
                          ┌─────────────────┼──────────────┬─────────────┐
                          ▼                 ▼              ▼             ▼
                       Apify          Lovable AI       Mailgun      Storage
                    (IG scrape)      (Gemini/GPT)    (notify.       (avatars)
                                                      axtor.space)
```

### Camadas

- `src/pages/*` — Telas roteadas
- `src/components/*` — UI reutilizável + shadcn em `ui/`
- `src/hooks/*` — Auth, tenant, plan limits
- `src/lib/*` — Analytics tracker, validators, bioTemplates
- `src/integrations/supabase/*` — client + types (gerados, read-only)
- `supabase/functions/*` — Backend serverless
- `supabase/functions/_shared/*` — React Email templates

### Roteamento (`src/App.tsx`)

- `/` Landing (público)
- `/:slug` Bio público (resolve tenant)
- `/share/:id` Resultado diagnóstico (público)
- `/r/:slug` Redirect campanha
- `/signup`, `/admin/login`, `/forgot-password`, `/reset-password`, `/reset-session`, `/unsubscribe` — públicos
- `/admin` (Admin), `/admin/analytics`, `/admin/invites`, `/admin/templates`, `/admin/diagnostics`, `/admin/improvements`, `/admin/block-metrics` — autenticado/admin

---

## Parte 3 — Banco de dados (públicas, todas com RLS)

- `tenants` — Conta/marca. Dono lê/edita; admin tudo.
- `user_roles` — Papéis (admin/user/tenant_owner). **Tabela separada de profiles** (anti privilege-escalation). Self read.
- `bio_config` — Header da bio (1 por tenant). tenant_owner.
- `bio_blocks` — Links/produtos. tenant_owner; público lê se `is_active`.
- `bio_categories` — Agrupamento.
- `bio_block_campaigns` — Slugs `/r/:slug` com UTM.
- `bio_clicks` — Analytics de clique (insert público; read tenant_owner).
- `bio_themes` — Presets visuais (gold-noir, ivory-gold). Público read.
- `bio_icon_generations` — Histórico ícones IA.
- `page_views` / `funnel_events` — Analytics (insert público).
- `diagnostics` — Resultado análise IG (read via RPC pública).
- `leads` — Lead do diagnóstico (read admin).
- `improvement_runs` / `improvement_recommendations` — Sugestões IA. tenant_owner.
- `invite_codes` — Códigos partner/tester. Admin manage.
- `client_error_log` — Erros React.
- `user_feedback` — Feedback widget.
- `email_send_log` — Audit emails (append-only). Service role.
- `email_send_state` — Config throughput. Service role.
- `suppressed_emails` — Bounces/unsub. Service role.
- `email_unsubscribe_tokens` — 1 token por email. Service role.

### Funções SECURITY DEFINER

- `has_role(uid, role)` — anti-recursão RLS
- `is_tenant_owner(tenant_id)` — gating admin
- `resolve_tenant_by_slug(slug)` — Bio pública
- `resolve_campaign(slug)` — incrementa clicks + retorna URL+UTM
- `check_slug_available(slug)` — valida + lista reservados
- `validate_invite_code(code, email)` — pre-check no signup
- `create_tenant_for_user(slug, name, invite?)` — cria tenant + bio_config + consome invite atomicamente (FOR UPDATE)
- `get_diagnostic_public(id)` — leitura pública sem expor email
- `get_analytics_summary(_days)` — admin global
- `get_tenant_analytics(_tenant_id, _days)` — escopado por tenant
- `get_block_analytics(_block_id, _days)` — drill-down
- `enqueue_email/read_email_batch/delete_email/move_to_dlq` — wrappers pgmq
- `enforce_free_plan_block_limit` — trigger validador (não CHECK — permite mudança no tempo)

### Storage buckets
- `avatars` (público) — foto de perfil
- `block-icons` (público) — ícones gerados
- `bio-covers` (público) — capa header

---

## Parte 4 — Auth & sessão

`src/hooks/useAuth.tsx` regra absoluta:
1. `supabase.auth.getSession()` na montagem
2. `supabase.auth.onAuthStateChange()` ouvinte
3. Estado `sessionResolved` — UI **nunca** redireciona/desloga antes disso
4. Hard refresh **nunca** desloga (apenas `signOut()` explícito)

Recovery: `/forgot-password` → `resetPasswordForEmail()` → `auth-email-hook` enfileira → Mailgun → link `/reset-password` valida `recovery` token.

Roles em `user_roles` (tabela separada). `has_role()` SECURITY DEFINER.

---

## Parte 5 — Multi-tenant

- `useCurrentTenant.tsx` resolve tenant ativo do usuário (primeiro `tenants.owner_user_id = uid`).
- `usePlanLimits.tsx` lê `tenants.plan_limits` (jsonb) → `maxBlocks`, `analytics`, `campaigns`, etc.
- `TenantSelector` permite trocar entre tenants.
- `AdminInvites.tsx`: ao criar invite para email X, **revoga automaticamente todos os pendentes** desse email (idempotência).
- `create_tenant_for_user` impõe limite de 3 tenants/usuário e consome invite atomicamente.

---

## Parte 6 — Bio (link-in-bio)

- `Bio.tsx` — render público. Resolve `:slug` → `bio_config` + `bio_blocks` ativos + categorias.
- `Admin.tsx` — CRUD cabeçalho + blocos (label, url, icon, badge, highlight, size, brand color toggle, draft/publish).
- `BioTemplatePicker` aplica preset de `lib/bioTemplates.ts` (coach, artist, ecommerce, infoproduct).
- `QRCodeDialog` — PNG/SVG com logo Axtor central.
- `AmbientPlayer` — trilha sonora opcional.
- `BlockMetricsBadge` — hover mostra clicks 24h/7d/30d.
- Themes: `gold-noir` (default) + `ivory-gold`. Toggle persistido.
- Campanhas: `CampaignManager` cria slug `/r/:slug` com UTM.

---

## Parte 7 — Diagnóstico Instagram

Funil:
1. Landing → form (`@handle` + email opcional)
2. `funnel_events` registra cada step
3. `analyze-instagram` edge fn:
   - Cache 12h por handle
   - Rate limit 3/semana por session_id
   - Apify scrape perfil + posts
   - Lovable AI (gemini-2.5-pro fallback gpt-5) → scores + insights + summary
   - Persona: estrategista de mercado em PT-BR
4. Resultado em `diagnostics` + lead em `leads`
5. `/share/:id` lê via `get_diagnostic_public(id)` (sem expor email)

---

## Parte 8 — Sistema de Email ⭐

### Infra
- 2 pgmq queues: `auth_emails` (alta prio) + `transactional_emails`
- Drainer `process-email-queue` cron 5s, batch 10, delay 200ms (~120/min)
- DLQ automática após 5 retries
- TTL: 15min auth, 60min transacional
- Backoff em 429/5xx (`retry_after_until`)
- Suppression list bloqueia bounces/complaints/unsub (fail-closed)

### Templates auth (6) — PT-BR gold-noir
`supabase/functions/_shared/email-templates/`: signup, recovery, magic-link, invite, email-change, reauthentication

### Templates transacionais (3)
`supabase/functions/_shared/transactional-email-templates/`: partner-invite, tester-invite, welcome-tenant
Registro: `registry.ts` (export `template` satisfies `TemplateEntry`).

### DNS
- `axtor.space` → zone Cloudflare (root)
- `notify.axtor.space NS ns3.lovable.cloud, ns4.lovable.cloud` → zone gerenciada pela Lovable (SPF/DKIM/MX)

### Sender
- Domain: `notify.axtor.space` (verificado ✅)
- From: `link-essence-suite <noreply@notify.axtor.space>`

### Throughput tuning
`UPDATE email_send_state SET batch_size=50, send_delay_ms=50 WHERE id=1` → ~600/min. Não precisa redeploy.

---

## Parte 9 — Edge Functions

- `analyze-instagram` (verify_jwt=false) — scrape+IA
- `auth-email-hook` (false) — webhook Supabase Auth, enfileira email auth
- `send-transactional-email` (true) — invoke autenticado, enfileira transac.
- `process-email-queue` (true) — pg_cron 5s, drena queues
- `handle-email-suppression` (false) — webhook Mailgun, upsert `suppressed_emails`
- `handle-email-unsubscribe` (false) — `/unsubscribe`, valida token
- `preview-transactional-email` (false) — render HTML pra dashboard
- `proxy-image` (false) — proxy imagens externas (CORS)
- `generate-icon` (true) — Lovable AI image
- `generate-improvements` (true) — Lovable AI text

Secrets: `LOVABLE_API_KEY`, `APIFY_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (todos ✅).

---

## Parte 10 — Páginas admin

- `/admin` — CRUD bio + onboarding checklist + tenant selector
- `/admin/analytics` — KPIs do tenant via `get_tenant_analytics`
- `/admin/invites` — Gera invites partner/tester (idempotente)
- `/admin/templates` — Gestão presets bio
- `/admin/diagnostics` — Lista leads + diagnósticos
- `/admin/improvements` — Sugestões IA aplicáveis
- `/admin/block-metrics` — Drill-down clicks por bloco

---

## Parte 11 — Segurança

- RLS em todas tabelas com dados sensíveis
- Roles em tabela separada (`user_roles`)
- Storage com prefixo do tenant (path-scoped)
- Validação upload: 5MB max, content-type whitelist
- Webhook signature: `@lovable.dev/webhooks-js` (HMAC + timestamp)
- Suppression fail-closed (se check falhar, NÃO envia)
- `client_error_log` insert-only para anônimos
- Rate limit diagnóstico: 3/semana por session_id
- Trigger `enforce_free_plan_block_limit` (não CHECK)

---

## Parte 12 — Memórias & regras

`mem://index.md` Core:
- PT-BR sempre
- Auth: nunca forçar logout antes de getSession resolver
- Estética gold-noir (#c9a84c em #0d0d0d, Cormorant + Helvetica)
- Grep antes de implementar (sem duplicar)
- Manter CHECKPOINT atualizado

Memórias: auth-session, email-branding, **email-infra (novo)**, onboarding, bio-templates, invite-idempotency, qr-code, tenant-analytics, ambient-player, design rules.

---

## Parte 13 — Resultado teste end-to-end (2026-04-23)

| Pré-requisito | Status |
|---|---|
| Domain `notify.axtor.space` | ✅ Verified |
| `auth-email-hook` deployed | ✅ |
| `process-email-queue` cron | ✅ rodando |
| Emails habilitados | ✅ Religado nesta sessão |
| Último envio anterior | DLQ por "Emails disabled" — resolvido |

**Testes manuais a executar:**
1. Signup novo em `/signup` → conferir caixa
2. `/forgot-password` → conferir email reset
3. `/admin/invites` → criar invite tester → conferir chegada

Validação SQL após cada teste:
```sql
SELECT DISTINCT ON (message_id) template_name, recipient_email, status, error_message, created_at
FROM email_send_log WHERE message_id IS NOT NULL
ORDER BY message_id, created_at DESC LIMIT 10;
```

Status esperado: `sent`. Se `dlq`/`failed`, ler `error_message`.

---

## Parte 14 — Próximos passos sugeridos

1. **Code-splitting** — chunk principal grande, usar `React.lazy` nas páginas admin
2. **Verificar publicação** apontando pra `axtor.space` (já tá ativo no preview)
3. **Cron resumo semanal por tenant** (email transacional novo)
4. **SEO dinâmico por tenant** — `<title>`/OG no `/:slug`
5. **Diagnóstico paterno como produto pago** — paywall + Stripe
6. **Dashboard de email** (`email_send_log` deduped por message_id) para admin

---

_Manual gerado — fonte de verdade: código + memórias `mem://`._
