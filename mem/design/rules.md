---
name: design-color-rules
description: Regras obrigatórias de uso dos tokens semânticos de cor (light + dark themes)
type: design
---

## Tokens semânticos (NUNCA usar cores hardcoded)

### Pareamento fundo → texto
| Fundo | Texto correspondente |
|---|---|
| `bg-background` | `text-foreground` |
| `bg-card`, `bg-card/40` | `text-card-foreground` |
| `bg-popover` | `text-popover-foreground` |
| `bg-primary` (dourado) | `text-primary-foreground` |
| `bg-secondary` | `text-secondary-foreground` |
| `bg-muted` | `text-muted-foreground` |
| `bg-accent` | `text-accent-foreground` |
| `bg-destructive` | `text-destructive-foreground` |

### Tema dual
- **Dark** (padrão, `:root`): fundos escuros, texto creme (`--foreground: 40 30% 95%`)
- **Light** (`.theme-ivory`): fundos creme/marfim, texto escuro (`--foreground: 30 20% 12%`)

Os mesmos `text-foreground` / `text-card-foreground` funcionam nos dois temas automaticamente — desde que sejam usados em vez de cores fixas.

### Proibido
- `text-white`, `text-black`, `text-gray-*`, `text-slate-*`, `text-zinc-*`, `text-neutral-*`
- Hex/RGB inline em `style={{}}`
- Texto sem cor explícita dentro de containers com fundo customizado (vai herdar errado)

### Caret/cursor de input
Já configurado global em `src/index.css`: `input, textarea, [contenteditable] { caret-color: hsl(var(--primary)); }` — funciona com `bg-transparent` também.

### Acento dourado
- `text-gold` (gradient clip) — só pra destaques/títulos hero, NUNCA pra texto longo
- `text-primary` (cor sólida dourada) — para badges, ícones, CTAs secundários
