import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

/**
 * Onda 4 Fase 6 — Tela de boas-vindas pós-pagamento.
 *
 * Sequência (timings em segundos a partir do mount):
 *  - 0.0  Black screen + pulse dourado expandindo + sino discreto (Web Audio API)
 *  - 0.6  "AXTOR SPACE" fadeIn grande
 *  - 1.0  Confete dourado dispara dos cantos
 *  - 1.4  "Bem-vindo, [primeiro nome]" fadeIn
 *  - 1.9  Linha do plano/addon ativo fadeIn
 *  - 2.6  Card com features liberadas começa a aparecer
 *  - 3.0+ Features checking fadeIn em sequência (200ms cada)
 *  - 5.0  Botão "Começar agora" fadeIn
 *  - 12.0 Auto-redirect pra /painel (com countdown sutil)
 *
 * Pode ser interrompida a qualquer momento clicando no botão.
 */

// =============================================================================
// Sino discreto via Web Audio API (sem asset de áudio)
// =============================================================================

const playSino = () => {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    // Acorde discreto: dó (C4) + sol (G4) tocados juntos, baixo volume, 1.5s
    [261.63, 392.0].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.6);
    });
  } catch {
    // Web Audio bloqueado por algum motivo — silencia sem quebrar a UX
  }
};

// =============================================================================
// Confete dourado custom — sem dep externa
// =============================================================================

type ConfettiParticle = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  driftX: number;
};

const ConfeteDourado = ({ start }: { start: boolean }) => {
  const particles = useMemo<ConfettiParticle[]>(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        size: 5 + Math.random() * 7,
        rotate: (Math.random() - 0.5) * 720,
        driftX: (Math.random() - 0.5) * 80,
      })),
    [],
  );

  if (!start) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block rounded-[2px] bg-gold shadow-[0_0_6px_rgba(220,180,80,0.5)]"
          initial={{ y: -30, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            x: p.driftX,
            rotate: p.rotate,
            opacity: [1, 1, 0.4, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
            times: [0, 0.6, 0.85, 1],
          }}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 1.4,
          }}
        />
      ))}
    </div>
  );
};

// =============================================================================
// Features liberadas por compra
// =============================================================================

const FEATURES_BY_SLUG: Record<string, { title: string; items: string[] }> = {
  pro: {
    title: "Plano Pro ativo",
    items: [
      "Blocos ilimitados na bio",
      "Diagnóstico Imersivo",
      "Banco de mídia organizado",
      "Métricas completas",
      "Tema visual customizado",
      "Sem selo Axtor na bio",
    ],
  },
  deep_diagnostic: {
    title: "Diagnóstico Imersivo liberado",
    items: [
      "Análise em 5 dimensões",
      "Relatório personalizado em PDF",
      "Sugestões de ação por perfil",
      "Compartilhamento com clientes",
    ],
  },
};

const fallbackFeatures = (slug: string) => ({
  title: `${slug.replace(/_/g, " ")} ativo`,
  items: ["Recurso liberado no seu ecossistema"],
});

// =============================================================================
// Componente principal
// =============================================================================

