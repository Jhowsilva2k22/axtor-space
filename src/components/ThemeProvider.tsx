import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeTokens = {
  brandH: number | string;
  brandS: string;
  brandL: string;
  brandLGlow?: string;
  surfaceH?: number | string;
  surfaceS?: string;
  surfaceLBg?: string;
  surfaceLCard?: string;
  surfaceLBorder?: string;
  fontDisplay?: string;
  fontBody?: string;
  auroraEnabled?: boolean;
  auroraOpacity?: number;
  radius?: string;
};

export type Theme = {
  slug: string;
  name: string;
  is_default: boolean;
  tokens: ThemeTokens;
};

// Fallback hardcoded = Gold Noir. Garante que se o banco falhar, o site continua igual.
const GOLD_NOIR_FALLBACK: Theme = {
  slug: "gold-noir",
  name: "Gold Noir",
  is_default: true,
  tokens: {
    brandH: 43,
    brandS: "55%",
    brandL: "54%",
    brandLGlow: "68%",
    surfaceH: 30,
    surfaceS: "12%",
    surfaceLBg: "5%",
    surfaceLCard: "8%",
    surfaceLBorder: "14%",
    fontDisplay: "Cormorant Garamond, serif",
    fontBody: "Manrope, sans-serif",
    auroraEnabled: true,
    auroraOpacity: 0.45,
    radius: "0.125rem",
  },
};

const PREVIEW_KEY = "bio-theme-preview";

type Ctx = {
  theme: Theme;
  activeSlug: string;
  previewSlug: string | null;
  setPreview: (slug: string | null) => void;
};

const ThemeCtx = createContext<Ctx>({
  theme: GOLD_NOIR_FALLBACK,
  activeSlug: "gold-noir",
  previewSlug: null,
  setPreview: () => {},
});

const applyTokensToRoot = (tokens: ThemeTokens) => {
  const root = document.documentElement;
  const set = (k: string, v: string | number | undefined) => {
    if (v === undefined || v === null) return;
    root.style.setProperty(k, String(v));
  };
  set("--brand-h", tokens.brandH);
  set("--brand-s", tokens.brandS);
  set("--brand-l", tokens.brandL);
  if (tokens.brandLGlow) set("--brand-l-glow", tokens.brandLGlow);
  if (tokens.surfaceH !== undefined) set("--surface-h", tokens.surfaceH);
  if (tokens.surfaceS) set("--surface-s", tokens.surfaceS);
  if (tokens.surfaceLBg) set("--surface-l-bg", tokens.surfaceLBg);
  if (tokens.surfaceLCard) set("--surface-l-card", tokens.surfaceLCard);
  if (tokens.surfaceLBorder) set("--surface-l-border", tokens.surfaceLBorder);
  if (tokens.fontDisplay) set("--font-display", tokens.fontDisplay);
  if (tokens.fontBody) set("--font-body", tokens.fontBody);
  if (tokens.auroraOpacity !== undefined) set("--aurora-opacity", tokens.auroraOpacity);
  if (tokens.radius) set("--radius", tokens.radius);
  root.dataset.auroraEnabled = tokens.auroraEnabled === false ? "false" : "true";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(GOLD_NOIR_FALLBACK);
  const [activeSlug, setActiveSlug] = useState<string>("gold-noir");
  const [previewSlug, setPreviewSlugState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    // ?preview=slug na URL tem prioridade (usado em iframes do admin)
    const url = new URLSearchParams(window.location.search);
    const urlPreview = url.get("preview");
    if (urlPreview) return urlPreview;
    return localStorage.getItem(PREVIEW_KEY);
  });

  const setPreview = (slug: string | null) => {
    // Não persiste se vier da URL — preview de iframe é volátil
    const fromUrl = typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview");
    if (fromUrl) {
      setPreviewSlugState(slug);
      return;
    }
    if (slug) localStorage.setItem(PREVIEW_KEY, slug);
    else localStorage.removeItem(PREVIEW_KEY);
    setPreviewSlugState(slug);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: cfg } = await supabase
          .from("bio_config")
          .select("active_theme_slug")
          .eq("singleton", true)
          .maybeSingle();
        const liveSlug = (cfg as any)?.active_theme_slug ?? "gold-noir";
        if (!cancelled) setActiveSlug(liveSlug);

        const slugToLoad = previewSlug ?? liveSlug;
        const { data: t } = await supabase
          .from("bio_themes")
          .select("slug, name, is_default, tokens")
          .eq("slug", slugToLoad)
          .maybeSingle();

        if (!cancelled && t) {
          const next = { ...(t as any), tokens: (t as any).tokens as ThemeTokens } as Theme;
          setTheme(next);
          applyTokensToRoot(next.tokens);
        } else if (!cancelled) {
          applyTokensToRoot(GOLD_NOIR_FALLBACK.tokens);
        }
      } catch {
        if (!cancelled) applyTokensToRoot(GOLD_NOIR_FALLBACK.tokens);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewSlug]);

  return (
    <ThemeCtx.Provider value={{ theme, activeSlug, previewSlug, setPreview }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeCtx);