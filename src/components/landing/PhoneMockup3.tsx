import { useEffect, useState } from "react";

/**
 * Mockup PROVISÓRIO — 1 celular que cicla 3 telas da experiência Axtor Space:
 * Apresentação → Diagnóstico → Resultado. Stand-in até receber os mockups reais.
 * Mantém o estilo gold-noir do produto.
 */
const TELAS = ["apresentacao", "diagnostico", "resultado"] as const;

export function PhoneMockup3() {
  const [i, setI] = useState(0);

  useEffect(() => {
    // A troca de telas é o ponto do mockup — sempre anima.
    const id = setInterval(() => setI((p) => (p + 1) % TELAS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex justify-center">
      <div className="absolute top-[12%] h-[70%] w-[70%] rounded-full bg-primary/20 blur-3xl" />
      <div className="relative aspect-[9/19] w-[270px] rounded-[2.4rem] border border-primary/15 bg-black p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
        <div className="absolute left-1/2 top-3 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-black" />
        <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] bg-[radial-gradient(ellipse_at_top,#161412,#070707)]">
          {/* Tela 1 — Apresentação */}
          <Screen show={i === 0}>
            <div className="flex flex-col items-center gap-2.5 px-4 pt-7 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow" />
              <p className="text-sm font-bold text-[#f4f1ea]">Seu Nome</p>
              <p className="text-[11px] text-[#a8a298]">especialista · negócio · marca</p>
              <div className="mt-2 w-full space-y-2">
                <BioBlock>Meu trabalho</BioBlock>
                <BioBlock>WhatsApp</BioBlock>
                <BioBlock>Conteúdos</BioBlock>
                <BioBlock gold>Descobrir meu caminho</BioBlock>
              </div>
            </div>
          </Screen>

          {/* Tela 2 — Diagnóstico */}
          <Screen show={i === 1}>
            <div className="flex h-full flex-col px-4 pt-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Diagnóstico</p>
              <p className="mt-2 text-[15px] font-semibold leading-snug text-[#f4f1ea]">
                Qual é o seu principal objetivo hoje?
              </p>
              <div className="mt-4 space-y-2">
                {["Atrair mais clientes", "Organizar meus links", "Apresentar melhor meu negócio", "Direcionar meu público"].map(
                  (o, idx) => (
                    <div
                      key={o}
                      className={`rounded-xl border px-3 py-2.5 text-[12px] ${
                        idx === 0
                          ? "border-primary/60 bg-primary/10 text-[#f4f1ea]"
                          : "border-white/10 bg-white/[0.03] text-[#cfc9bd]"
                      }`}
                    >
                      {o}
                    </div>
                  ),
                )}
              </div>
            </div>
          </Screen>

          {/* Tela 3 — Resultado */}
          <Screen show={i === 2}>
            <div className="flex h-full flex-col px-4 pt-9 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="h-5 w-5 stroke-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-3 text-[12px] text-[#a8a298]">Com base nas suas respostas, o melhor caminho é:</p>
              <div className="mt-3 rounded-xl border border-primary/20 bg-white/[0.03] p-3 text-left">
                <p className="text-[13px] font-semibold text-[#f4f1ea]">Atrair mais clientes</p>
                <p className="mt-1 text-[11px] leading-snug text-[#a8a298]">
                  Vamos te levar pra conversa certa pra dar o próximo passo.
                </p>
              </div>
              <div className="mt-3 rounded-full bg-gradient-to-r from-primary to-primary-glow py-2.5 text-[12px] font-bold text-[#181402]">
                Falar no WhatsApp
              </div>
            </div>
          </Screen>
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

function Screen({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function BioBlock({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div
      className={`flex h-9 items-center justify-center rounded-xl text-[12px] ${
        gold
          ? "bg-gradient-to-r from-primary to-primary-glow font-bold text-[#181402]"
          : "border border-primary/20 bg-white/[0.03] text-[#e9e2d2]"
      }`}
    >
      {children}
    </div>
  );
}
