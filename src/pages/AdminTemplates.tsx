import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type ThemeTokens } from "@/components/ThemeProvider";
import { useAdminLockedTheme } from "@/components/ThemeToggle";
import { TenantSelector } from "@/components/TenantSelector";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Check,
  Star,
  RotateCcw,
  Smartphone,
  Monitor,
  ExternalLink,
} from "lucide-react";

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
  const { current: currentTenant, loading: tenantLoading } = useCurrentTenant();
  const currentTenantId = currentTenant?.id ?? null;
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [activeDb, setActiveDb] = useState<string>("gold-noir");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const refresh = async () => {
    if (!currentTenantId) return;
    setLoading(true);
    const [{ data: t }, { data: cfg }] = await Promise.all([
      supabase.from("bio_themes").select("*").order("is_default", { ascending: false }).order("name"),
      supabase.from("bio_config").select("active_theme_slug").eq("tenant_id", currentTenantId).maybeSingle(),
    ]);
    setThemes((t as any) ?? []);
    setActiveDb(((cfg as any)?.active_theme_slug as string) ?? "gold-noir");
    setLoading(false);
  };

  useEffect(() => {
    if (!currentTenantId) return;
    refresh();
    setSelectedSlug(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenantId]);

  useEffect(() => {
    if (!selectedSlug && themes.length > 0) {
      setSelectedSlug(activeDb);
    }
  }, [themes, activeDb, selectedSlug]);

  if (authLoading) return <FullLoader />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const setActive = async (slug: string) => {
    if (!currentTenantId) {
      toast.error("Selecione um tenant antes de aplicar o tema");
      return;
    }
    setSaving(slug);
    const { error } = await supabase
      .from("bio_config")
      .update({ active_theme_slug: slug })
      .eq("tenant_id", currentTenantId);
    setSaving(null);
    if (error) {
      toast.error("Erro ao definir tema ativo");
      return;
    }
    setActiveDb(slug);
    toast.success(`Tema "${slug}" agora é o ativo no público`);
  };

  const resetToDefault = async () => {
    setSelectedSlug("gold-noir");
    await setActive("gold-noir");
  };

  const isActive = (slug: string) => activeDb === slug;
  const selectedTheme = useMemo(
    () => themes.find((t) => t.slug === selectedSlug) ?? null,
    [themes, selectedSlug]
  );
  const previewUrl = selectedSlug ? `/bio?preview=${encodeURIComponent(selectedSlug)}` : "/bio";

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/admin" className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> voltar ao admin
            </Link>
            <h1 className="font-display text-4xl text-foreground">Templates da bio</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Selecione um template à esquerda, veja a prévia ao vivo da sua bio à direita e clique em <span className="text-primary">aplicar</span> quando estiver pronto.
              <span className="mt-1 block text-[11px] text-muted-foreground/70">
                O painel admin sempre fica no tema padrão. A mudança aparece só na bio pública.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
          <TenantSelector />
          <button
            onClick={resetToDefault}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:shadow-gold"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Voltar pro padrão
          </button>
          </div>
        </div>

        {tenantLoading ? (
          <FullLoader />
        ) : !currentTenantId ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-sm border-gold-gradient bg-card/40 p-8 text-center">
            <p className="font-display text-xl text-foreground">Selecione um tenant</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Escolha um tenant no seletor acima pra gerenciar os templates da bio dele.
            </p>
          </div>
        ) : loading ? (
          <FullLoader />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* coluna esquerda: lista de templates */}
            <div className="space-y-3">
              {themes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={isActive(t.slug)}
                  isSelected={selectedSlug === t.slug}
                  onSelect={() => setSelectedSlug(t.slug)}
                />
              ))}
            </div>

            {/* coluna direita: preview ao vivo */}
            <div className="lg:sticky lg:top-6 h-fit space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border-gold-gradient bg-card/40 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">prévia ao vivo</p>
                  <p className="truncate font-display text-lg text-foreground">
                    {selectedTheme?.name ?? "Selecione um template"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-sm border border-gold/40 bg-background/60 p-0.5">
                    <button
                      onClick={() => setDevice("mobile")}
                      aria-label="Prévia em celular"
                      className={`flex h-8 w-8 items-center justify-center rounded-sm transition ${device === "mobile" ? "bg-gradient-gold-soft text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDevice("desktop")}
                      aria-label="Prévia em tela larga"
                      className={`flex h-8 w-8 items-center justify-center rounded-sm transition ${device === "desktop" ? "bg-gradient-gold-soft text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-sm border border-gold/40 bg-background/60 px-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
                  >
                    abrir <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex justify-center rounded-sm border-gold-gradient bg-card/20 p-4">
                <div
                  className="overflow-hidden rounded-[1.25rem] border border-gold/30 bg-background shadow-deep transition-all"
                  style={{
                    width: device === "mobile" ? 390 : "100%",
                    maxWidth: device === "desktop" ? 920 : 390,
                    height: 720,
                  }}
                >
                  <iframe
                    key={`${selectedSlug}-${device}`}
                    src={previewUrl}
                    title="Prévia da bio"
                    className="h-full w-full border-0"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border-gold-gradient bg-card/40 px-4 py-3">
                <div className="text-[11px] text-muted-foreground">
                  {selectedSlug && isActive(selectedSlug)
                    ? <>Este template já está <span className="text-primary">ativo</span> pro público.</>
                    : <>Tema atual no público: <span className="text-foreground">{activeDb}</span></>}
                </div>
                <button
                  onClick={() => selectedSlug && setActive(selectedSlug)}
                  disabled={!selectedSlug || isActive(selectedSlug ?? "") || saving !== null}
                  className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft px-5 text-[11px] uppercase tracking-[0.25em] text-primary transition-all hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving === selectedSlug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {selectedSlug && isActive(selectedSlug) ? "ativo" : "aplicar este template"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ThemeCard = ({
  theme,
  isActive,
  isSelected,
  onSelect,
}: {
  theme: ThemeRow;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const t = theme.tokens;
  const brandColor = `hsl(${t.brandH} ${t.brandS} ${t.brandL})`;
  const bgColor = `hsl(${t.surfaceH ?? 0} ${t.surfaceS ?? "0%"} ${t.surfaceLBg ?? "5%"})`;
  const cardColor = `hsl(${t.surfaceH ?? 0} ${t.surfaceS ?? "0%"} ${t.surfaceLCard ?? "8%"})`;
  const borderColor = `hsl(${t.surfaceH ?? 0} ${t.surfaceS ?? "0%"} ${t.surfaceLBorder ?? "14%"})`;
  const fgL = parseFloat((t.surfaceLBg ?? "5%").replace("%", ""));
  const fgColor = fgL > 50 ? "hsl(0 0% 10%)" : "hsl(40 25% 92%)";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-sm border bg-card/40 text-left transition-all ${
        isSelected ? "border-gold shadow-gold ring-1 ring-primary/40" : "border-gold/30 hover:border-gold/70"
      }`}
    >
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-gold bg-background/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-primary backdrop-blur">
            <Star className="h-3 w-3" /> ativo
          </span>
        )}
        {theme.is_default && !isActive && (
          <span className="rounded-sm border border-gold/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            padrão
          </span>
        )}
      </div>

      <div
        className="relative h-32 overflow-hidden p-3"
        style={{ background: bgColor, fontFamily: t.fontBody }}
      >
        {t.auroraEnabled && (
          <div
            className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl"
            style={{ background: brandColor, opacity: t.auroraOpacity ?? 0.3 }}
          />
        )}
        <div className="relative flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border text-sm"
            style={{ borderColor: brandColor, color: brandColor, fontFamily: t.fontDisplay }}
          >
            J
          </div>
          <p className="text-xs" style={{ color: fgColor, fontFamily: t.fontDisplay, fontSize: 14 }}>
            Joanderson
          </p>
        </div>
        <div className="relative mt-3 space-y-1">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 border px-2 py-1"
              style={{
                background: cardColor,
                borderColor,
                borderRadius: t.radius ?? "0.125rem",
              }}
            >
              <div
                className="h-3 w-3"
                style={{ background: brandColor, opacity: 0.85, borderRadius: t.radius ?? "0.125rem" }}
              />
              <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: fgColor }}>
                bloco
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gold/30 px-4 py-3">
        <p className="font-display text-base text-foreground">{theme.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{theme.slug}</p>
      </div>
    </button>
  );
};

const FullLoader = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export default AdminTemplates;
