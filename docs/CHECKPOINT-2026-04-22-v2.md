# Checkpoint — 2026-04-22 (v2)

## Sessão atual

### ✅ Onboarding pós-signup
- `OnboardingChecklist` no topo do `/admin`
- 4 passos: foto, headline, 1º bloco ativo, ver bio
- Não-bloqueante, dispensável, auto-some quando 100%
- Persistência via localStorage

### ✅ Recuperação de senha branded
- Páginas `/forgot-password` e `/reset-password` (PT-BR, gold-noir)
- Link "esqueci minha senha" em `/admin/login`
- Email `recovery.tsx` em PT-BR com branding Axtor

### ✅ Todos os 6 templates de auth em PT-BR (gold-noir)
- `signup.tsx` ✅
- `recovery.tsx` ✅
- `invite.tsx` ✅ (novo)
- `magic-link.tsx` ✅ (novo)
- `email-change.tsx` ✅ (novo)
- `reauthentication.tsx` ✅ (novo — código OTP em caixa destacada)
- Edge function `auth-email-hook` redeployed

### ✅ Bugfix: Ctrl+Shift+R deslogando
- **Causa:** safety timeout em `useAuth.tsx` disparava `loading=false` antes do `getSession()` resolver, com `user=null`, fazendo `<Navigate to="/admin/login" />`
- **Fix:** introduzido `sessionResolved`, só libera `loading` quando `getSession` responde de fato. Safety timeout subiu pra 8s e preserva o que o listener já trouxe.
- Regra salva em `mem://preferences/auth-session`

## Próximos passos sugeridos
1. Templates de bio prontos (presets por nicho)
2. QR Code da bio com logo Axtor
3. Analytics por tenant (não só admin global)
4. SEO por tenant (og:image, title dinâmicos)
5. Idempotência dos invite codes