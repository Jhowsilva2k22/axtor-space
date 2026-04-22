---
name: Tenant analytics
description: Analytics escopado por tenant via RPC get_tenant_analytics; owner vê só seus dados, admin troca via TenantSelector
type: feature
---
- RPC `get_tenant_analytics(_tenant_id uuid, _days int)` — autorização: `is_admin OR is_tenant_owner(_tenant_id)`
- Retorna mesma shape do antigo `get_analytics_summary` (page_views, sessões, cliques, leads, funil, top_blocks, utm, recent_leads) mas filtrado pelo tenant.
- `src/pages/AdminAnalytics.tsx` usa `useCurrentTenant()` pra pegar `current.id`. Admin troca tenant via `TenantSelector`.
- Header mostra `display_name · /slug` do tenant atual.
- Gating por plano (`plan.canUseAnalytics`) continua na UI do `/admin` — RPC só responde se for owner/admin.
