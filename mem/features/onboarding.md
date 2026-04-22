---
name: Onboarding checklist
description: Checklist persistente no topo do Admin com 4 passos de ativação
type: feature
---

Componente: `src/components/OnboardingChecklist.tsx` — não-bloqueante, gradiente gold-noir.

4 passos:
1. Adicionar foto de perfil (`hasAvatar`)
2. Escrever headline (`hasHeadline`)
3. Criar primeiro bloco ativo (`hasActiveBlock`)
4. Ver bio publicada (link externo)

Comportamento:
- Auto-esconde quando 100% completo (sem alarde)
- Botão "dispensar" salva em `localStorage` como `axtor.onboarding.dismissed = "1"`
- Pode colapsar/expandir (estado local, não persistido)
- CTAs de "Adicionar foto" e "Editar headline" rolam até `#admin-header-section`; "Adicionar bloco" rola até `#admin-blocks-section`

Integrado em `src/pages/Admin.tsx` no topo, abaixo do header.