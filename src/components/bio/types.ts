/**
 * Onda 3 v2 Fase 3 (refactor) — tipos compartilhados dos editores da bio.
 * Centralizado pra evitar duplicação entre Admin.tsx, BlockEditor,
 * BioBlocksManager e standalones do Painel novo.
 */

export type BioConfigRow = {
  id: string;
  display_name: string;
  headline: string;
  sub_headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  footer_text: string | null;
};

export type Block = {
  id: string;
  kind: string;
  label: string;
  description: string | null;
  url: string;
  icon: string | null;
  icon_url: string | null;
  icon_generations_count: number;
  badge: string | null;
  highlight: boolean;
  position: number;
  is_active: boolean;
  use_brand_color: boolean;
  size: "sm" | "md" | "lg";
  category_id: string | null;
  draft_data: Partial<Block> | null;
  has_draft: boolean;
};
