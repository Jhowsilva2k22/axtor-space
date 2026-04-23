import { useEffect } from "react";

/**
 * Guard global contra scroll-lock residual.
 *
 * Radix UI (Dialog, Sheet, DropdownMenu, Popover) aplica `overflow: hidden`
 * e às vezes `pointer-events: none` no <body> enquanto um overlay está
 * aberto. Em casos de fechamento abrupto (ex.: navegação programática,
 * troca de aba durante a animação, erro em handler) esses estilos
 * permanecem grudados — o usuário rolou pra baixo, fechou algo, e a
 * página simplesmente não rola mais.
 *
 * Este guard observa o body e libera o scroll automaticamente quando
 * não há mais nenhum overlay aberto (Radix marca overlays com
 * `data-state="open"`).
 */
export const ScrollLockGuard = () => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const releaseIfStuck = () => {
      const hasOpenOverlay = document.querySelector(
        '[data-state="open"][role="dialog"], [data-state="open"][data-radix-popper-content-wrapper], [data-radix-portal] [data-state="open"]',
      );
      if (hasOpenOverlay) return;

      const body = document.body;
      // Reseta apenas se Radix deixou travado.
      if (body.style.overflow === "hidden" || body.style.pointerEvents === "none") {
        body.style.overflow = "";
        body.style.pointerEvents = "";
      }
      // Radix também adiciona padding-right pra compensar scrollbar.
      if (body.style.paddingRight && /\d/.test(body.style.paddingRight)) {
        body.style.paddingRight = "";
      }
    };

    // Observa mudanças de atributo no body (Radix mexe em style direto)
    const observer = new MutationObserver(() => {
      // Pequeno debounce — espera animação de fechamento terminar
      window.setTimeout(releaseIfStuck, 350);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    // Safety net: ao voltar pra aba, garante que nada ficou preso
    const onVisible = () => {
      if (document.visibilityState === "visible") releaseIfStuck();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
};

export default ScrollLockGuard;