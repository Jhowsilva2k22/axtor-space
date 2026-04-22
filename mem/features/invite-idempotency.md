---
name: Idempotência de invites por email
description: Ao criar invite por email, revoga pendentes anteriores pro mesmo email+tipo
type: feature
---

Em `src/pages/AdminInvites.tsx::create`:
- Se `mode === "email"`, antes de inserir, busca invites com mesmo `target_email` + `type`
  que estejam pendentes (`used_at IS NULL` AND `revoked_at IS NULL`)
- Revoga todos com `note: "superseded → NOVO_CODIGO"` antes de criar o novo
- Toast informa quantos foram revogados

Existe também `rotateInvite` (manual): botão "rotacionar" revoga 1 invite específico
e cria substituto com `note: "rotated → NOVO"` — usado quando o usuário quer trocar
o código sem mudar email/tipo/nota.
