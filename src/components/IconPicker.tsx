import { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Check, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
};

export const IconPicker = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const Current = (value && (LucideIcons as any)[value]) || LucideIcons.Link2;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const renderIcon = (name: string) => {
    const Comp = (LucideIcons as any)[name];
    if (!Comp) return null;
    const active = name === value;
    return (
      <button
        key={name}
        type="button"
        onClick={() => {
          onChange(name);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-sm border border-gold bg-input px-3 text-sm text-foreground transition-all hover:bg-card/60"
        >
          <span className="flex items-center gap-2">
            <Current className="h-4 w-4 text-primary" />
            <span className="truncate">{value || "Escolher ícone"}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(420px,90vw)] rounded-sm border-gold bg-popover p-0"
      >
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
              <p className="py-8 text-center text-xs text-muted-foreground">
                Nenhum ícone encontrado
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {filtered.map(renderIcon)}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {ICON_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {g.label}
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {g.icons.map(renderIcon)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};