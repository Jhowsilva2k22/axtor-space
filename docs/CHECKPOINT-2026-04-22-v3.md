# Checkpoint — 2026-04-22 (v3)

## Sessão atual

### ✅ Idempotência de invites por email (#5)
- `src/pages/AdminInvites.tsx::create` agora revoga invites pendentes anteriores
  para o mesmo `target_email` + `type` antes de inserir o novo
- Note do revogado: `superseded → NOVO_CODIGO`
- Toast informa quantos foram revogados
- Memo: `mem://features/invite-idempotency`

### ✅ Templates de bio prontos (#6)
- 4 presets em `src/lib/bioTemplates.ts`: coach, artist, ecommerce, infoproduct
- Cada um: headline + sub_headline + 3 categorias + 5 blocos
- `BioTemplatePicker` (Dialog) integrado em `Admin.tsx`:
  - CTA grande no estado vazio: "Comece com um template"
  - Variante ghost no header (quando vazio)
- Blocos vêm como **rascunho** (`is_active: false`) — usuário revisa URLs e ativa
- Categorias com slug sufixado por timestamp pra evitar colisão
- Memo: `mem://features/bio-templates`

## Próximos passos sugeridos
1. **#7 QR Code da bio** — botão admin → PNG/SVG com logo Axtor centralizado
2. **#8 Analytics por tenant** — RPC `get_tenant_analytics` + página filtrada
3. **#9 SEO por tenant** — title/og:image/meta dinâmicos em `/[slug]`
4. **#10 Notificações por email** — cron semanal de resumos
