

# Fase 3 — Onboarding self-service (decisões registradas)

## Decisões aprovadas

**1. Acesso:** Signup aberto em `/signup` — qualquer pessoa cria conta + tenant + bio em segundos.

**2. Plano Free com limites visíveis:**
- Máximo **3 blocos ativos** (4º em diante fica criado mas desativado/bloqueado)
- **Sem analytics** — botão Analytics no admin fica visível mas desabilitado/apagado com cadeado e tooltip "Disponível no plano Pro"
- **Badge obrigatório** "feito com axtor" no rodapé da bio pública
- **Sem campanhas UTM, sem improvements AI, sem temas customizados**
- Upgrade desbloqueia tudo (Stripe entra na Fase 5; até lá, upgrade é manual via super-admin)

**3. Slug:** modelo profissional — campo livre no signup com **sugestão automática a partir do nome** (ex: "Maria Silva" → `maria-silva`), validação em tempo real (disponível/ocupado/inválido), mínimo 3 caracteres, regex `[a-z0-9-]`, lista de reservados bloqueada (`admin`, `bio`, `auth`, `api`, `signup`, `login`, `r`, `d`, `www`, etc).

---

## O que vou construir

### A) Banco de dados (1 migration)
- Adicionar colunas em `tenants`: `plan_limits jsonb` (default `{"max_blocks": 3, "analytics": false, "campaigns": false, "improvements": false, "themes": false, "show_badge": true}`)
- Função `check_slug_available(_slug text) returns boolean` (security definer, valida formato + reservados + unicidade)
- Função `create_tenant_for_user(_slug, _display_name) returns uuid` (security definer; cria tenant com `owner_user_id = auth.uid()`, plano `free`, `bio_config` inicial padrão, retorna id)
- Trigger em `bio_blocks` que valida limite de 3 blocos ativos para tenants no plano `free` antes de inserir/ativar

### B) Páginas novas
- **`/signup`** — formulário: nome completo, email, senha, slug (com debounce + check de disponibilidade visual ✅/❌), aceite de termos. Após signup: chama `create_tenant_for_user`, mostra "bio criada em axtor.space/{slug}" com botão "ir pro admin" e "ver minha bio".
- **`/login`** já existe (`/admin/login`) — adicionar link "criar conta" apontando pra `/signup`.

### C) Gating de features no app
- Hook novo `usePlanLimits()` lê `current_tenant.plan_limits` e expõe `{ canAddBlock, canUseAnalytics, canUseCampaigns, canUseImprovements, showBadge, blocksRemaining }`
- **Admin.tsx**: botão "novo bloco" desabilitado quando `!canAddBlock`, com tooltip "Limite do plano Free: 3 blocos. Faça upgrade para adicionar mais."
- **Sidebar/header do admin**: itens "Analytics", "Campanhas", "Improvements", "Templates" ficam com ícone de cadeado + opacidade reduzida + onclick abre modal de upgrade, em vez de navegar
- **Bio.tsx**: se `showBadge`, renderiza no rodapé um pequeno "feito com **axtor**" linkado pra `axtor.space`

### D) Modal de upgrade reutilizável
- `<UpgradeModal feature="analytics" />` — explica o que desbloqueia, botão "fazer upgrade" (por enquanto abre WhatsApp/email pra você; Stripe na Fase 5)

### E) Landing em `axtor.space/`
- Página simples de captação: hero "Sua bio profissional em segundos", CTA "criar grátis" → `/signup`, exemplo visual da bio, lista de features, comparativo Free vs Pro
- Substitui o `Index.tsx` atual (ou cria nova rota e move a antiga pra `/old`)

---

## Arquivos afetados

**Novos:**
- `supabase/migrations/{timestamp}_signup_and_plan_limits.sql`
- `src/pages/Signup.tsx`
- `src/pages/Landing.tsx` (substitui ou complementa Index)
- `src/hooks/usePlanLimits.tsx`
- `src/components/UpgradeModal.tsx`
- `src/components/PlanBadge.tsx`

**Editados:**
- `src/App.tsx` — rotas `/signup` e revisão da `/`
- `src/pages/Admin.tsx` — gating do botão "novo bloco"
- `src/pages/AdminAnalytics.tsx`, `AdminTemplates.tsx`, `AdminImprovements.tsx`, `CampaignManager.tsx` — bloqueio com modal
- `src/pages/Bio.tsx` — badge condicional no rodapé
- `src/pages/AdminLogin.tsx` — link "criar conta"

---

## Fora de escopo (próximas fases)

- Stripe / checkout real → **Fase 5**
- Custom domain por cliente → **Fase 4**
- Convites de equipe / multi-owner → **Fase 6**
- Onboarding wizard guiado pós-signup (templates prontos) → opcional, depois

---

## Pergunta única antes de começar

Qual **email/WhatsApp** você quer que apareça no botão "fazer upgrade" do modal (até Stripe entrar)? Se quiser, posso deixar um placeholder `contato@axtor.space` e você troca depois.

