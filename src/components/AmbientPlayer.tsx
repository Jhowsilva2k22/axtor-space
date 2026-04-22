import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "bio-ambient-pref"; // "on" | "off"
const TARGET_VOLUME = 0.18; // muito sutil — ambiente, não trilha
const FADE_DURATION_MS = 4000;

/**
 * Player ambiente premium — fade-in lento, loop suave, controle discreto,
 * lembra preferência do visitante. Tenta autoplay mudo + convite a ativar.
 */
const TRACKS = [
  "/music/dreams.mp3",
  "/music/betterdays.mp3",
  "/music/deepblue.mp3",
  "/music/relaxing.mp3",
  "/music/sweet.mp3",
  "/music/november.mp3",
  "/music/thelounge.mp3",
  "/music/newdawn.mp3",
];

const AmbientPlayer = () => {
  const src = TRACKS[Math.floor(Math.random() * TRACKS.length)];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [hint, setHint] = useState(false); // tooltip dourado convidando

  const fadeTo = (target: number, durationMs = FADE_DURATION_MS) => {
    const a = audioRef.current;
    if (!a) return;
    if (fadeTimer.current) window.clearInterval(fadeTimer.current);
    const start = a.volume;
    const startedAt = performance.now();
    fadeTimer.current = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - startedAt) / durationMs);
      a.volume = start + (target - start) * t;
      if (t >= 1 && fadeTimer.current) {
        window.clearInterval(fadeTimer.current);
        fadeTimer.current = null;
        if (target === 0) a.pause();
      }
    }, 50);
  };

  const start = async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.volume = 0;
      await a.play();
      setPlaying(true);
      setNeedsGesture(false);
      setHint(false);
      fadeTo(TARGET_VOLUME);
      localStorage.setItem(STORAGE_KEY, "on");
    } catch (err) {
      // navegador bloqueou — precisa de interação
      console.info("[AmbientPlayer] autoplay bloqueado, aguardando interação", err);
      setNeedsGesture(true);
      setHint(true);
      // some o hint depois de 6s pra não ficar invasivo
      window.setTimeout(() => setHint(false), 6000);
    }
  };

  const stop = () => {
    setPlaying(false);
    fadeTo(0, 800);
    localStorage.setItem(STORAGE_KEY, "off");
  };

  // Tentativa inicial: respeitar preferência salva, ou tentar autoplay sutil
  useEffect(() => {
    const pref = localStorage.getItem(STORAGE_KEY);
    if (pref === "off") return;
    // pequena espera pra renderizar antes de tocar
    const t = window.setTimeout(() => start(), 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: qualquer interação na página (clique, toque, scroll, tecla)
  // ativa o som se ainda não tocou e a preferência não é "off"
  useEffect(() => {
    if (!needsGesture) return;
    const handler = () => {
      const pref = localStorage.getItem(STORAGE_KEY);
      if (pref === "off") return;
      start();
    };
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", handler, opts);
    window.addEventListener("keydown", handler, opts);
    window.addEventListener("touchstart", handler, opts);
    window.addEventListener("scroll", handler, opts);
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("scroll", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsGesture]);

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      {hint && (
        <div className="pointer-events-none fixed right-16 top-6 z-30 hidden animate-fade-up rounded-sm border border-gold bg-background/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-primary shadow-gold backdrop-blur sm:block">
          toque pra ativar som ✨
        </div>
      )}
      <button
        onClick={() => (playing ? stop() : start())}
        aria-label={playing ? "Silenciar ambiente sonoro" : "Ativar ambiente sonoro"}
        title={playing ? "Silenciar" : "Ativar som"}
        className={`group fixed right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-gold bg-background/70 backdrop-blur-sm transition-all hover:bg-gradient-gold-soft ${
          needsGesture ? "animate-pulse shadow-gold" : ""
        }`}
      >
        {playing ? (
          <Volume2 className="h-4 w-4 text-primary" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        )}
      </button>
    </>
  );
};

export default AmbientPlayer;