---
name: Templates de bio prontos
description: Presets por nicho que criam categorias + blocos no tenant atual
type: feature
---

`src/lib/bioTemplates.ts` define 4 presets: `coach`, `artist`, `ecommerce`, `infoproduct`.
Cada preset tem: headline, sub_headline, 3 categorias, 5 blocos.

`src/components/BioTemplatePicker.tsx` é o picker (Dialog).
- Variant `primary` (CTA grande no estado vazio) ou `ghost` (botão secundário no header).
- Ao aplicar:
  1. Atualiza headline + sub_headline em `bio_config`
  2. Cria categorias com slug sufixado por timestamp pra evitar colisão
  3. Cria blocos como **rascunho** (`is_active: false`) — usuário revisa URLs e ativa
- Mapeia `category_slug` (do template) → `category_id` real via `slugToId`.

Integrado em `src/pages/Admin.tsx`:
- Estado vazio de blocos: card grande com CTA "Usar template" + alternativa "criar do zero"
- Header da seção (quando vazia + canAddBlock): variante ghost ao lado do "Novo bloco"
