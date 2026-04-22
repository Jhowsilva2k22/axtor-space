# Project Memory

## Core
Idioma do produto: SEMPRE PT-BR (UI, emails, mensagens, toasts). Manter nomes próprios em inglês (Lovable, Supabase).
Auth: NUNCA forçar logout/redirect antes do `getSession()` resolver. Botão "Voltar" jamais desloga. Só `signOut()` explícito desloga.
Estética: gold-noir Axtor (#c9a84c em #0d0d0d, Cormorant Garamond display + Helvetica body). Aplicar em emails também.
Antes de implementar qualquer feature: grep no projeto pra ver se já existe (componente/hook/edge function/tabela). Não duplicar.
Manter `docs/CHECKPOINT-*.md` atualizado a cada milestone significativo.

## Memories
- [Auth & sessão](mem://preferences/auth-session) — Regras de loading, redirect e signOut
- [Email branding](mem://features/email-branding) — Templates auth gold-noir PT-BR
- [Onboarding checklist](mem://features/onboarding) — Checklist persistente no Admin
- [Bio templates](mem://features/bio-templates) — Presets por nicho (coach/artist/ecommerce/infoproduct)
- [Invite idempotency](mem://features/invite-idempotency) — Auto-revoga pendentes ao criar invite mesmo email
- [Ambient player](mem://features/ambient-player) — (existente)
- [Design rules](mem://design/rules) — (existente)