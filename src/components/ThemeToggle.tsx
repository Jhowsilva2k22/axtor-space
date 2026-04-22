import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

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
