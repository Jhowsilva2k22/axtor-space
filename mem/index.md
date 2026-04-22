# Project Memory

## Core
Tema dual: dark (padrão) + light (.theme-ivory). SEMPRE usar tokens semânticos do design system — nunca text-white/text-black/text-gray-*.
Pareamento obrigatório de fundo/texto: bg-card → text-card-foreground, bg-background → text-foreground, bg-primary → text-primary-foreground, bg-popover → text-popover-foreground, bg-muted → text-muted-foreground.
Inputs precisam ter caret-color visível (já configurado global em index.css usando hsl(var(--primary))).
Domínio produção: axtor.space (primary) + www.axtor.space. Hostinger DNS, SaaS path-based /t/{slug} no MVP.

## Memories
- [Design rules](mem://design/rules.md) — Regras completas de tokens semânticos e pareamento de cores
