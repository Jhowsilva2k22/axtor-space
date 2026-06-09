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

## Migrations aplicadas em produção

- `20260609180000_harden_deep_diagnostics_rls_and_search_path.sql` (A1 + B1)
- `20260609180100_remove_public_bucket_listing_policies.sql` (M1)

## Ainda aberto

- **M2** (ação do dono): ativar leaked password protection no painel Supabase Auth.
- **A4**: emails carregam logo do projeto antigo (`bdxkcfngskagriaapepo`, ainda vivo).
  Sequência: subir assets ao bucket `email-assets`/`avatars` de produção → repontar
  os 10 templates → redeploy → validar email real.
- **B2/B3/B4/B5**: higiene de baixa prioridade, sem risco de produção.

## Observações

- Lovable descontinuado: secret `LOVABLE_API_KEY` ainda usado como TOKEN de auth
  em auth-email-hook/handle-email-suppression/preview-transactional-email (não é IA).
  Renomear o segredo quando conveniente.
- Nada parou em produção durante a sessão.
