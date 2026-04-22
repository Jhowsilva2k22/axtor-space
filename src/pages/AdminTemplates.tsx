import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useThemeContext, type ThemeTokens } from "@/components/ThemeProvider";
import { useAdminLockedTheme } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Check, Eye, EyeOff, Star, RotateCcw } from "lucide-react";

type ThemeRow = {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  tokens: ThemeTokens;
};

const AdminTemplates = () => {
  const { user, loading: authLoading } = useAuth();
  useAdminLockedTheme();
  const { activeSlug, previewSlug, setPreview } = useThemeContext();
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [activeDb, setActiveDb] = useState<string>("gold-noir");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = async () => {
    const [{ data: t }, { data: cfg }] = await Promise.all([
      supabase.from("bio_themes").select("*").order("is_default", { ascending: false }).order("name"),
      supabase.from("bio_config").select("active_theme_slug").eq("singleton", true).maybeSingle(),
    ]);
    setThemes((t as any) ?? []);
    setActiveDb(((cfg as any)?.active_theme_slug as string) ?? "gold-noir");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  if (authLoading) return <FullLoader />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const setActive = async (slug: string) => {
    setSaving(slug);
    const { error } = await supabase
      .from("bio_config")
      .update({ active_theme_slug: slug })
      .eq("singleton", true);
    setSaving(null);
    if (error) {
      toast.error("Erro ao definir tema ativo");
      return;
    }
    setActiveDb(slug);
    setPreview(null);
    toast.success(`Tema "${slug}" agora é o ativo no público`);
  };

  const resetToDefault = async () => {
    await setActive("gold-noir");
  };

  const isPreviewing = (slug: string) => previewSlug === slug;
  const isActive = (slug: string) => activeDb === slug;

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link to="/admin" className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> voltar ao admin
            </Link>
            <h1 className="font-display text-4xl text-foreground">Templates de Designer</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pré-visualize ao vivo (só você vê) ou defina como ativo (todo público vê).
            </p>
          </div>
          <button
            onClick={resetToDefault}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:shadow-gold"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Voltar pro padrão (Gold Noir)
          </button>
        </div>

        {previewSlug && previewSlug !== activeDb && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-sm border border-gold bg-gradient-gold-soft px-4 py-3">
            <div className="text-xs">
              <span className="font-medium uppercase tracking-[0.2em] text-primary">Pré-visualizando: {previewSlug}</span>
              <span className="ml-2 text-muted-foreground">— só visível pra você. Público ainda vê: {activeDb}</span>
            </div>
            <button onClick={() => setPreview(null)} className="text-[10px] uppercase tracking-[0.2em] text-primary underline">
              encerrar preview
            </button>
          </div>
        )}

        {loading ? (
          <FullLoader />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isActive={isActive(t.slug)}
                isPreviewing={isPreviewing(t.slug)}
                saving={saving === t.slug}
                onPreview={() => setPreview(isPreviewing(t.slug) ? null : t.slug)}
                onActivate={() => setActive(t.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ThemeCard = ({
  theme,
  isActive,
  isPreviewing,
  saving,
  onPreview,
  onActivate,
}: {
  theme: ThemeRow;
  isActive: boolean;
  isPreviewing: boolean;
  saving: boolean;
  onPreview: () => void;
  onActivate: () => void;
}) => {
  const t = theme.tokens;
  const brandColor = `hsl(${t.brandH} ${t.brandS} ${t.brandL})`;
  const bgColor = `hsl(${t.surfaceH ?? 0} ${t.surfaceS ?? "0%"} ${t.surfaceLBg ?? "5%"})`;
  const cardColor = `hsl(${t.surfaceH ?? 0} ${t.surfaceS ?? "0%"} ${t.surfaceLCard ?? "8%"})`;
  const borderColor = `hsl(${t.surfaceH ?? 0} ${t.surfaceS ?? "0%"} ${t.surfaceLBorder ?? "14%"})`;
  const fgL = parseFloat((t.surfaceLBg ?? "5%").replace("%", ""));
  const fgColor = fgL > 50 ? "hsl(0 0% 10%)" : "hsl(40 25% 92%)";
  const mutedColor = fgL > 50 ? "hsl(0 0% 35%)" : "hsl(40 10% 65%)";

  return (
    <div className={`relative overflow-hidden rounded-sm border bg-card/40 transition-all ${isActive ? "border-gold shadow-gold" : "border-gold/40"}`}>
      {isActive && (
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-sm border border-gold bg-background/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-primary backdrop-blur">
          <Star className="h-3 w-3" /> Ativo
        </div>
      )}
      {theme.is_default && !isActive && (
        <div className="absolute right-3 top-3 z-10 rounded-sm border border-gold/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
          Padrão
        </div>
      )}

      {/* Mini preview */}
      <div
        className="relative h-44 overflow-hidden p-4"
        style={{ background: bgColor, fontFamily: t.fontBody }}
      >
        {t.auroraEnabled && (
          <div
            className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
            style={{ background: brandColor, opacity: t.auroraOpacity ?? 0.3 }}
          />
        )}
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border text-base"
            style={{ borderColor: brandColor, color: brandColor, fontFamily: t.fontDisplay }}
          >
            J
          </div>
          <div>
            <p className="text-xs" style={{ color: fgColor, fontFamily: t.fontDisplay, fontSize: 16 }}>
              Joanderson
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: brandColor }}>
              link in bio
            </p>
          </div>
        </div>
        <div className="relative mt-4 space-y-1.5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 border px-2 py-1.5"
              style={{
                background: cardColor,
                borderColor,
                borderRadius: t.radius ?? "0.125rem",
              }}
            >
              <div
                className="h-5 w-5"
                style={{ background: brandColor, opacity: 0.85, borderRadius: t.radius ?? "0.125rem" }}
              />
              <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: fgColor }}>
                Bloco exemplo
              </span>
              <span className="ml-auto text-[10px]" style={{ color: mutedColor }}>↗</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gold/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg text-foreground">{theme.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{theme.slug}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onPreview}
            disabled={isActive}
            style={{
              borderColor: isPreviewing ? "hsl(43 55% 54%)" : "hsl(43 55% 54% / 0.4)",
              background: isPreviewing
                ? "linear-gradient(135deg, hsl(43 55% 54% / 0.18), hsl(43 55% 54% / 0.06))"
                : "transparent",
              color: isPreviewing ? "hsl(43 55% 68%)" : "hsl(40 10% 65%)",
            }}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border px-3 text-[10px] uppercase tracking-[0.2em] transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:!border-[hsl(43_55%_54%)] hover:!text-[hsl(43_55%_68%)]"
          >
            {isPreviewing ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {isPreviewing ? "encerrar" : "preview"}
          </button>
          <button
            onClick={onActivate}
            disabled={isActive || saving}
            style={{
              borderColor: "hsl(43 55% 54%)",
              background:
                "linear-gradient(135deg, hsl(43 55% 54% / 0.22), hsl(43 55% 54% / 0.08))",
              color: "hsl(43 55% 72%)",
            }}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border px-3 text-[10px] uppercase tracking-[0.2em] transition-all hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            {isActive ? "ativo" : "definir ativo"}
          </button>
        </div>
      </div>
    </div>
  );
};

const FullLoader = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export default AdminTemplates;