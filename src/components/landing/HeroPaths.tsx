import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface HeroPathsProps {
  /** Parte do título em branco. */
  title: string;
  /** Parte do título em dourado (destaque). */
  accent: string;
  subtitle: string;
}

/**
 * Hero com título animado letra-por-letra (framer-motion) e botão "glass".
 * Adaptado do componente BackgroundPaths para a marca Axtor (gold-noir).
 */
export function HeroPaths({ title, accent, subtitle }: HeroPathsProps) {
  // Desktop anima letra a letra. Mobile pinta o titulo NA HORA — ele e o
  // elemento de LCP e animar empurrava o LCP no celular.
  const [isDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  // Anima letra por letra, mas agrupa por PALAVRA (whitespace-nowrap) pra
  // nenhuma palavra quebrar no meio. Mantém o índice global pra cadência.
  const renderLetters = (text: string, isAccent: boolean, offset: number) => {
    let idx = offset;
    const charClass = isAccent
      ? "inline-block pb-[0.16em] bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent"
      : "inline-block pb-[0.16em] bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent";
    return text.split(/(\s+)/).map((token, ti) => {
      if (token === "" ) return null;
      if (/^\s+$/.test(token)) return <span key={`${isAccent ? "a" : "n"}-sp-${ti}`}> </span>;
      return (
        <span key={`${isAccent ? "a" : "n"}-w-${ti}`} className="inline-block whitespace-nowrap">
          {Array.from(token).map((char) => {
            const i = idx++;
            return isDesktop ? (
              <motion.span
                key={i}
                initial={{ y: "0.5em", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.028, type: "spring", stiffness: 150, damping: 25 }}
                className={charClass}
              >
                {char}
              </motion.span>
            ) : (
              <span key={i} className={charClass}>
                {char}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
        Link na bio com diagnóstico por IA
      </motion.div>

      <h1 className="mx-auto mb-6 max-w-[18ch] pb-[0.1em] text-5xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl md:text-7xl">
        {renderLetters(title, false, 0)}
        {renderLetters(accent, true, title.length)}
      </h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="mx-auto mb-9 max-w-xl text-lg font-light text-muted-foreground"
      >
        {subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <div className="group inline-block rounded-2xl bg-gradient-to-b from-primary/50 to-primary/10 p-px backdrop-blur-lg transition-all duration-300 hover:shadow-[0_18px_50px_-14px_hsl(var(--primary)/0.6)]">
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 rounded-[15px] border border-primary/20 bg-background/90 px-8 py-4 text-base font-bold transition-all duration-300 group-hover:bg-background"
          >
            Criar minha página grátis
            <span className="opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">
              →
            </span>
          </Link>
        </div>
        <a
          href="#planos"
          className="inline-flex h-[58px] items-center rounded-2xl border border-border px-7 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Ver planos
        </a>
      </motion.div>
    </section>
  );
}
