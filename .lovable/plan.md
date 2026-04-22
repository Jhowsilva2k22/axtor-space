# Fase 2 — Rota pública por subdomínio + Admin único

Decidido na Fase 1:
- **Público:** `joanderson.axtor.space` (subdomínio wildcard, padrão Linktree/Beacons/Vercel)
- **Admin:** `axtor.space/admin` único, detecta tenant pelo user logado (padrão Stripe/Linear/Notion)

## O que será feito

### 1. Resolver tenant pelo subdomínio (frontend)
Criar `useTenant()` hook que:
- Lê `window.location.hostname`
- Extrai subdomínio (`joanderson` de `joanderson.axtor.space`)
- Chama `resolve_tenant_by_slug(slug)` (já existe no banco)
- Expõe `{ tenant, loading, error }` pro app inteiro
- Casos especiais:
  - `axtor.space` / `www.axtor.space` → landing (Fase 4) ou redirect pro tenant default por enquanto
  - `id-preview-*.lovable.app` (ambiente Lovable) → usa `?tenant=slug` query string como fallback pra dev
  - `localhost` → usa `?tenant=slug` ou tenant default

### 2. Refatorar `Bio.tsx` pra usar tenant do contexto
Trocar todas as queries de `bio_config / bio_blocks / bio_categories` pra filtrar por `tenant_id` vindo do `useTenant()`. Hoje busca o singleton; vai passar a buscar pelo tenant resolvido.

### 3. Admin único em `/admin` detecta tenant pelo user logado
- `useAuth` já dá `user.id`
- Criar `useCurrentTenant()` que faz `SELECT * FROM tenants WHERE owner_user_id = auth.uid() AND status='active' LIMIT 1`
- Todas as páginas admin (`Admin`, `AdminAnalytics`, `AdminBlockMetrics`, `AdminTemplates`, `AdminImprovements`) passam a usar esse tenant como contexto pras queries
- Super admin (você, role `admin`) ganha um seletor de tenant no topo do painel pra trocar de visão (importante pra suporte)

### 4. Compatibilidade legada
- Rota `/bio` continua existindo: redireciona pra `https://joanderson.axtor.space` (subdomínio do tenant default)
- `/admin/login` continua igual

### 5. Wildcard DNS
- Adicionar registro DNS `*.axtor.space` apontando pra Lovable (mesmo IP do domínio principal)
- Lovable provisiona SSL wildcard automaticamente
- **Você precisa fazer essa etapa manual no painel do registrador** — vou te dar o passo-a-passo no fim

## O que NÃO será feito agora (fica pra fases seguintes)

- Onboarding self-service (Fase 3)
- Landing comercial em `axtor.space/` (Fase 4)
- Custom domain por tenant (Fase 5+)
- Cobrança Stripe (Fase 5)

## Detalhes técnicos

- `useTenant` cacheia o resultado em `sessionStorage` pra não chamar RPC em toda navegação
- Erro de tenant não encontrado → página 404 customizada ("Esta bio não existe ou foi desativada")
- Tenant `status != 'active'` → página de "suspenso"
- Hook usa React Query pra revalidar no foco da janela
- `useCurrentTenant()` no admin: se user é super admin E não é dono de nenhum tenant, mostra seletor obrigatório; se é dono de 1, vai direto; se é dono de vários, mostra seletor

## Custo estimado

Médio. Mexe em 6 páginas + cria 2 hooks novos + 1 ajuste DNS manual seu. Sem migração de banco (Fase 1 já preparou tudo). Uma rodada de QA visual no `/bio` via subdomínio + uma no `/admin`.

## Risco

Baixo. Se algo quebrar no subdomínio, `/bio` legado continua funcionando como fallback enquanto debugamos.

## Próximas fases (referência)

- **Fase 3**: onboarding self-service (`axtor.space/signup` → cria tenant + owner)
- **Fase 4**: landing comercial em `axtor.space/`
- **Fase 5**: custom domain + cobrança Stripe
