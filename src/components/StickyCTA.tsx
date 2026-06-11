import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Barra fixa de CTA (mobile).
 * Aparece depois que o hero sai da tela, garantindo um CTA visível em
 * qualquer dobra. Some no topo pra não competir com o CTA do hero.
 * Só no mobile (md:hidden) — no desktop os CTAs já ficam no fluxo.
 *
 * `to` pode ser uma rota ("/signup") ou uma âncora da mesma página ("#planos").
 */
export const StickyCTA = ({ label, to }: { label: string; to: string }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cls =
    "flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-sm font-bold text-primary-foreground";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-primary/20 bg-background/85 px-4 py-3 backdrop-blur-lg transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {to.startsWith("#") ? (
        <a href={to} className={cls}>
          {label}
        </a>
      ) : (
        <Link to={to} className={cls}>
          {label}
        </Link>
      )}
    </div>
  );
};
