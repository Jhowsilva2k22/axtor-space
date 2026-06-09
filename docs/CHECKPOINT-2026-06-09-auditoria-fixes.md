# Checkpoint 2026-06-09 — Fixes da auditoria ponta a ponta

Registro do que foi fechado na sessão de auditoria. Referência de achados:
`docs/AUDITORIA-2026-06-09.md`. Banco de produção real = `pybgqassjzcynzaakzhz`.

## Resolvido e em produção

| Item | O que foi feito | PR / deploy |
|------|------------------|-------------|
| A2 | `config.toml` + `.env` alinhados ao ref de produção `pybgqassjzcynzaakzhz` | #142 |
| A1 | RLS UPDATE de `deep_diagnostics` escopada (era `USING true`) | #144 (migration) |
| M1 | Removida listagem ampla nos buckets públicos (URL direta preservada) | #144 (migration) |
| B1 | `search_path` fixo em `update_conversation_status_timestamp` | #144 (migration) |
| A3 texto | `generate-improvements` migrada Lovable → Anthropic (claude-sonnet-4-5) | #145 + deploy v12 |
| A3 imagem | `generate-icon` desativada no IconPicker (Lovable fora do caminho) | #146 |
| M3 | Build local verde (Vite 8) após `npm install` | local |
| Deps | `npm audit fix`: react-router open redirect + vitest UI — 0 vulnerabilidades | #147 |
| B2 | Removidas 5 tabelas órfãs do atende-zap (contacts, conversation_status, interactions, agent_config, sectors) + trigger | #149 (migration) |
| B5 | `.env` destrastreado + scripts dev removidos + `.env.example` restaurado | #151, #152 |
| A4 | Logos dos emails movidos pro próprio domínio (public/email/ → https://axtor.space/email/); 9 templates repontados; funções de email redeployadas | #153, #154 + deploy CLI |

## Migrations aplicadas em produção

- `20260609180000_harden_deep_diagnostics_rls_and_search_path.sql` (A1 + B1)
- `20260609180100_remove_public_bucket_listing_policies.sql` (M1)
- `20260609190000_drop_atende_zap_orphan_tables.sql` (B2)

## Edge functions redeployadas (A4)

Via `npx supabase functions deploy <nome> --project-ref pybgqassjzcynzaakzhz` (CLI
empacota o _shared automaticamente):
- auth-email-hook (6 templates de auth)
- send-transactional-email (registry + 3 transacionais)
- preview-transactional-email

## Ainda aberto

- **M2** (ação do dono): ativar leaked password protection no painel Supabase Auth.
- **B3/B4**: higiene de baixa prioridade, sem risco de produção. Decisão: não fazer salvo necessidade.

## Resíduos cosméticos (não urgentes)

- 2 avatares de SAMPLE_DATA (preview) em partner/tester-invite ainda apontam pro
  projeto antigo — não afeta envios reais.
- secret `LOVABLE_API_KEY` ainda usado como TOKEN de auth em
  auth-email-hook/handle-email-suppression/preview (não é IA). Renomear quando conveniente.

## Observações

- Lovable descontinuado como provedor de IA; nada mais depende dele no caminho de produção.
- Nada parou em produção durante a sessão.