const BemVindo = () => {
  const { user, loading: authLoading } = useAuth();
  const { current, loading: tenantLoading } = useCurrentTenant();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [confettiOn, setConfettiOn] = useState(false);
  const [countdown, setCountdown] = useState(12);
  const [exiting, setExiting] = useState(false);
  const sinoPlayedRef = useRef(false);

  const type = (params.get("type") as "plan" | "addon" | null) ?? null;
  const slug = params.get("slug") ?? "";
  const firstName = (current?.display_name ?? "").split(" ")[0] || "Você";

  const features = FEATURES_BY_SLUG[slug] ?? fallbackFeatures(slug);

  // Toca o sino logo no mount (1x só)
  useEffect(() => {
    if (sinoPlayedRef.current) return;
    sinoPlayedRef.current = true;
    // Pequeno delay pra alinhar com o pulse visual
    const t = setTimeout(playSino, 100);
    return () => clearTimeout(t);
  }, []);

  // Liga o confete em t=1s
  useEffect(() => {
    const t = setTimeout(() => setConfettiOn(true), 1000);
    return () => clearTimeout(t);
  }, []);

  /**
   * Saída suave: pausa o countdown, dispara animação de fade + scale,
   * e só navega após a animação terminar (~900ms).
   * Centralizado pra ser reusado pelo botão e pelo auto-redirect.
   */
  const triggerExit = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      navigate(buildRedirectTarget(type, slug), { replace: true });
    }, 900);
  };

  // Countdown — quando bate 0, dispara saída suave (não navega seco)
  useEffect(() => {
    if (exiting) return;
    if (countdown <= 0) {
      triggerExit();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, exiting]);

  if (authLoading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  const handleAvancar = () => triggerExit();

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-black"
      animate={
        exiting
          ? { opacity: 0, scale: 1.04, filter: "blur(6px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Pulse dourado expandindo no centro */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{ width: 0, height: 0, opacity: 0.6 }}
        animate={{ width: "180vh", height: "180vh", opacity: 0 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle, rgba(220,180,80,0.35) 0%, rgba(220,180,80,0) 60%)",
        }}
      />

      {/* Confete dourado */}
      <ConfeteDourado start={confettiOn} />

      {/* Conteúdo central */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <AnimatePresence>
          {/* AXTOR SPACE */}
          <motion.h1
            key="brand"
            className="font-display text-5xl tracking-[0.25em] text-gold sm:text-6xl"
            initial={{ opacity: 0, y: 20, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.25em" }}
            transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
            style={{
              textShadow: "0 0 24px rgba(220,180,80,0.4)",
            }}
          >
            AXTOR SPACE
          </motion.h1>

          {/* Bem-vindo, primeiro nome */}
          <motion.p
            key="welcome"
            className="mt-6 font-display text-2xl text-primary sm:text-3xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease: "easeOut" }}
          >
            Bem-vindo, {firstName}
          </motion.p>

          {/* Subtexto */}
          <motion.p
            key="sub"
            className="mt-3 max-w-md text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.9, ease: "easeOut" }}
          >
            Seu {features.title.toLowerCase()} no ecossistema.
          </motion.p>

          {/* Card de features */}
          <motion.div
            key="features"
            className="mt-10 w-full max-w-md rounded-lg border border-gold/30 bg-card/40 p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 2.6, ease: "easeOut" }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-widest text-gold">
              {features.title}
            </p>
            <ul className="space-y-2 text-left text-sm">
              {features.items.map((item, idx) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-2 text-muted-foreground"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 3.0 + idx * 0.2,
                    ease: "easeOut",
                  }}
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.button
            key="cta"
            onClick={handleAvancar}
            className="mt-10 rounded-md border border-gold bg-gradient-gold-soft px-10 py-3 font-display text-sm uppercase tracking-[0.2em] text-primary transition hover:bg-gold/30 hover:shadow-[0_0_24px_rgba(220,180,80,0.4)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 3.0 + features.items.length * 0.2 + 0.6,
              ease: "easeOut",
            }}
          >
            Começar agora →
          </motion.button>

          {/* Countdown sutil */}
          <motion.p
            key="countdown"
            className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ duration: 0.4, delay: exiting ? 0 : 4.5 }}
          >
            {exiting ? "Levando você ao painel…" : `Avançando em ${countdown}s`}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Roteamento inteligente do "Começar agora" baseado no que foi comprado
// =============================================================================

const buildRedirectTarget = (
  type: "plan" | "addon" | null,
  slug: string,
): string => {
  const base = "/painel?activated=true";
  if (type && slug) {
    return `${base}&type=${type}&slug=${encodeURIComponent(slug)}`;
  }
  return base;
};

export default BemVindo;
