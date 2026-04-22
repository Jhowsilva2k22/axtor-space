import { useEffect, useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Check, Search, ChevronDown, Sparkles, Loader2, X, RotateCcw, History, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICON_GROUPS: { label: string; icons: string[] }[] = [
  { label: "Redes sociais", icons: ["Instagram","Facebook","Youtube","Twitter","Linkedin","Github","Twitch","Music2","Music","Send","MessageCircle","Mail"] },
  { label: "Conteúdo & produto", icons: ["BookOpen","Book","FileText","Newspaper","GraduationCap","Video","Film","Mic","Headphones","PlayCircle","Image","Camera"] },
  { label: "Negócios & CTA", icons: ["Sparkles","Crown","Star","Heart","Flame","Zap","Trophy","Award","Target","Rocket","TrendingUp","Gift"] },
  { label: "Comércio & serviço", icons: ["ShoppingBag","ShoppingCart","Tag","Briefcase","Handshake","CreditCard","DollarSign","Wallet","Package","Store","Receipt","Percent"] },
  { label: "Contato & local", icons: ["Phone","PhoneCall","MapPin","Map","Calendar","Clock","Globe","Compass","Navigation","Home","Building2","Users"] },
  { label: "Genéricos", icons: ["Link2","Link","ExternalLink","ArrowRight","ArrowUpRight","Bookmark","Share2","Download","Upload","Settings","Info","HelpCircle"] },
];
const ALL_ICONS = Array.from(new Set(ICON_GROUPS.flatMap((g) => g.icons)));

const MAX_GEN = 5;

type Style = "linear_gold" | "solid_gold" | "duotone_gold";
const STYLES: { v: Style; l: string; desc: string }[] = [
  { v: "linear_gold", l: "Linear dourado", desc: "Traço fino, fundo transparente" },
  { v: "solid_gold", l: "Sólido dourado", desc: "Preenchido, mais peso visual" },
  { v: "duotone_gold", l: "Duotone dourado", desc: "Traço + preenchimento suave" },
];

type Generation = {
  id: string;
  block_id: string | null;
  icon_url: string;
  prompt: string;
  style: string;
  created_at: string;
};

type Props = {
  value: string | null;
  onChange: (icon: string) => void;
  iconUrl?: string | null;
  onIconUrlChange?: (url: string | null) => void;
  blockId?: string;
  generationsUsed?: number;
  onGenerationsUsedChange?: (n: number) => void;
};

export const IconPicker = ({
  value,
  onChange,
  iconUrl,
  onIconUrlChange,
  blockId,
  generationsUsed = 0,
  onGenerationsUsedChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"library" | "ai" | "history" | "gallery">(
    iconUrl ? "ai" : "library",
  );
  const [aiPrompt, setAiPrompt] = useState("");
  const [style, setStyle] = useState<Style>("linear_gold");
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [gallery, setGallery] = useState<Generation[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [loadingGal, setLoadingGal] = useState(false);

  const Current = (value && (LucideIcons as any)[value]) || LucideIcons.Link2;
  const remaining = Math.max(0, MAX_GEN - generationsUsed);
  const atLimit = remaining <= 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  // Lazy load history quando abre a aba
  useEffect(() => {
    if (!open) return;
    if (tab === "history" && blockId && history.length === 0) {
      setLoadingHist(true);
      supabase
        .from("bio_icon_generations")
        .select("*")
        .eq("block_id", blockId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setHistory((data as any) ?? []);
          setLoadingHist(false);
        });
    }
    if (tab === "gallery" && gallery.length === 0) {
      setLoadingGal(true);
      supabase
        .from("bio_icon_generations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60)
        .then(({ data }) => {
          setGallery((data as any) ?? []);
          setLoadingGal(false);
        });
    }
  }, [open, tab, blockId, history.length, gallery.length]);

  const renderIcon = (name: string) => {
    const Comp = (LucideIcons as any)[name];
    if (!Comp) return null;
    const active = name === value && !iconUrl;
    return (
      <button
        key={name}
        type="button"
        onClick={() => {
          onChange(name);
          onIconUrlChange?.(null);
          setOpen(false);
          setQuery("");
        }}
        title={name}
        className={`group relative flex h-11 items-center justify-center rounded-sm border transition-all ${
          active
            ? "border-gold bg-gradient-gold-soft text-primary"
            : "border-border bg-card/40 text-muted-foreground hover:border-gold/60 hover:text-primary"
        }`}
      >
        <Comp className="h-4 w-4" />
        {active && <Check className="absolute right-1 top-1 h-3 w-3 text-primary" />}
      </button>
    );
  };

  const handleGenerate = async () => {
    if (!blockId) return toast.error("Salve o bloco antes de gerar um ícone com IA");
    if (atLimit) return toast.error(`Limite de ${MAX_GEN} gerações por bloco atingido`);
    const desc = aiPrompt.trim();
    if (desc.length < 3) return toast.error("Descreva o que o ícone deve representar");

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-icon", {
        body: { block_id: blockId, description: desc, style },
      });
      if (error) throw new Error(error.message);
      if (!data?.icon_url) throw new Error("Sem URL retornada");
      onIconUrlChange?.(data.icon_url);
      onGenerationsUsedChange?.(data.used ?? generationsUsed + 1);
      // refresh local lists
      setHistory([]);
      setGallery([]);
      toast.success("Ícone gerado!");
      setAiPrompt("");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar ícone");
    } finally {
      setGenerating(false);
    }
  };

  const pickGenerated = (url: string) => {
    onIconUrlChange?.(url);
    toast.success("Ícone aplicado");
    setOpen(false);
  };

  const resetIcon = () => {
    onIconUrlChange?.(null);
    toast.success("Voltou ao ícone da biblioteca");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-sm border border-gold bg-input px-3 text-sm text-foreground transition-all hover:bg-card/60"
        >
          <span className="flex items-center gap-2 min-w-0">
            {iconUrl ? (
              <img src={iconUrl} alt="" className="h-5 w-5 rounded-sm object-contain" />
            ) : (
              <Current className="h-4 w-4 text-primary" />
            )}
            <span className="truncate">{iconUrl ? "Ícone IA" : value || "Escolher ícone"}</span>
          </span>
          <span className="flex items-center gap-2">
            {iconUrl && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  resetIcon();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    resetIcon();
                  }
                }}
                title="Resetar (volta ao ícone da biblioteca)"
                className="rounded-sm border border-border p-1 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(460px,92vw)] rounded-sm border-gold bg-popover p-0">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="library"
              className="rounded-none border-r border-border data-[state=active]:bg-gradient-gold-soft data-[state=active]:text-primary text-[10px] uppercase tracking-[0.15em]"
            >
              Biblioteca
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-none border-r border-border data-[state=active]:bg-gradient-gold-soft data-[state=active]:text-primary text-[10px] uppercase tracking-[0.15em]"
            >
              <Sparkles className="mr-1 h-3 w-3" /> IA
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-r border-border data-[state=active]:bg-gradient-gold-soft data-[state=active]:text-primary text-[10px] uppercase tracking-[0.15em]"
            >
              <History className="mr-1 h-3 w-3" /> Hist.
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              className="rounded-none data-[state=active]:bg-gradient-gold-soft data-[state=active]:text-primary text-[10px] uppercase tracking-[0.15em]"
            >
              <LayoutGrid className="mr-1 h-3 w-3" /> Galeria
            </TabsTrigger>
          </TabsList>

          {/* Biblioteca */}
          <TabsContent value="library" className="mt-0">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ícone (ex: book, heart)"
                className="h-8 border-none bg-transparent px-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="max-h-[340px] overflow-y-auto p-3">
              {filtered ? (
                filtered.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Nenhum ícone encontrado</p>
                ) : (
                  <div className="grid grid-cols-6 gap-2">{filtered.map(renderIcon)}</div>
                )
              ) : (
                <div className="space-y-4">
                  {ICON_GROUPS.map((g) => (
                    <div key={g.label}>
                      <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{g.label}</p>
                      <div className="grid grid-cols-6 gap-2">{g.icons.map(renderIcon)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* IA */}
          <TabsContent value="ai" className="mt-0">
            <div className="space-y-3 p-4">
              {iconUrl && (
                <div className="flex items-center gap-3 rounded-sm border border-gold bg-gradient-gold-soft p-3">
                  <img src={iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-sm bg-background/40 object-contain p-1" />
                  <div className="flex-1 text-[10px] uppercase tracking-[0.2em] text-primary">Ícone atual</div>
                  <button
                    type="button"
                    onClick={resetIcon}
                    className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-destructive"
                    title="Resetar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Estilo</label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((s) => {
                    const active = style === s.v;
                    return (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setStyle(s.v)}
                        disabled={generating}
                        title={s.desc}
                        className={`rounded-sm border p-2 text-left transition-all ${
                          active
                            ? "border-gold bg-gradient-gold-soft text-primary"
                            : "border-border bg-card/40 text-muted-foreground hover:border-gold/60"
                        }`}
                      >
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em]">{s.l}</p>
                        <p className="mt-0.5 text-[9px] opacity-70 leading-tight">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Descreva seu produto ou serviço
                </label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: ebook sobre paternidade consciente"
                  rows={3}
                  maxLength={300}
                  disabled={generating || atLimit}
                  className="rounded-sm border-gold bg-input text-xs"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{aiPrompt.length}/300</p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || atLimit || !blockId || aiPrompt.trim().length < 3}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando...</>
                ) : atLimit ? (
                  <>Limite atingido</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Gerar ícone</>
                )}
              </button>

              {/* Contador em tempo real (barra) */}
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                  <span className="text-muted-foreground">Gerações deste bloco</span>
                  <span className={atLimit ? "text-destructive" : "text-primary"}>
                    {generationsUsed} / {MAX_GEN}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-card/60">
                  <div
                    className={`h-full transition-all ${atLimit ? "bg-destructive" : "bg-gradient-to-r from-gold to-primary"}`}
                    style={{ width: `${(generationsUsed / MAX_GEN) * 100}%` }}
                  />
                </div>
              </div>

              {!blockId && (
                <p className="rounded-sm border border-border bg-card/40 p-2 text-[10px] text-muted-foreground">
                  Salve o bloco primeiro pra liberar a geração com IA.
                </p>
              )}
              {atLimit && blockId && (
                <p className="rounded-sm border border-destructive/40 bg-destructive/5 p-2 text-[10px] text-destructive">
                  Limite atingido. Use a aba <strong>Histórico</strong> pra reaproveitar uma geração anterior, ou a <strong>Galeria</strong> pra usar de outro bloco.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="mt-0">
            <div className="max-h-[400px] overflow-y-auto p-3">
              {!blockId ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Salve o bloco pra ver o histórico.</p>
              ) : loadingHist ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : history.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Nenhum ícone gerado ainda neste bloco.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {history.map((g) => (
                    <GeneratedThumb key={g.id} gen={g} active={g.icon_url === iconUrl} onPick={pickGenerated} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Galeria global */}
          <TabsContent value="gallery" className="mt-0">
            <div className="border-b border-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Reaproveitar ícone de qualquer bloco — não conta no limite
              </p>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-3">
              {loadingGal ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : gallery.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Nenhum ícone gerado ainda.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {gallery.map((g) => (
                    <GeneratedThumb key={g.id} gen={g} active={g.icon_url === iconUrl} onPick={pickGenerated} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

const GeneratedThumb = ({
  gen,
  active,
  onPick,
}: {
  gen: Generation;
  active: boolean;
  onPick: (url: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onPick(gen.icon_url)}
    title={gen.prompt}
    className={`group relative flex aspect-square items-center justify-center rounded-sm border bg-background/40 p-2 transition-all ${
      active ? "border-gold shadow-gold" : "border-border hover:border-gold/60"
    }`}
  >
    <img src={gen.icon_url} alt={gen.prompt} className="h-full w-full object-contain" />
    {active && (
      <span className="absolute right-1 top-1 rounded-full bg-gold p-0.5 text-background">
        <Check className="h-2.5 w-2.5" />
      </span>
    )}
    <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate rounded-b-sm bg-background/85 px-1 py-0.5 text-[8px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
      {gen.prompt}
    </span>
  </button>
);
