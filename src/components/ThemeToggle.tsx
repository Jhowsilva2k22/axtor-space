import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

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
  "--radius": "0.125rem",
};

type Theme = "noir" | "ivory";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "noir";
    return (localStorage.getItem("app-theme") as Theme) || "noir";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "ivory") root.classList.add("theme-ivory");
    else root.classList.remove("theme-ivory");
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  return { theme, setTheme, toggle: () => setTheme(theme === "noir" ? "ivory" : "noir") };
};

/**
 * Trava o TEMA VISUAL no padrão "gold-noir" enquanto a página admin
 * estiver montada. NÃO interfere no toggle claro/escuro (.theme-ivory),
 * que continua livre — admin pode alternar claro/escuro normalmente,
 * só não vê os temas customizados de tester (rosé, oceano etc).
 * Ao desmontar, o ThemeProvider reaplica o tema ativo da bio.
 */
export const useAdminLockedTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(GOLD_NOIR_TOKENS).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.auroraEnabled = "true";
  }, []);
};

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "noir" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-gold bg-card/60 text-primary backdrop-blur transition-all hover:scale-105 hover:shadow-gold ${className}`}
    >
      {theme === "noir" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
