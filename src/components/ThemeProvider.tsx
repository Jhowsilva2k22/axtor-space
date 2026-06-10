import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { loadGoogleFont } from "@/lib/loadGoogleFont";

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

// Fallback hardcoded = azul-copa (Brasil), o tema PADRÃO de entrada do sistema.
// Garante que, se o banco falhar, o padrão continua sendo o azul.
const AZUL_COPA_FALLBACK: Theme = {
  slug: "azul-copa",
  name: "Brasil 2026",
  is_default: true,
  tokens: {
    brandH: 52,
    brandS: "98%",
    brandL: "52%",
    brandLGlow: "68%",
    surfaceH: 223,
    surfaceS: "68%",
    surfaceLBg: "6%",
    surfaceLCard: "10%",
    surfaceLBorder: "18%",
    fontDisplay: "Plus Jakarta Sans, sans-serif",
    fontBody: "Inter, sans-serif",
    auroraEnabled: true,
    auroraOpacity: 0.55,
    radius: "1.5rem",
  },
};

const PREVIEW_KEY = "bio-theme-preview";
const ADMIN_PATHS = ["/admin", "/signup", "/forgot-password", "/reset-password"];
// Rotas autenticadas onde o tema deve seguir o tenant do usuário logado, não a URL
const PANEL_PATHS = ["/painel", "/loja", "/bem-vindo"];

const readPreviewSlug = (): string | null => {
  if (typeof window === "undefined") return null;
  const url = new URLSearchParams(window.location.search);
  const urlPreview = url.get("preview");
  if (urlPreview) return urlPreview;
  try {
    return localStorage.getItem(PREVIEW_KEY);
  } catch {
    return null;
  }
};

type Ctx = {
  theme: Theme;
  activeSlug: string;
  previewSlug: string | null;
  setPreview: (slug: string | null) => void;
};

const ThemeCtx = createContext<Ctx>({
  theme: AZUL_COPA_FALLBACK,
  activeSlug: "gold-noir",
  previewSlug: null,
  setPreview: () => {},
});

export const applyThemeTokens = (tokens: ThemeTokens) => {
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
  if (tokens.fontDisplay) { loadGoogleFont(tokens.fontDisplay); set("--font-display", tokens.fontDisplay); }
  if (tokens.fontBody) { loadGoogleFont(tokens.fontBody); set("--font-body", tokens.fontBody); }
  if (tokens.auroraOpacity !== undefined) set("--aurora-opacity", tokens.auroraOpacity);
  if (tokens.radius) set("--radius", tokens.radius);
  root.dataset.auroraEnabled = tokens.auroraEnabled === false ? "false" : "true";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { tenant: urlTenant } = useTenant();
  const { current: authTenant } = useCurrentTenant();
  const location = useLocation();
  const isPanelRoute = PANEL_PATHS.some((p) => location.pathname.startsWith(p));
  // Em rotas do painel usa o tenant do usuário autenticado; em rotas públicas usa o tenant da URL
  const tenant = isPanelRoute ? authTenant : urlTenant;
  const [theme, setTheme] = useState<Theme>(AZUL_COPA_FALLBACK);
  const [activeSlug, setActiveSlug] = useState<string>("gold-noir");
  const [previewSlug, setPreviewSlugState] = useState<string | null>(readPreviewSlug);
  const lastTokensRef = useRef<ThemeTokens>(AZUL_COPA_FALLBACK.tokens);

  const setPreview = (slug: string | null) => {
    // Não persiste se vier da URL — preview de iframe é volátil
    const fromUrl = typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview");
    if (fromUrl) {
      setPreviewSlugState(slug);
      return;
    }
    try {
      if (slug) localStorage.setItem(PREVIEW_KEY, slug);
      else localStorage.removeItem(PREVIEW_KEY);
    } catch {
      // ignore storage failures
    }
    setPreviewSlugState(slug);
  };

  useEffect(() => {
    let cancelled = false;
    if (!tenant) return; // espera o tenant resolver antes de buscar tema
    (async () => {
      try {
        const { data: cfg } = await supabase
          .from("bio_config")
          .select("active_theme_slug")
          .eq("tenant_id", tenant.id)
          .maybeSingle();
        const liveSlug = (cfg as any)?.active_theme_slug ?? "azul-copa";
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
          lastTokensRef.current = next.tokens;
          applyThemeTokens(next.tokens);
        } else if (!cancelled) {
          lastTokensRef.current = AZUL_COPA_FALLBACK.tokens;
          applyThemeTokens(AZUL_COPA_FALLBACK.tokens);
        }
      } catch {
        if (!cancelled) {
          lastTokensRef.current = AZUL_COPA_FALLBACK.tokens;
          applyThemeTokens(AZUL_COPA_FALLBACK.tokens);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewSlug, tenant?.id]);

  useEffect(() => {
    const isAdmin = ADMIN_PATHS.some(p => location.pathname.startsWith(p));
    if (!isAdmin) applyThemeTokens(lastTokensRef.current);
  }, [location.pathname]);

  return (
    <ThemeCtx.Provider value={{ theme, activeSlug, previewSlug, setPreview }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeCtx);