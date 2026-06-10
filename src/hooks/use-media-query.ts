import { useEffect, useState } from "react";

/**
 * Retorna true quando a media query bate. Usado pra ligar/desligar
 * efeitos só no desktop (ex.: inclinação 3D dos cards de preço).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
