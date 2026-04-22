
# Próximo passo: Fase 1 do SaaS — fundação multi-tenant

Você escolheu seguir. Vou propor o caminho **(b) — só o essencial no banco agora**, sem refatorar a UI ainda. Motivo: é o passo mais barato que desbloqueia tudo o resto, e mantém seu site atual funcionando 100% sem mudança visível.

## O que será feito

### 1. Backup de segurança
Gerar dump SQL completo do banco atual em `/mnt/documents/backup-pre-saas-2026-04-22.sql` antes de qualquer mudança estrutural.

### 2. Criar tabela `tenants`
Cada tester vira uma linha aqui.

```text
tenants
├─ id            uuid (pk)
├─ slug          text unique  ← "joana", "pedro" (vira /t/joana)
├─ display_name  text
├─ owner_user_id uuid         ← quem loga no admin daquele tenant
├─ plan          text         ← "free" | "pro" (futuro)
├─ status        text         ← "active" | "suspended"
├─ created_at, updated_at
```

### 3. Criar tenant "joanderson" (você)
Migrar seus dados atuais pra dentro dele, sem perder nada.

### 4. Adicionar `tenant_id` nas tabelas que pertencem ao tenant
- `bio_config`, `bio_blocks`, `bio_categories`, `bio_block_campaigns`
- `leads`, `diagnostics`, `bio_clicks`, `funnel_events`, `page_views`
- `user_feedback`, `improvement_runs`, `improvement_recommendations`, `bio_icon_generations`

Backfill: tudo que existe hoje recebe o `tenant_id` do "joanderson".

### 5. Criar role `tenant_owner` + função `is_tenant_owner(tenant_id)`
Separar "super admin (você)" de "dono de tenant (tester)".

### 6. Reescrever RLS para isolar por tenant
Cada tester só enxerga os próprios dados. Você (super admin) continua vendo tudo.

### 7. Função `resolve_tenant_by_slug(slug)`
Usada pela rota pública `/t/:slug` pra carregar o bio certo.

## O que NÃO será feito agora (fica pra Fase 2)

- Refatorar `/bio`, `/admin`, `/admin/login` pra path-based `/t/:slug`
- Onboarding (cadastro de novo tester)
- Landing comercial em `axtor.space`
- Cobrança / planos pagos

Seu site continua **idêntico** depois dessa fase. A diferença é que o banco fica pronto pra receber múltiplos tenants quando a Fase 2 acontecer.

## Detalhes técnicos

- Migrações SQL idempotentes, em ordem: `tenants` → seed do tenant joanderson → `ALTER TABLE ADD COLUMN tenant_id` (nullable) → backfill → `SET NOT NULL` → FK → reescrita das policies RLS.
- `app_role` enum recebe valor novo `'tenant_owner'`.
- Função `is_tenant_owner(_tenant_id)` SECURITY DEFINER, mesmo padrão do `has_role` (sem recursão).
- Policies novas ficam no formato: `has_role(auth.uid(),'admin') OR is_tenant_owner(tenant_id)` para SELECT/UPDATE/DELETE; INSERT exige `is_tenant_owner(NEW.tenant_id)`.
- Tabelas públicas (`bio_clicks`, `funnel_events`, `page_views`, `user_feedback`) mantêm INSERT aberto pra anon, mas precisam receber `tenant_id` no payload — o frontend hoje sempre passa o seu, então sem quebra.

## Custo estimado

Baixo-médio. Uma migração grande + uma rodada de validação. Sem mudança de UI = sem ciclo de QA visual.

## Depois disso, próximas fases (só pra você visualizar, não vamos fazer agora)

- **Fase 2**: rota `/t/:slug` + admin path-based
- **Fase 3**: onboarding self-service de novo tester
- **Fase 4**: landing comercial em `axtor.space/`
- **Fase 5**: cobrança (Stripe)
