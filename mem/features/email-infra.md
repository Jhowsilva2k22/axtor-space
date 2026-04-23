---
name: email-infra
description: Infra de email completa (queues pgmq, sender notify.axtor.space, templates PT-BR gold-noir, DNS Cloudflare via Lovable NS)
type: feature
---

## Sender
- Domain: `notify.axtor.space` (verificado, NS delegado a ns3/ns4.lovable.cloud no Cloudflare)
- From: `link-essence-suite <noreply@notify.axtor.space>`
- Root domain: `axtor.space` (zone Cloudflare; subdomain `notify` gerenciado pela Lovable)

## Pipeline
`auth-email-hook` (verify_jwt=false, webhook Supabase Auth) **ou** `send-transactional-email` (verify_jwt=true, invoke client) → `enqueue_email(queue, payload)` → pgmq → `process-email-queue` (cron 5s, batch 10, delay 200ms = ~120/min) → Lovable Email API → Mailgun → inbox.

## Queues
- `auth_emails` (drenada primeiro, TTL 15min)
- `transactional_emails` (TTL 60min)
- DLQ após 5 retries
- Backoff 429/5xx via `email_send_state.retry_after_until`

## Templates
- Auth (6): `supabase/functions/_shared/email-templates/*.tsx` — signup, recovery, magic-link, invite, email-change, reauthentication
- Transacionais (3): `supabase/functions/_shared/transactional-email-templates/*.tsx` — partner-invite, tester-invite, welcome-tenant (registry.ts)
- Estilo: gold-noir (#c9a84c em #0d0d0d), Cormorant Garamond display + Helvetica body, body bg `#ffffff` (regra obrigatória), idioma PT-BR

## Tabelas
- `email_send_log` (append-only, deduplicar por `message_id`)
- `email_send_state` (single-row config: batch_size, send_delay_ms, TTL, retry_after_until)
- `suppressed_emails` (bounces/complaints/unsub — fail-closed se check falhar)
- `email_unsubscribe_tokens` (1 token por email, não por envio)

## Toggle
Toggle desliga TUDO (auth volta pro template default Lovable, transacionais retornam 403 `emails_disabled`). Em 2026-04-23 estava OFF e foi religado.

## Throughput tuning
`UPDATE email_send_state SET batch_size=50, send_delay_ms=50 WHERE id=1` → ~600/min. Não precisa redeploy.

## Regra ouro
Após editar qualquer arquivo em `supabase/functions/`, deploy obrigatório. Edge Function serve o último código deployado.
