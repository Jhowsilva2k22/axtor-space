/**
 * Onda 3 v2 Fase 3 (refactor) — catálogo de tipos de bloco da bio.
 * Extraído de Admin.tsx (linha ~100). Compartilhado entre BlockEditor
 * (apresentacional) e qualquer outra UI que precise rotular tipos.
 */
export type BlockKind = {
  v: string; // valor salvo em bio_blocks.kind
  l: string; // label legível
  icon: string; // nome do ícone Lucide default sugerido
};

export const KINDS: BlockKind[] = [
  { v: "instagram", l: "Instagram", icon: "Instagram" },
  { v: "site", l: "Site", icon: "Globe" },
  { v: "whatsapp", l: "WhatsApp", icon: "MessageCircle" },
  { v: "agenda", l: "Agenda", icon: "Calendar" },
  { v: "product", l: "Produto próprio", icon: "ShoppingBag" },
  { v: "ebook", l: "E-book", icon: "BookOpen" },
  { v: "service", l: "Serviço", icon: "Briefcase" },
  { v: "affiliate", l: "Afiliado", icon: "Tag" },
  { v: "partner", l: "Parceiro", icon: "Handshake" },
  { v: "cta_diagnostico", l: "CTA Diagnóstico", icon: "Sparkles" },
  { v: "cta_ferramenta", l: "CTA Ferramenta", icon: "Crown" },
  { v: "link", l: "Link genérico", icon: "Link2" },
];
