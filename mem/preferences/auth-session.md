---
name: Regras de auth e sessão
description: Como tratar loading, redirect e signOut no admin
type: preference
---

**Regra absoluta: hard refresh (Ctrl+Shift+R), botão voltar, ou qualquer recarga NUNCA pode deslogar.**

Como aplicar:
- Em `useAuth.tsx`, só liberar `loading=false` depois que `supabase.auth.getSession()` resolver. Não usar safety timeout curto que zere `loading` antes do getSession responder, pois isso renderiza a árvore com `user=null` e dispara o `<Navigate to="/admin/login" />` indevidamente.
- Listener `onAuthStateChange` atualiza `user/session` mas NÃO marca a sessão como "resolvida" — só o `getSession()` faz isso.
- Safety timeout (8s) só serve pra evitar tela travada — se disparar, libera o app preservando o que o listener já trouxe.
- Único caminho de logout: chamar `signOut()` explícito no botão "Sair".

**Por quê:** o usuário relatou que Ctrl+Shift+R em /admin estava jogando ele de volta pro login. Causa raiz: safety timeout disparava antes do getSession resolver.