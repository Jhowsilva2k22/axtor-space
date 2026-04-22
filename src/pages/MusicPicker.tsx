import { useEffect, useRef, useState } from "react";
import { Play, Pause, Check } from "lucide-react";

const TRACKS = [
  { id: "dreams",     label: "Dreams",      vibe: "piano + textura sonhadora, lento, abre o peito" },
  { id: "betterdays", label: "Better Days", vibe: "piano puro, passos leves, esperança madura" },
  { id: "deepblue",   label: "Deep Blue",   vibe: "piano introspectivo, profundo, noturno" },
  { id: "relaxing",   label: "Relaxing",    vibe: "piano contemplativo, respiração lenta" },
  { id: "sweet",      label: "Sweet",       vibe: "piano doce, paterno, memórias de infância" },
  { id: "november",   label: "November",    vibe: "piano nostálgico, frio bonito, reflexão" },
  { id: "thelounge",  label: "The Lounge",  vibe: "piano lounge, hotel boutique, charme noir" },
  { id: "newdawn",    label: "New Dawn",    vibe: "piano solene, recomeço, força silenciosa" },
];

const MusicPicker = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(() => localStorage.getItem("bio-music-pick"));

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(`/previews/${id}.mp3`);
    a.volume = 0.5;
    audioRef.current = a;
    a.onended = () => setPlayingId(null);
    a.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null));
  };

  const choose = (id: string) => {
    localStorage.setItem("bio-music-pick", id);
    setChosen(id);
  };

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-12">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">curadoria sonora</p>
          <h1 className="mt-2 font-display text-3xl">
            Escolha a <span className="text-gold italic">trilha</span> da bio
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-light text-muted-foreground">
            Toca cada preview de 15s. A escolhida toca em loop suave quando alguém abrir sua /bio.
          </p>
        </header>

        <div className="mt-10 space-y-3">
          {TRACKS.map((t) => {
            const isPlaying = playingId === t.id;
            const isChosen = chosen === t.id;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-4 rounded-sm border p-4 transition-all ${
                  isChosen ? "border-gold bg-gradient-gold-soft shadow-gold" : "border-gold/40 bg-card/60 hover:border-gold"
                }`}
              >
                <button
                  onClick={() => toggle(t.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-gold bg-background/40 text-primary transition-all hover:bg-gradient-gold-soft"
                  aria-label={isPlaying ? "Pausar" : "Tocar"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium uppercase tracking-[0.08em]">{t.label}</p>
                  <p className="mt-0.5 truncate text-xs font-light text-muted-foreground">{t.vibe}</p>
                </div>
                <button
                  onClick={() => choose(t.id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-sm border px-4 text-[10px] uppercase tracking-[0.2em] transition-all ${
                    isChosen
                      ? "border-gold bg-background/40 text-primary"
                      : "border-border text-muted-foreground hover:border-gold hover:text-primary"
                  }`}
                >
                  {isChosen ? <><Check className="h-3.5 w-3.5" /> escolhida</> : "usar essa"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {chosen ? <>trilha atual: <span className="text-primary">{TRACKS.find((x) => x.id === chosen)?.label}</span> · abra <a href="/bio" className="text-primary underline-offset-4 hover:underline">/bio</a> pra ver no contexto</> : "nenhuma escolhida ainda"}
        </p>
      </main>
    </div>
  );
};

export default MusicPicker;