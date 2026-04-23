---
name: Regras de auth e sessão
description: Como tratar loading, redirect e signOut no admin
type: preference
---

**Regra absoluta: hard refresh (Ctrl+Shift+R), botão voltar, ou qualquer recarga NUNCA pode deslogar.**

Como aplicar:
- Em `useAuth.tsx`, só liberar `loading=false` depois que `supabase.auth.getSession()` resolver. Não usar safety timeout curto que zere `loading` antes do getSession responder.
- Listener `onAuthStateChange` atualiza `user/session` mas NÃO marca a sessão como "resolvida" — só o `getSession()` faz isso.
- Safety timeout (8s) só serve pra evitar tela travada — se disparar, libera o app preservando o que o listener já trouxe.
- Único caminho de logout: chamar `signOut()` explícito no botão "Sair".

**Regra: TODO hook que usa `setLoading(true)` antes de queries assíncronas DEVE usar try/finally pra garantir `setLoading(false)`.**
- Caso `useCurrentTenant`: se a query de tenants der throw (rede, RLS), sem try/finally o `loading` fica `true` para sempre e o `Admin.tsx` trava em spinner ("tela escura") após login. Já corrigido.
