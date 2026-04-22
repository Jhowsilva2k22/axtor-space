---
name: Luxury Editorial Design Rules
description: Regras visuais obrigatórias do app — radius retos, tipografia serifada, padrão de botões/badges/cards
type: design
---

## Border radius
- Global `--radius: 0.1875rem` (3px). Use `rounded-sm` em tudo: badges, botões, inputs, cards, containers, modais.
- PROIBIDO: `rounded-full`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` em elementos de UI.
- Exceção: `rounded-full` permitido apenas em avatares (foto de perfil) e loaders/spinners.

## Tipografia
- Headings: `font-display` (Cormorant Garamond), itálico para palavras de destaque com `text-gold`.
- Body: Manrope, peso 300 (light) por padrão.
- Botões e labels pequenas: `uppercase` + `tracking-[0.15em]` a `tracking-[0.3em]`.

## Botões
- Classe base `btn-luxe`, altura `h-11`/`h-12`, `rounded-sm`, uppercase, tracking wide.
- Em mobile reduzir padding/tracking para evitar overflow (`px-4 sm:px-6`, `tracking-[0.1em] sm:tracking-[0.15em]`).

## Badges / pills
- `rounded-sm` + `border border-gold` + `bg-gradient-gold-soft` ou `bg-background/40`.
- Texto `uppercase tracking-[0.3em] text-primary` em tamanho `text-[10px]` ou `text-xs`.

## Cards / containers
- `rounded-sm` + `border-gold-gradient` ou `border border-gold` + `bg-card/60`.
- Hover sutil: `hover:-translate-y-1 hover:shadow-gold`.

## Cores
- Sempre tokens semânticos do `index.css` / `tailwind.config.ts` (HSL). Nunca cores hardcoded em componentes.
