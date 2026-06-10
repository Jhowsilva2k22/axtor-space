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

// Tokens do tema "azul-copa" (Brasil) — padrão de entrada do cliente.
// Mantém as fontes do projeto e troca superfície (navy) + brand (amarelo).
const AZUL_COPA_TOKENS: Record<string, string> = {
  "--brand-h": "52",
  "--brand-s": "98%",
  "--brand-l": "52%",
  "--brand-l-glow": "68%",
  "--surface-h": "223",
  "--surface-s": "68%",
  "--surface-l-bg": "6%",
  "--surface-l-card": "10%",
  "--surface-l-border": "18%",
  "--font-display": "Cormorant Garamond, serif",
  "--font-body": "Manrope, sans-serif",
  "--aurora-opacity": "0.55",
  "--radius": "1.5rem",
};

/**
 * Trava o TEMA VISUAL no padrão "gold-noir" enquanto a página admin
 * estiver montada. Ao desmontar, o ThemeProvider reaplica o tema ativo da bio.
 * USAR SÓ no painel admin do dono.
 */
export const useAdminLockedTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(GOLD_NOIR_TOKENS).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.auroraEnabled = "true";
  }, []);
};

/**
 * Trava o tema "azul-copa" (Brasil) — porta de entrada do cliente
 * (login, cadastro). É o padrão de entrada do sistema.
 */
export const useBrasilLockedTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(AZUL_COPA_TOKENS).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.auroraEnabled = "true";
  }, []);
};
