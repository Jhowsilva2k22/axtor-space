import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, ChevronDown, ChevronUp, Palette, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useBioPreviewQueryKey } from "@/components/bio/BioFullPreview";

/**
 * Onda 3 v2 Fase 3 (refactor PR4) — escolha de tema visual da bio.
 * Versão SIMPLIFICADA do que existe em /admin/templates: mostra a lista de
 * temas + botão Aplicar. Sem preview iframe (fica pra Onda 3.6 redesign).
 *
 * Acesso: Pro+ (canUseThemes via plan_features). Free vê UpgradeBlock.
 */

type Theme = {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
};

export const BioThemePickerStandalone = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const { canUseThemes, isFree } = usePlanLimits();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeSlug, setActiveSlug] = useState("gold-noir");
  const [loading, setLoading] = useState(true);
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: cfg }] = await Promise.all([
      supabase
        .from("bio_themes")
        .select("id, slug, name, is_default")
        .order("is_default", { ascending: false })
        .order("name"),
      supabase
        .from("bio_config")
        .select("active_theme_slug")
        .eq("tenant_id", tenantId)
        .maybeSingle(),
    ]);
    setThemes((t as Theme[] | null) ?? []);
    setActiveSlug(((cfg as any)?.active_theme_slug as string) ?? "gold-noir");
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const apply = async (slug: string) => {
    setApplyingSlug(slug);
    const { error } = await supabase
      .from("bio_config")
      .update({ active_theme_slug: slug })
      .eq("tenant_id", tenantId);
    setApplyingSlug(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setActiveSlug(slug);
    queryClient.invalidateQueries({ queryKey: useBioPreviewQueryKey(tenantId) });
    toast.success(`Tema "${slug}" aplicado.`);
  };

  // Free: bloqueia totalmente.
  if (!canUseThemes) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-lg">Tema visual da bio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recurso exclusivo do plano <strong className="text-gold">Pro</strong>. Personaliza
              cores, tipografia e estilo da sua bio pública.
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
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg">Tema visual</h3>
          <span className="rounded-sm border border-gold/40 bg-card/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {activeSlug}
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
          ) : themes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum tema disponível.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {themes.map((t) => {
                const isActive = activeSlug === t.slug;
                const isApplying = applyingSlug === t.slug;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-3 rounded-sm border p-3 transition ${
                      isActive ? "border-gold bg-gradient-gold-soft" : "border-border bg-card/30 hover:border-gold/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        /{t.slug}
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
                        disabled={isApplying}
                        onClick={() => apply(t.slug)}
                      >
                        {isApplying ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            A mudança aparece só na bio pública. Painel admin sempre fica no tema padrão.
          </p>
        </div>
      )}
    </Card>
  );
};
