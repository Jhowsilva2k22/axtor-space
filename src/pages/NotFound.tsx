import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useBrasilLockedTheme } from "@/components/ThemeToggle";
import { DottedSurface } from "@/components/landing/DottedSurface";

const NotFound = () => {
  useBrasilLockedTheme();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 grain overflow-x-hidden">
      {/* Fundo azul-marinho (tema) atrás da malha — padrão externo, igual ao login */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{ background: "radial-gradient(ellipse at top, hsl(223 68% 12%), hsl(223 68% 4%))" }}
      />
      <DottedSurface />

      <div
        data-glow
        style={{ ["--glow-radius" as string]: "32" } as React.CSSProperties}
        className="relative z-10 w-full max-w-sm rounded-[32px] border border-gold/20 bg-card/40 p-10 text-center shadow-2xl backdrop-blur-xl"
      >
        <h1 className="font-display text-6xl text-gold">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Esta página não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="btn-luxe mt-8 inline-flex h-12 items-center justify-center rounded-full px-8 text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
