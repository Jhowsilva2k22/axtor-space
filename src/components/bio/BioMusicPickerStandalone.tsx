import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, ChevronDown, ChevronUp, Music2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useBioPreviewQueryKey } from "@/components/bio/BioFullPreview";

type MusicStyle = {
  slug: string;
  label: string;
  desc: string;
};

const MUSIC_STYLES: MusicStyle[] = [
  { slug: "jazz",      label: "Jazz Instrumental", desc: "Elegante e animado"    },
  { slug: "bossanova", label: "Bossa Nova",         desc: "Suave e brasileiro"   },
  { slug: "piano",     label: "Piano Solo",         desc: "Delicado e refinado"  },
  { slug: "violino",   label: "Violino",            desc: "Clássico e envolvente" },
  { slug: "lofi",      label: "Lo-fi Acústico",     desc: "Relaxante e moderno"  },
];

const SURPRESA_LABEL = "Surpresa";

export const BioMusicPickerStandalone = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const { canUseThemes, isFree } = usePlanLimits();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingSlug, setApplyingSlug] = useState<string | null | "__surpresa__">(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("bio_config")
      .select("ambient_music_style")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setActiveSlug((data as any)?.ambient_music_style ?? null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tenantId]);

  const apply = async (slug: string | null) => {
    const key = slug ?? "__surpresa__";
    setApplyingSlug(key);
    const { error } = await supabase
      .from("bio_config")
      .update({ ambient_music_style: slug })
      .eq("tenant_id", tenantId);
    setApplyingSlug(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setActiveSlug(slug);
    queryClient.invalidateQueries({ queryKey: useBioPreviewQueryKey(tenantId) });
    const label = slug ? (MUSIC_STYLES.find((s) => s.slug === slug)?.label ?? slug) : SURPRESA_LABEL;
    toast.success(`Ritmo "${label}" aplicado.`);
  };

  const activeLabel = activeSlug
    ? (MUSIC_STYLES.find((s) => s.slug === activeSlug)?.label ?? activeSlug)
    : SURPRESA_LABEL;

  if (!canUseThemes) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-lg">Ritmo da bio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recurso exclusivo do plano <strong className="text-gold">Pro</strong>. Define o
              estilo musical que toca quando visitantes abrem sua bio.
            </p>
            {isFree && (
              <p className="mt-2 text-[10px] uppercase tracking-widest text-gold">
                Upgrade em breve
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg">Ritmo da bio</h3>
          <span className="rounded-sm border border-gold/40 bg-card/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {activeLabel}
          </span>
        </div>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border text-muted-foreground">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {/* Opção Surpresa (random) */}
              {(() => {
                const isActive = activeSlug === null;
                const isApplying = applyingSlug === "__surpresa__";
                return (
                  <div
                    key="surpresa"
                    className={`flex items-center justify-between gap-3 rounded-sm border p-3 transition ${
                      isActive
                        ? "border-gold bg-gradient-gold-soft"
                        : "border-border bg-card/30 hover:border-gold/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{SURPRESA_LABEL}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        aleatório
                      </p>
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary">
                        <Check className="h-3 w-3" /> Ativo
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!!applyingSlug}
                        onClick={() => apply(null)}
                      >
                        {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar"}
                      </Button>
                    )}
                  </div>
                );
              })()}

              {/* Estilos com nome */}
              {MUSIC_STYLES.map((style) => {
                const isActive = activeSlug === style.slug;
                const isApplying = applyingSlug === style.slug;
                return (
                  <div
                    key={style.slug}
                    className={`flex items-center justify-between gap-3 rounded-sm border p-3 transition ${
                      isActive
                        ? "border-gold bg-gradient-gold-soft"
                        : "border-border bg-card/30 hover:border-gold/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{style.label}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {style.desc}
                      </p>
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary">
                        <Check className="h-3 w-3" /> Ativo
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!!applyingSlug}
                        onClick={() => apply(style.slug)}
                      >
                        {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Visitantes ouvem o ritmo escolhido ao abrir sua bio. Volume sutil, com botão mute.
          </p>
        </div>
      )}
    </Card>
  );
};
