

## Plano: reduzir digitação no admin com Combobox + presets

### Componente novo
- **`src/components/Combobox.tsx`** — input híbrido (digita ou escolhe). Reusa `Popover` + `Command` do shadcn. Aceita `presets`, `value`, `onChange`, `placeholder`, `allowCustom` (default true).

### Aplicar em `src/pages/Admin.tsx` (BlockEditor)
1. **Badge** → Combobox com presets: `NOVO`, `OFERTA`, `EM BREVE`, `ESGOTADO`, `POPULAR`, `GRÁTIS`, `LIMITADO`, `EXCLUSIVO`. Custom permitido.
2. **Footer text** (em ConfigEditor) → Combobox com presets: `joandersonsilva.com.br`, `© 2026 Joanderson Silva`, `Feito com presença`, vazio. Custom permitido.

### Aplicar em `src/components/CampaignManager.tsx`
3. **UTM source** → Combobox com presets: `instagram`, `whatsapp`, `bio`, `email`, `youtube`, `tiktok`, `organic`, `direct`. Custom permitido.
4. **UTM medium** → Combobox com presets: `social`, `cpc`, `referral`, `email`, `organic`, `affiliate`, `bio-link`. Custom permitido.
5. **UTM campaign** → Combobox com sugestão automática baseada no `block.label` (ex: bloco "Curso Pai Presente" → sugere `curso-pai-presente`). Custom permitido.

### O que NÃO muda (continua digitação livre — é correto assim)
- URL do bloco
- Label do bloco  
- Description do bloco
- Headline / sub-headline / display_name da bio
- Nome de categoria custom

### Resultado
- Quem quer rápido: 2 cliques resolvem badge+UTM
- Quem quer custom: digita normal — nada é perdido
- Métricas continuam consistentes (presets evitam typo tipo "Instagran")

### Arquivos afetados
- ➕ `src/components/Combobox.tsx` (novo)
- ✏️ `src/pages/Admin.tsx` (badge + footer)
- ✏️ `src/components/CampaignManager.tsx` (3 UTMs)

Sem migration de banco. Sem quebrar nada existente.

