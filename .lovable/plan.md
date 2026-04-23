

## Cards de bloco: altura menor + tipografia mais legível

Confirmado: as alterações anteriores foram nesses cards mesmo (os `#1`, `#2`, etc. da seção "Blocos da bio"). Agora vou na direção oposta na tipografia — encolher altura mas engrossar e aumentar o texto pra ficar legível no mobile.

### O que muda

**Altura (mais compacto):**
- Padding do card: `p-4` → `p-3` (mobile) / `sm:p-4`
- Inputs/Selects: `h-10` → `h-9` (40px → 36px)
- Botões inferiores (Excluir/Duplicar/Salvar): `h-10` → `h-9`
- Margens internas: `mt-3` / `mt-4` → `mt-2` / `mt-3`
- Gap do grid: `gap-3` → `gap-2.5`

**Tipografia (mais visível):**
- Labels dos campos ("TIPO", "LABEL", "URL", etc.): `text-[10px]` → `text-[11px]`, peso `font-medium` → `font-semibold`, tracking `0.2em` → `0.18em` (menos esticado = mais legível)
- Switches do header ("DESTAQUE", "COR ORIGINAL"): mesmo tratamento (11px + semibold)
- Texto dos inputs: garantir `text-sm` (14px) — o componente `Input` já tem `text-base md:text-sm`, OK
- Botões inferiores: `text-[10px]` → `text-[11px] font-semibold`
- Badge "#1" de posição: `text-[10px]` → `text-[11px] font-semibold`

**Ganho líquido:** ~12-15% menos altura por card + texto ~10% maior e mais grosso. No mobile, os labels passam de 10px finos pra 11px semibold — muito mais legíveis sem ocupar mais espaço (a redução de altura compensa).

### Arquivo afetado
- `src/pages/Admin.tsx` (apenas o componente `SortableBlock`, linhas ~940-1100)

### Fora de escopo
- Header da página, card "Categorias", "Cabeçalho da bio" — não mexo
- `CampaignManager` (sub-componente dentro do card) — fica como está

Se aprovar, aplico em uma única edição. Se preferir testar só a tipografia primeiro (sem mexer na altura) ou vice-versa, me avisa.

