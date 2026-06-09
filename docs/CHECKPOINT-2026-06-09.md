# Checkpoint 2026-06-09 — Estado atual do `main` (@ PR #140)

Documentado a partir do GitHub `main` e da Vercel, não da cópia local (que
estava atrasada na data deste checkpoint). Fonte de verdade: produção.

## Marcos de produto e deploy

- Último commit no `main`: `a4dc256` — PR #140 — 2026-06-01.
- Último deploy de produção (Vercel, projeto `axtor-space`): 2026-06-01,
  estado READY, a partir do #140. O ar reflete o último commit.

## Changelog detalhado #81 → #140

Agrupado por área. Datas são de merge.

### Loja, pagamento e addons
- #140 addons bloqueados para sócios + leads sem UTM atribuídos ao tenant principal (06-01)
- #124 idempotência + fail closed no `ASAAS_WEBHOOK_TOKEN` (05-30)
- #122 conecta CTA Pro da landing ao checkout `/loja` (05-30)
- #113 corrige URL fallback stale do Supabase no checkout (05-29)

### Página de captura
- #139 exibe `capture_avatar_url` corretamente na página pública (05-31)
- #138 crop dialog + foto refletida na página pública (05-31)
- #137 foto separada para a página de captura (05-31)
- #136 link de captação baseado no slug do tenant (05-31)
- #134 CaptureSetupChecklist — orientação para campos vazios (05-31)
- #130 isola ambiente de edição da página de captura (05-31)
- #103 corrige handlers de destino do lead (crm/sheet/whatsapp) (05-29)
- #97 corrige link do empty-state de captura no MyLinksCard (05-28)

### Diagnóstico imersivo (Deep Funnel) e IA
- #129 limpa cache do lead ao concluir + autocomplete nos inputs (05-31)
- #128 corrige scroll jank no resultado (05-30)
- #127 filtro de profile + max_tokens 4096→1500 no analyze-instagram (05-30)
- #126 evita cache poisoning quando IA falha (05-30)
- #125 bio preview + CTA de cadastro Axtor no resultado (05-30)
- #83 dialog keep-products no fluxo de edição de funil (05-27)
- #82 garante que todo tenant tenha sempre um CTA clicável (05-27)
- #81 Onda H + editar briefing pré-populado (05-27)

### Painel do tenant
- #117 aplica tema ao vivo + edição de perfil + correções (05-30)
- #116 botão Voltar do Hub + validação real-time de slug (05-30)
- #115 edição de perfil e resumo de assinatura em Configurações (05-30)
- #111 botão 'Tentar novamente' no card de erro do Painel (05-29)
- #109 seleção de leads, exportar e deletar selecionados (05-29)
- #107 botão Limpar + tenant_id default (05-29)
- #104 aba Leads com tabela paginada de deep_diagnostics (05-29)
- #95 hook useMetrics para o dashboard de métricas (05-28)
- #84 configurações de conta + gerenciar convites (05-27)

### Admin
- #114 AdminHub + correções de tema (05-29)

### Onboarding
- #132 boas-vindas com mockup da capture page para usuários sem tenant (05-31)
- #94 fecha gaps do fluxo pós-cadastro (05-28)
- #92 auto-provisioning de tenant após confirmação de email (05-28)

### Temas e UI
- #131 auto-reload em chunk load error após novo deploy (05-31)
- #133 corrige tema no painel para usar tenant autenticado (05-31)
- #121 corrige fontes e carregamento do trio feminino (05-30)
- #120 trio feminino — Rosa Velvet, Lavanda, Marfim (05-30)
- #119 remove o tema Ivory Gold (05-30)
- #118 remove modo claro e ThemeToggle (05-30)
- #108 #101 #100 #99 #96 ajustes de tema/modo claro (05-28/29)
- #102 fontes e ajustes dos temas Copa Brasil (05-28)
- #98 normaliza URLs maiúsculas + tema no /painel (05-28)
- #93 renomeia botão flutuante de Sugerir para Suporte (05-28)
- #135 tic da caixinha de termos visível em fundo dourado (05-31)

### Bio e player
- #86 20 faixas CC0 reais no AmbientPlayer (05-27)
- #85 ritmo musical configurável por tenant (05-27)

### Segurança, legal e infra
- #123 restringe CORS de wildcard para allowlist em 6 edge functions (05-30)
- #112 remove acesso cross-tenant do useCurrentTenant (05-29)
- #91 Sentry — frontend + 4 edge functions (05-28)
- #89 restringe CORS delete-account para axtor.space (05-27)
- #88 rate limit por email + detecção de padrão suspeito (05-27)
- #87 rodapé legal + páginas Termos e Privacidade (05-27)

### Build e housekeeping
- #110 migra para Vite 8 e remove lovable-tagger (05-29)
- #106 adiciona CLAUDE.md e limpa gitignore (05-29)
- #105 remove xlsx, otimiza bundle, export para CSV puro (05-29)
- #90 .env.example + script typecheck (05-28)

> Ondas anteriores (#32–#80, abril) consolidadas em mem/ (onda3 RBAC/painel/
> captura, onda4 funil atômico) e no MANUAL-TECNICO-2026-04-23. Não
> re-enumeradas aqui individualmente.

## Migrations desde 2026-04-24 (supabase/migrations)

- 20260428045500_tenant_addons.sql
- 20260526120000_whatsapp_numbers.sql
- 20260526120001_deep_funnels_whatsapp_number_id.sql
- 20260526130000_storage_avatars_authenticated_policy.sql
- 20260528120000_copa_themes.sql
- 20260528200000_copa_themes_fonts.sql
- 20260528220000_fix_leads_tenant_id_default.sql
- 20260530120000_remove_ivory_gold_theme.sql
- 20260530140000_feminine_themes.sql
- 20260530150000_webhook_events.sql
- 20260531120000_capture_content_fields.sql
- 20260601120000_backfill_leads_null_tenant_id.sql

## Inventário de páginas (src/pages)

Admin, AdminAnalytics, AdminBlockMetrics, AdminDiagnostics, AdminHub,
AdminImprovements, AdminInvites, AdminLandingPartners, AdminLogin,
AdminTemplates, BemVindo, Bio, DeepDiagnosticDemo, DeepDiagnosticReviewView,
DeepFunnelPublic, DeepFunnelThankYou, ForgotPassword, Index, Landing, Loja,
NotFound, Painel, PainelConfiguracoes, PainelInvites, Privacidade,
RedirectCampaign, ResetPassword, ResetSession, Share, Signup, Termos,
Unsubscribe.

## Pendências

- Cópia local atrasada vs `main` — `git pull` antes de codar local.
- Testes manuais de email não confirmados (signup, forgot-password, invites).
- Confirmar acesso ao Supabase de produção (`bdxkcfngskagriaapepo`) via conector;
  na data deste checkpoint só `axtor-staging` estava acessível.
- `.lovable/plan.md`: plano em aberto de switch Ativo + adicionar/deletar
  produtos no editor do Diagnóstico (coluna `is_active`).
