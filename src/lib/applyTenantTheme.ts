import { supabase } from "@/integrations/supabase/client";

/**
 * Aplica o tema da bio do dono (via tenant_id) no :root.
 * Usado em páginas públicas que NÃO passam pelo ThemeProvider
 * (lead não está logado, então não temos useTenant).
 */
export async function applyTenantTheme(tenantId: string | null | undefined) {
  if (!tenantId) return;
  try {
    const { data: cfg } = await supabase
      .from("bio_config")
      .select("active_theme_slug")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    const themeSlug = (cfg as any)?.active_theme_slug ?? "gold-noir";
    const { data: theme } = await supabase
      .from("bio_themes")
      .select("tokens")
      .eq("slug", themeSlug)
      .maybeSingle();
    const tokens = (theme as any)?.tokens;
    if (!tokens) return;
    const root = document.documentElement;
    const set = (k: string, v: any) => {
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
  } catch (err) {
    console.warn("[applyTenantTheme] failed", err);
  }
}