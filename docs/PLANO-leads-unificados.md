# Plano — Leads Unificados (dedup + painel + notificação)

> Status: Fase A APLICADA (banco). Fases B (edge functions) e C (painel) pendentes.
> Objetivo: 1 contato por pessoa, com o histórico dos diagnósticos (Instagram +
> imersivo), sem duplicar dado pessoal, sem desperdiçar email, e visível no painel.

## 1. Problema (hoje)

- `analyze-instagram` faz `INSERT` de um lead novo em **toda** captura (sem dedup).
- O imersivo (`analyze-deep`) guarda os dados do lead **inline** em `deep_diagnostics`.
- A aba "Leads" do painel (`useLeads`) lê **só `deep_diagnostics`** (imersivo).
- Resultado: leads de Instagram **invisíveis** no painel; quem faz os dois
  diagnósticos vira 2 registros + 2 emails (desperdício).

## 2. O que já existe (descoberta no schema)

- **`leads`** = a pessoa: `id, full_name, email, phone, instagram_handle, source,
  utm_source/medium/campaign, tenant_id, created_at, updated_at, profile_is_private`.
- **`diagnostics`** (Instagram) tem **`lead_id` → leads** (todos preenchidos).
- **`deep_diagnostics`** (imersivo) **tem `lead_id`** (mas estava SEMPRE nulo) +
  guarda `lead_name/lead_email/lead_phone` inline + `answers`, `pain_scores`,
  `pain_detected`, `ai_veredict`, `recommended_product_id`.

`leads` já é o "contato" compartilhado. Só não estava deduplicado, o imersivo não
preenchia `lead_id`, e o painel lia a tabela errada.

## 3. Decisão de arquitetura (aprovada)

**Usar `leads` como o contato único** (1 linha por pessoa, por tenant). Os dois
diagnósticos ligam nela via `lead_id`. **Sem tabela `contacts` nova.**
Identidade = `(tenant_id, lower(email))`. Sem email → fallback telefone.

## 4. Banco — Fase A (APLICADA em prod 2026-06-13)

Migration `20260613060000_leads_unificados_fase_a.sql` (via conector, transacional, com backups `_bak_*_20260613`):

- Colunas em `leads`: `status` (`novo|quente|cliente|descartado`), `last_activity_at`, `diagnostics_count`.
- Dedup por `(tenant, lower(email))`, mestre = mais antigo; religou `diagnostics.lead_id`; apagou duplicados. **95 → 43 contatos**, 0 diagnóstico perdido.
- Backfill imersivo (com email): ligou 9 `deep_diagnostics` a contatos (3 existentes + 6 órfãos viraram contato). Os 21 sem email ficaram intactos.
- Recalculou `diagnostics_count`/`last_activity_at`; marcou **"quente"** quem tem 2+ (17).
- **Índice único `(tenant, lower(email))` ADIADO pra Fase B** — com o `INSERT` puro atual ele quebraria leads recorrentes; entra junto do upsert.

## 5. Captura: upsert + política de notificação — Fase B (pendente)

Vale pras DUAS edge functions (`analyze-instagram` e `analyze-deep`):

1. **Upsert do contato** por `(tenant, lower(email))`:
   - **Novo** → cria, `diagnostics_count=1`, `source`/`utm` preenchidos. **Notifica o dono por email**.
   - **Existente** → NÃO duplica. Atualiza `last_activity_at`, incrementa contagem, enriquece campos vazios.
     - Diagnóstico de **tipo diferente** do que já tinha → `status='quente'` e **NÃO manda 2º email**.
     - **Duplicata exata** (mesmo tipo, dados idênticos, janela curta) → no-op.
2. **Liga o diagnóstico ao contato**: `diagnostics.lead_id` (já faz) e `deep_diagnostics.lead_id` (passar a setar) no mesmo `leads.id`.
3. Resultado/contexto continua na tabela de cada diagnóstico; o contato acumula histórico via `lead_id`.
4. **Reintroduzir o índice único** `(tenant, lower(email))` junto deste deploy.

Notificação ao dono = só no 1º contato. "Voltou e aprofundou" = badge **"quente"** no painel, não email. (Decisão do dono.)

## 6. Painel — Fase C (pendente)

- `useLeads` passa a ler **`leads`** (contatos), não `deep_diagnostics`.
- 1 linha por pessoa: nome, email, telefone, @, **origem** (source/utm), **status** (badge "quente"), nº de diagnósticos, última atividade.
- Abrir contato → histórico dos diagnósticos (Instagram e/ou imersivo) por `lead_id`.
- Devolve os leads de Instagram que sumiram do painel.

## 7. Riscos

- Dedup é destrutiva (feita; backups `_bak_*` guardados — limpar depois de validar).
- Índice único só com upsert (senão quebra `INSERT` atual) — por isso adiado pra Fase B.
- Pessoas sem email (telefone só) — fallback de identidade a definir na Fase B.
- Ao passar o imersivo a setar `lead_id`, conferir que nada que lê `deep_diagnostics` inline quebra.

## 8. Checklist de qualidade (por fase)

- [x] Fase A: contagem antes/depois (95→43), nenhum diagnóstico perdido (89→89), 0 duplicado restante.
- [ ] Fase B: 3 trilhas de notificação (novo / aprofundou / duplicata exata); índice único reintroduzido.
- [ ] Fase C: painel 1 linha/contato, histórico, origem, badge quente.
- [ ] Docs atualizados ao fechar cada fase.
