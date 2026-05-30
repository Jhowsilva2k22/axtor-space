import { useEffect } from "react";

// Tokens do tema padrão "gold-noir" — duplicados aqui pra não criar
// dependência circular com ThemeProvider. Devem espelhar o fallback de lá.
const GOLD_NOIR_TOKENS: Record<string, string> = {
  "--brand-h": "43",
  "--brand-s": "55%",
  "--brand-l": "54%",
  "--brand-l-glow": "68%",
  "--surface-h": "30",
  "--surface-s": "12%",
  "--surface-l-bg": "5%",
  "--surface-l-card": "8%",
  "--surface-l-border": "14%",
  "--font-display": "Cormorant Garamond, serif",
  "--font-body": "Manrope, sans-serif",
  "--aurora-opacity": "0.45",
  "--radius": "1.5rem",
};

/**
 * Trava o TEMA VISUAL no padrão "gold-noir" enquanto a página admin
 * estiver montada. Ao desmontar, o ThemeProvider reaplica o tema ativo da bio.
 */
export const useAdminLockedTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(GOLD_NOIR_TOKENS).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.auroraEnabled = "true";
  }, []);
};
