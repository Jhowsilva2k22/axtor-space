import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { Loader2, ArrowUpRight, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import AmbientPlayer from "@/components/AmbientPlayer";
import { trackPageView, trackBioClick } from "@/lib/analytics";

type BioConfig = {
  display_name: string;
  headline: string;
  sub_headline: string | null;
  avatar_url: string | null;
  footer_text: string | null;
};
type Block = {
  id: string;
  kind: string;
  label: string;
  description: string | null;
  url: string;
  icon: string | null;
  icon_url: string | null;
  badge: string | null;
  highlight: boolean;
  position: number;
  use_brand_color: boolean;
  size?: "sm" | "md" | "lg" | null;
  category_id?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
};

// Cor original de cada marca (gradiente quando faz sentido)
const BRAND_STYLES: Record<string, { bg: string; color: string }> = {
  instagram: { bg: "linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)", color: "#fff" },
  whatsapp:  { bg: "#25D366", color: "#fff" },
  facebook:  { bg: "#1877F2", color: "#fff" },
  youtube:   { bg: "#FF0000", color: "#fff" },
  tiktok:    { bg: "linear-gradient(45deg,#25F4EE,#000 50%,#FE2C55)", color: "#fff" },
  twitter:   { bg: "#000", color: "#fff" },
  x:         { bg: "#000", color: "#fff" },
  linkedin:  { bg: "#0A66C2", color: "#fff" },
  spotify:   { bg: "#1DB954", color: "#fff" },
  telegram:  { bg: "#229ED9", color: "#fff" },
  pinterest: { bg: "#E60023", color: "#fff" },
  github:    { bg: "#181717", color: "#fff" },
  twitch:    { bg: "#9146FF", color: "#fff" },
  discord:   { bg: "#5865F2", color: "#fff" },
  threads:   { bg: "#000", color: "#fff" },
};

const getBrandStyle = (block: Block) => {
  if (!block.use_brand_color) return null;
  const key = (block.kind || "").toLowerCase();
  if (BRAND_STYLES[key]) return BRAND_STYLES[key];
  const iconKey = (block.icon || "").toLowerCase();
  return BRAND_STYLES[iconKey] || null;
};

const Bio = () => {
  const [cfg, setCfg] = useState<BioConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: b }, { data: cats }] = await Promise.all([
        supabase.from("bio_config").select("*").eq("singleton", true).maybeSingle(),
        supabase.from("bio_blocks").select("*").eq("is_active", true).order("position", { ascending: true }),
        supabase.from("bio_categories").select("*").eq("is_active", true).order("position", { ascending: true }),
      ]);
      setCfg(c as any);
      setBlocks((b as any) ?? []);
      setCategories((cats as any) ?? []);
      setLoading(false);
    })();
    trackPageView("/bio");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      {/* Aurora dourada animada */}
      <div className="aurora-a" />
      <div className="aurora-b" />

      <AmbientPlayer />
      <ThemeToggle className="absolute left-5 top-5 z-20" />

      <main className="relative z-10 mx-auto max-w-md px-6 pb-16 pt-12">
        <div className="text-center">
          <div className="relative mx-auto h-28 w-28 animate-fade-up">
            <div className="avatar-halo" />
            {cfg?.avatar_url ? (
              <img src={cfg.avatar_url} alt={cfg.display_name} className="relative z-10 h-28 w-28 rounded-full border border-gold object-cover shadow-gold" />
            ) : (
              <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-gold bg-gradient-gold-soft font-display text-4xl text-gold">
                {cfg?.display_name?.[0] ?? "J"}
              </div>
            )}
          </div>
          <h1 className="mt-6 animate-fade-up font-display text-4xl leading-tight" style={{ animationDelay: "0.1s" }}>{cfg?.display_name}</h1>
          <p className="mx-auto mt-4 max-w-sm animate-fade-up text-sm font-light leading-relaxed text-muted-foreground" style={{ animationDelay: "0.2s" }}>
            {cfg?.headline}
          </p>
          {cfg?.sub_headline && (
            <p className="mt-3 animate-fade-up text-[11px] uppercase tracking-[0.3em] text-primary" style={{ animationDelay: "0.3s" }}>{cfg.sub_headline}</p>
          )}
        </div>

        <div id="blocks" className="stagger mt-12 space-y-3">
          {categories.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
              <CategoryChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
                Todos
              </CategoryChip>
              {categories.map((c) => (
                <CategoryChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                  {c.name}
                </CategoryChip>
              ))}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Buscar"
                className={`inline-flex h-8 items-center justify-center rounded-sm border px-2 transition-all ${
                  searchOpen ? "border-gold bg-gradient-gold-soft text-primary" : "border-gold/40 text-muted-foreground hover:border-gold hover:text-primary"
                }`}
              >
                {searchOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
          {searchOpen && (
            <div className="mb-4 animate-fade-up">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-sm border border-gold/40 bg-card/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
              />
            </div>
          )}
          {blocks
            .filter((b) => activeCat === "all" || b.category_id === activeCat)
            .filter((b) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                b.label.toLowerCase().includes(q) ||
                (b.description ?? "").toLowerCase().includes(q)
              );
            })
            .map((b) => (
              <BlockCard key={b.id} block={b} />
            ))}
        </div>

        <footer className="mt-16 text-center">
          <a href="/" target="_blank" rel="noopener" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
            {cfg?.footer_text ?? "voltar"}
          </a>
          <p className="mt-3 text-[9px] uppercase tracking-[0.25em] text-muted-foreground/40">
            música:{" "}
            <a href="https://www.bensound.com" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground/70">
              bensound
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

