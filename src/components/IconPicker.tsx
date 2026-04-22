import { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Check, Search, ChevronDown, Sparkles, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Curated, organized list — way better UX than dumping all 1000+ lucide icons.
// Add new ones here as you need them.
const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: "Redes sociais",
    icons: [
      "Instagram", "Facebook", "Youtube", "Twitter", "Linkedin", "Github",
      "Twitch", "Music2", "Music", "Send", "MessageCircle", "Mail",
    ],
  },
  {
    label: "Conteúdo & produto",
    icons: [
      "BookOpen", "Book", "FileText", "Newspaper", "GraduationCap", "Video",
      "Film", "Mic", "Headphones", "PlayCircle", "Image", "Camera",
    ],
  },
  {
    label: "Negócios & CTA",
    icons: [
      "Sparkles", "Crown", "Star", "Heart", "Flame", "Zap", "Trophy", "Award",
      "Target", "Rocket", "TrendingUp", "Gift",
    ],
  },
  {
    label: "Comércio & serviço",
    icons: [
      "ShoppingBag", "ShoppingCart", "Tag", "Briefcase", "Handshake",
      "CreditCard", "DollarSign", "Wallet", "Package", "Store", "Receipt", "Percent",
    ],
  },
  {
    label: "Contato & local",
    icons: [
      "Phone", "PhoneCall", "MapPin", "Map", "Calendar", "Clock", "Globe",
      "Compass", "Navigation", "Home", "Building2", "Users",
    ],
  },
  {
    label: "Genéricos",
    icons: [
      "Link2", "Link", "ExternalLink", "ArrowRight", "ArrowUpRight", "Bookmark",
      "Share2", "Download", "Upload", "Settings", "Info", "HelpCircle",
    ],
  },
];

const ALL_ICONS = Array.from(new Set(ICON_GROUPS.flatMap((g) => g.icons)));

type Props = {
  value: string | null;
  onChange: (icon: string) => void;
  iconUrl?: string | null;
  onIconUrlChange?: (url: string | null) => void;
  blockId?: string;
  generationsUsed?: number;
  onGenerationsUsedChange?: (n: number) => void;
};

const MAX_GEN = 5;

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
  const [tab, setTab] = useState<"library" | "ai">(iconUrl ? "ai" : "library");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const Current = (value && (LucideIcons as any)[value]) || LucideIcons.Link2;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

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
        {active && (
          <Check className="absolute right-1 top-1 h-3 w-3 text-primary" />
        )}
      </button>
    );
  };

  const remaining = Math.max(0, MAX_GEN - generationsUsed);

  const handleGenerate = async () => {
    if (!blockId) {
      toast.error("Salve o bloco antes de gerar um ícone com IA");
      return;
    }
    if (remaining <= 0) {
      toast.error(`Limite de ${MAX_GEN} gerações por bloco atingido`);
      return;
    }
    const desc = aiPrompt.trim();
    if (desc.length < 3) {
      toast.error("Descreva o que o ícone deve representar");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-icon", {
        body: { block_id: blockId, description: desc },
      });
      if (error) throw new Error(error.message);
      if (!data?.icon_url) throw new Error("Sem URL retornada");
      onIconUrlChange?.(data.icon_url);
      onGenerationsUsedChange?.(data.used ?? generationsUsed + 1);
      toast.success("Ícone gerado!");
      setAiPrompt("");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar ícone");
    } finally {
      setGenerating(false);
    }
  };

  const clearCustomIcon = () => {
    onIconUrlChange?.(null);
    toast.success("Ícone customizado removido (volta ao da biblioteca)");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-sm border border-gold bg-input px-3 text-sm text-foreground transition-all hover:bg-card/60"
        >
          <span className="flex items-center gap-2">
            {iconUrl ? (
              <img src={iconUrl} alt="" className="h-5 w-5 rounded-sm object-contain" />
            ) : (
              <Current className="h-4 w-4 text-primary" />
            )}
            <span className="truncate">{iconUrl ? "Ícone IA personalizado" : value || "Escolher ícone"}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(420px,90vw)] rounded-sm border-gold bg-popover p-0"
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="library"
              className="rounded-none border-r border-border data-[state=active]:bg-gradient-gold-soft data-[state=active]:text-primary text-[11px] uppercase tracking-[0.18em]"
            >
              Biblioteca
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-none data-[state=active]:bg-gradient-gold-soft data-[state=active]:text-primary text-[11px] uppercase tracking-[0.18em]"
            >
              <Sparkles className="mr-1.5 h-3 w-3" /> Gerar com IA
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="ai" className="mt-0">
            <div className="space-y-3 p-4">
              {iconUrl && (
                <div className="flex items-center gap-3 rounded-sm border border-gold bg-gradient-gold-soft p-3">
                  <img src={iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-sm bg-background/40 object-contain p-1" />
                  <div className="flex-1 text-[10px] uppercase tracking-[0.2em] text-primary">Ícone atual</div>
                  <button
                    type="button"
                    onClick={clearCustomIcon}
                    className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-destructive"
                    title="Remover ícone customizado"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
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
                  disabled={generating || remaining <= 0}
                  className="rounded-sm border-gold bg-input text-xs"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{aiPrompt.length}/300</p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || remaining <= 0 || !blockId}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Gerar ícone</>
                )}
              </button>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                <span className="text-muted-foreground">Gerações usadas</span>
                <span className={remaining === 0 ? "text-destructive" : "text-primary"}>
                  {generationsUsed} / {MAX_GEN}
                </span>
              </div>
              {!blockId && (
                <p className="rounded-sm border border-border bg-card/40 p-2 text-[10px] text-muted-foreground">
                  Salve o bloco primeiro pra liberar a geração com IA.
                </p>
              )}
              {remaining === 0 && blockId && (
                <p className="rounded-sm border border-destructive/40 bg-destructive/5 p-2 text-[10px] text-destructive">
                  Limite de {MAX_GEN} gerações deste bloco atingido. Crie um novo bloco se precisar de mais.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};