import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Card com borda que brilha seguindo o mouse (gold-noir).
 * Adaptado para a marca Axtor: hue dourado, e UM listener de pointer
 * global (não um por card) — as vars ficam no <html> e os cards herdam.
 */

let pointerBound = false;
function bindPointerOnce() {
  if (pointerBound || typeof window === "undefined") return;
  pointerBound = true;
  const root = document.documentElement;
  window.addEventListener(
    "pointermove",
    (e) => {
      root.style.setProperty("--glow-x", e.clientX.toFixed(1));
      root.style.setProperty("--glow-y", e.clientY.toFixed(1));
      root.style.setProperty("--glow-xp", (e.clientX / window.innerWidth).toFixed(3));
    },
    { passive: true },
  );
}

const GLOW_CSS = `
  [data-glow] {
    --glow-radius: 18;
    --glow-border: 2;
    --glow-size: 280;
    --glow-base: 44;     /* dourado */
    --glow-spread: 16;
    --glow-sat: 60;
    --glow-light: 60;
    --glow-border-size: calc(var(--glow-border) * 1px);
    --glow-spot: calc(var(--glow-size) * 1px);
    --glow-hue: calc(var(--glow-base) + (var(--glow-xp, 0.5) * var(--glow-spread)));
  }
  [data-glow]::before,
  [data-glow]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--glow-border-size) * -1);
    border: var(--glow-border-size) solid transparent;
    border-radius: calc(var(--glow-radius) * 1px);
    background-attachment: fixed;
    background-size: calc(100% + (2 * var(--glow-border-size))) calc(100% + (2 * var(--glow-border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    -webkit-mask-clip: padding-box, border-box;
    mask-composite: intersect;
    -webkit-mask-composite: source-in, xor;
  }
  [data-glow]::before {
    background-image: radial-gradient(
      calc(var(--glow-spot) * 0.75) calc(var(--glow-spot) * 0.75) at
      calc(var(--glow-x, 0) * 1px) calc(var(--glow-y, 0) * 1px),
      hsl(var(--glow-hue) calc(var(--glow-sat) * 1%) calc(var(--glow-light) * 1%) / 0.9), transparent 100%
    );
    filter: brightness(1.4);
  }
  [data-glow]::after {
    background-image: radial-gradient(
      calc(var(--glow-spot) * 0.5) calc(var(--glow-spot) * 0.5) at
      calc(var(--glow-x, 0) * 1px) calc(var(--glow-y, 0) * 1px),
      hsl(45 80% 92% / 0.7), transparent 100%
    );
  }
`;
let styleInjected = false;
function injectStyleOnce() {
  if (styleInjected || typeof document === "undefined") return;
  styleInjected = true;
  const s = document.createElement("style");
  s.setAttribute("data-glow-style", "");
  s.textContent = GLOW_CSS;
  document.head.appendChild(s);
}

export function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  useEffect(() => {
    injectStyleOnce();
    bindPointerOnce();
  }, []);

  return (
    <div
      data-glow
      className={cn(
        "group relative rounded-[18px] border border-border bg-card/70 p-6 backdrop-blur transition-transform duration-300 hover:-translate-y-1",
        className,
      )}
    >
      {/* hover de pontinhos (estilo bento) — combinado com a borda que segue o mouse */}
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.14)_1px,transparent_1px)] bg-[length:5px_5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}
