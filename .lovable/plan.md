

# Diagnóstico Profundo — v5 (Final)

Mesma arquitetura da v4, com **uma única mudança de gating**: parceiros (`partner`) e beta-testers (`tester`) já saem da criação da conta com o módulo desbloqueado. Free e futuros planos pagos comuns precisam comprar o upsell.

## Regra de acesso (única mudança vs v4)

| Plano do tenant | Diagnóstico Profundo |
|---|---|
| `partner` | ✅ liberado automático no signup (vitalício) |
| `tester` | ✅ liberado automático no signup (vitalício) |
| `free` | 🔒 vê demo + CTA de compra |
| `pro` (futuro pago) | 🔒 vê demo + CTA de compra |

Implementação: a função `has_addon(_tenant_id, 'deep_diagnostic')` retorna `true` automaticamente quando `tenants.plan IN ('partner','tester')`, sem precisar de linha em `tenant_addons`. Para os outros, lê de `tenant_addons`.

```sql
-- Pseudo-lógica da função
SELECT
  CASE
    WHEN t.plan IN ('partner','tester') THEN true
    ELSE EXISTS (
      SELECT 1 FROM tenant_addons
      WHERE tenant_id = _tenant_id
        AND addon_slug = _addon_slug
        AND status = 'active'
    )
  END
FROM tenants t WHERE t.id = _tenant_id
```

Resultado: Stefany cria conta com invite partner → entra no `/admin` → aba **Diagnóstico Profundo** já destravada → vai direto pro briefing. Sem checkout, sem demo de venda no caminho dela.

## Resto do plano (inalterado da v4)

**Banco** — migration cria:
- `tenant_addons` (id, tenant_id, addon_slug, status, purchase_type, stripe_subscription_id, stripe_customer_id, activated_at, expires_at)
- `deep_funnels` (briefing, mídia de boas-vindas, lock_until_media_ends, allow_skip_after_seconds, is_published)
- `deep_funnel_questions` (texto, tipo, opções com pain_weights, mídia opcional, lock_until_media_ends)
- `deep_funnel_products` (5 produtos, pain_tag, whatsapp_template, mídia de resultado)
- `deep_diagnostics` (execuções: respostas, scores, dor detectada, produto, veredicto IA)
- Coluna `whatsapp_number` em `tenants`
- Função `has_addon()` com bypass partner/tester
- Trigger em `deep_funnels` bloqueia publicar sem `has_addon`
- Bucket `deep-diagnostic-media` (público, prefixo `tenant_id/funnel_id/`)

**Edge Functions:**
- `generate-deep-funnel` (gemini-2.5-pro, 1x por funil) — recebe briefing, gera 12 perguntas + opções com pain_weights + match dor→produto. Valida `has_addon` antes.
- `analyze-deep` (gemini-3-flash-preview, 1x por lead) — recebe respostas + pain_scores calculados client-side + perfil IG opcional → escolhe produto + escreve veredicto persuasivo
- `create-deep-checkout` (Stripe) — só pra free/pago comum
- `stripe-webhook` — ativa/cancela em `tenant_addons`

**IA — só 2 chamadas, custo controlado:** durante o quiz é zero IA (pesos somados no client). Custo de ~R$ 20 por 10k leads.

**Frontend:**
- `/admin` ganha card "Diagnóstico Profundo" — pra partner/tester leva direto pro editor; pra free/pago comum leva pra demo
- `/admin/deep-diagnostic/demo` — funil demo de 8 perguntas com placeholders de mídia, fechando em página tipo VSL com 2 preços + WhatsApp
- `/admin/deep-diagnostic` — editor: briefing (10-15 campos) → loading IA → revisar/editar perguntas (drag-drop, opções, pesos, anexar mídia, toggle "destravar só após mídia") → editar produtos → publicar
- `/admin/deep-diagnostic/success` — pós-checkout
- `/d/funnel/:slug` (público) — quiz progressivo, lock até mídia terminar (com botão "pular em Xs" opcional), tela final com produto + mídia + WhatsApp
- Bloco novo `kind: 'deep_funnel'` em `bio_blocks` — card destacado na bio

**Mídia (regra confirmada):**
- Só o **dono** anexa mídia (foto/vídeo/áudio) em boas-vindas, qualquer pergunta e tela final
- Lead **não** faz upload — só responde por clique
- Quando `lock_until_media_ends=true`, opções ficam disabled até `onEnded` do player (countdown "pular em Xs" se permitido)

**Pagamento (Stripe seamless via Lovable Payments):** continua só pra free/pago comum. Modelos: one-time desbloqueia 1 funil ativo permanente, ou subscription mensal com funis ilimitados.

**Analytics:** eventos novos em `funnel_events` — `deep_funnel_started`, `_question_answered`, `_media_completed`, `_completed`, `_whatsapp_clicked`, `_product_viewed`, `demo_started`, `demo_finished`, `demo_checkout_clicked`. Painel `/admin/deep-diagnostic/analytics` mostra taxa de conclusão, abandono por pergunta, dor mais comum, produto mais recomendado.

## Pré-requisitos antes de eu começar

1. Plano Pro do projeto Lovable (necessário pra Lovable Payments)
2. Confirmar modelo de cobrança pros free: one-time, subscription, ou os dois? (default: os dois)
3. Faixa de preço inicial (rascunho — você ajusta depois)

## Ordem de execução quando aprovado

1. Migration: `tenant_addons` + `has_addon()` com bypass partner/tester + trigger gating + tabelas do funil + coluna `whatsapp_number`
2. Bucket `deep-diagnostic-media`
3. Edge functions (generate, analyze, checkout, webhook)
4. Habilitar Lovable Payments (Stripe) — passo separado, peço confirmação na hora
5. Cadastrar produtos Stripe (one-time + subscription)
6. Frontend: card descoberta + demo + editor + público + bloco bio
7. Teste end-to-end: criar conta partner (deve já abrir editor), criar conta free (deve abrir demo)

## Fora do escopo desta v1

- Editar resposta automática da IA (só template base do veredicto)
- Cobrar pelo diagnóstico do lead final (sempre grátis)
- Multi-idioma, A/B test, webhooks CRM
- Trial gratuito pra free (vai direto pra checkout)

