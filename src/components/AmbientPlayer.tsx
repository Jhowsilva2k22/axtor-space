import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "bio-ambient-pref"; // "on" | "off"
const TARGET_VOLUME = 0.18; // muito sutil — ambiente, não trilha
const FADE_DURATION_MS = 4000;

/**
 * Player ambiente premium — fade-in lento, loop suave, controle discreto,
 * lembra preferência do visitante. Tenta autoplay mudo + convite a ativar.
 */
const AmbientPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pulse, setPulse] = useState(false); // halo dourado convidando a ativar

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
      setPulse(false);
      fadeTo(TARGET_VOLUME);
      localStorage.setItem(STORAGE_KEY, "on");
    } catch {
      // navegador bloqueou — mostra pulse pra convidar clique
      setPulse(true);
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

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      <button
        onClick={() => (playing ? stop() : start())}
        aria-label={playing ? "Silenciar ambiente sonoro" : "Ativar ambiente sonoro"}
        title={playing ? "Silenciar" : "Ativar som"}
        className={`group fixed right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-gold bg-background/70 backdrop-blur-sm transition-all hover:bg-gradient-gold-soft ${
          pulse ? "animate-pulse shadow-gold" : ""
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