const BlockCard = ({ block }: { block: Block }) => {
  const Icon = (block.icon && (LucideIcons as any)[block.icon]) || LucideIcons.Link2;
  const isInternal = block.url.startsWith("/");
  const brand = getBrandStyle(block);
  const hasCustomIcon = !!block.icon_url;
  const onTrack = () =>
    trackBioClick({ id: block.id, kind: block.kind, label: block.label, url: block.url });
  const size = block.size ?? "md";
  const sizeCls =
    size === "sm"
      ? "gap-3 p-3"
      : size === "lg"
        ? "gap-5 p-6"
        : "gap-4 p-4";
  const iconBoxCls =
    size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const iconSvgCls =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const customIconCls =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const labelCls =
    size === "sm"
      ? "text-xs"
      : size === "lg"
        ? "text-base"
        : "text-sm";
  const cls = `block-shimmer group relative flex w-full items-center overflow-hidden rounded-sm border transition-all duration-300 hover:-translate-y-0.5 ${sizeCls} ${
    block.highlight
      ? "border-gold bg-gradient-gold-soft shadow-gold hover:shadow-gold-lg"
      : "border-gold/40 bg-card/60 hover:border-gold hover:bg-card/80"
  }`;
  const inner = (
    <>
      <div
        className={`flex shrink-0 items-center justify-center rounded-sm ${iconBoxCls} ${
          hasCustomIcon ? "bg-background/40" : brand ? "" : block.highlight ? "bg-background/40" : "bg-gradient-gold-soft"
        }`}
        style={!hasCustomIcon && brand ? { background: brand.bg } : undefined}
      >
        {hasCustomIcon ? (
          <img src={block.icon_url!} alt="" className={`${customIconCls} object-contain`} />
        ) : (
          <Icon
            className={`${iconSvgCls} ${brand ? "" : "text-primary"}`}
            style={brand ? { color: brand.color } : undefined}
          />
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className={`truncate font-medium uppercase tracking-[0.08em] text-foreground ${labelCls}`}>{block.label}</p>
          {block.badge && (
            <span className="shrink-0 rounded-sm border border-gold bg-background/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-primary">
              {block.badge}
            </span>
          )}
        </div>
        {block.description && (
          <p className="mt-1 truncate text-xs font-light text-muted-foreground">{block.description}</p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-primary opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
    </>
  );
  // Sempre abre em nova aba (inclusive rotas internas) para preservar a /bio aberta
  return (
    <a
      href={block.url}
      target="_blank"
      rel={isInternal ? "noopener" : "noopener noreferrer"}
      className={cls}
      onClick={onTrack}
    >
      {inner}
    </a>
  );
};

export default Bio;