

## Sistema de Templates de Designer — execução profissional em 3 fases

**Princípio**: Gold Noir (atual) **continua sendo o padrão** e fica imutável. Os outros templates são alternativas opcionais que você liga/desliga no admin. Zero risco de quebrar o que já está no ar.

---

### Fase 0 — Backup explícito (antes de tocar em nada)

Gero um arquivo SQL com snapshot completo de:
- `bio_blocks` (todos os blocos, configs, UTMs)
- `bio_config` (avatar, headline, footer)
- `bio_categories`
- `bio_block_campaigns`

Você baixa o arquivo. Se algo der errado, executo ele de volta e tudo volta ao estado de hoje. Independente do revert do código.

**Entregável**: `/mnt/documents/backup-bio-2026-04-22.sql`

---

### Fase 1 — Tokenização (refator invisível, zero mudança visual)

**O que faço:**
- Auditar `index.css` e identificar todo valor hardcoded (ex: `hsl(43 55% 54%)` solto dentro de `--gradient-gold`)
- Extrair pra variáveis semânticas: `--brand-hue`, `--brand-saturation`, `--brand-lightness`, `--font-display-family`, `--font-body-family`, `--aurora-enabled`, `--card-border-style`
- Refatorar `--gradient-gold`, `--gradient-noir`, `.aurora-a`, `.aurora-b`, `.btn-luxe` etc pra consumir essas variáveis
- Atualizar `tailwind.config.ts` se necessário pra expor novos tokens

**O que NÃO faço:** mudar nenhum valor. Tudo continua Gold Noir idêntico. É só reorganização interna.

**Checkpoint obrigatório**: paro aqui, peço pra você abrir `/bio` e `/admin` e confirmar "tá tudo igual". Se você ver qualquer diferença visual, eu reverto na hora antes de seguir.

---

### Fase 2 — Camada de tema persistente (default = Gold Noir)

**Schema novo:**

```sql
CREATE TABLE bio_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,         -- 'gold-noir', 'ivory-gold', etc
  name text NOT NULL,                 -- 'Gold Noir' (label exibido)
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  tokens jsonb NOT NULL,              -- { brandHue: 43, fontDisplay: 'Cormorant Garamond', auroraEnabled: true, ... }
  preview_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bio_config ADD COLUMN active_theme_slug text NOT NULL DEFAULT 'gold-noir';
```

RLS: leitura pública, escrita só admin (mesmo padrão de `bio_blocks`).

**Seed obrigatório**: insiro **Gold Noir** com `is_default=true` espelhando exatamente os tokens atuais. `bio_config.active_theme_slug='gold-noir'`. Sistema continua idêntico ao que está no ar.

**Componente novo**: `<ThemeProvider>` em `src/components/ThemeProvider.tsx` — busca tema ativo, injeta tokens no `<html style="...">`. Roda no `App.tsx` envolvendo tudo. Fallback: se falhar a busca, usa Gold Noir hardcoded.

---

### Fase 3 — Painel de templates no admin + 3 alternativas

**Nova rota**: `/admin/templates`

- Grid com 4 cards: Gold Noir (atual, marcado como "Padrão"), Ivory Gold, Editorial Mono, Vibrant Sunset
- Cada card mostra mini-preview com avatar fake + 2 blocos no estilo do tema
- Botão "Pré-visualizar ao vivo" → aplica só no seu navegador (localStorage), público continua vendo Gold Noir
- Botão "Definir como ativo" → salva em `bio_config.active_theme_slug`, todos os visitantes passam a ver
- Botão "Voltar pro padrão (Gold Noir)" sempre visível e destacado

**3 templates alternativos** (todos respeitando as regras de design — `rounded-sm`, sem `rounded-full` exceto avatar):

| Template | Identidade |
|---|---|
| Gold Noir (default) | atual, intocado |
| Ivory Gold | fundo claro creme, dourado mais escuro, mantém Cormorant + Manrope |
| Editorial Mono | preto + branco puros, sem aurora, fonte display vira uma serifa mais marcada |
| Vibrant Sunset | gradiente magenta/laranja, fonte sans moderna, aurora colorida |

---

### Garantias profissionais

1. **Backup externo** antes de começar (Fase 0)
2. **Cada fase é deployável sozinha** sem quebrar nada
3. **Checkpoint visual obrigatório** ao fim da Fase 1
4. **Default sempre = Gold Noir** no banco e no fallback de código
5. **Botão "Voltar pro padrão"** permanente no painel
6. **Preview-only mode** (localStorage) — testa sem afetar o público
7. Migration é só ADD (cria tabela e coluna nova), não altera nada existente

---

### Arquivos afetados

**Novos:**
- `src/components/ThemeProvider.tsx`
- `src/pages/AdminTemplates.tsx`
- migration: criar `bio_themes`, adicionar `active_theme_slug` em `bio_config`, seed Gold Noir
- backup SQL em `/mnt/documents/`

**Editados (Fase 1, refator de tokens):**
- `src/index.css` — extrair valores hardcoded pra variáveis
- `tailwind.config.ts` — se precisar expor token novo

**Editados (Fase 2-3):**
- `src/App.tsx` — envolver com `<ThemeProvider>`
- `src/pages/Admin.tsx` — link pro painel `/admin/templates`

---

### Ordem de execução

1. Backup → te entrego o `.sql`
2. Fase 1 → paro e peço confirmação visual
3. Fase 2 → migration + seed Gold Noir + ThemeProvider, sem mudança visível
4. Fase 3 → painel + 3 templates alternativos

Aprovado, começo pela Fase 0 (backup) imediatamente.

