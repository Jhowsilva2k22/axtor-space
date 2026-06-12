import { useEffect, useState } from "react";

/**
 * Mockup do celular da /vendas: cicla as 3 telas reais da experiência
 * (bio -> diagnóstico -> resultado). Imagens otimizadas em /public/mockup.
 */
const TELAS = [
  { src: "/mockup/bio.webp", alt: "Tela de link na bio com diagnóstico" },
  { src: "/mockup/diagnostico.webp", alt: "Tela de pergunta do diagnóstico" },
  { src: "/mockup/resultado.webp", alt: "Tela de resultado do diagnóstico" },
] as const;

export function PhoneMockup3() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % TELAS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex justify-center">
      <div className="absolute top-[12%] h-[70%] w-[70%] rounded-full bg-primary/20 blur-3xl" />
      <div className="relative aspect-[9/19] w-[270px] rounded-[2.4rem] border border-primary/15 bg-black p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] bg-black">
          {TELAS.map((t, idx) => (
            <img
              key={t.src}
              src={t.src}
              alt={t.alt}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>

      {/* indicador de telas */}
      <div className="absolute -bottom-7 flex gap-1.5">
        {TELAS.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-5 bg-primary" : "w-1.5 bg-primary/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
