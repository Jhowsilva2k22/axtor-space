import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { Loader2, ArrowUpRight, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import AmbientPlayer from "@/components/AmbientPlayer";
import FeedbackWidget from "@/components/FeedbackWidget";
import { trackPageView, trackBioClick } from "@/lib/analytics";
import { useTenant } from "@/hooks/useTenant";
import { normalizeWhatsappUrl } from "@/lib/validators";
import PlanBadge from "@/components/PlanBadge";

type BioConfig = {
  display_name: string;
  headline: string;
  sub_headline: string | null;
  avatar_url: string | null;
  footer_text: string | null;
  cover_url: string | null;
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
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const [cfg, setCfg] = useState<BioConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    
    (async () => {
      // 1. Carregamento instantâneo do Cache
      const cacheKey = `bio-cfg-${tenant.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setCfg(JSON.parse(cached));
      }

      // 2. Busca atualização em background
      const [{ data: c }, { data: b }, { data: cats }] = await Promise.all([
        supabase.from("bio_config").select("*").eq("tenant_id", tenant.id).maybeSingle(),
        supabase.from("bio_blocks").select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("position", { ascending: true }),
        supabase.from("bio_categories").select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("position", { ascending: true }),
      ]);
      
      if (c) {
        setCfg(c as any);
        sessionStorage.setItem(cacheKey, JSON.stringify(c));
      }
      setBlocks((b as any) ?? []);
      setCategories((cats as any) ?? []);
      setLoading(false);
    })();
    trackPageView("/bio");
  }, [tenant?.id]);

  if (tenantLoading || (loading && !tenantError)) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tenantError === "not_found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 grain px-6 text-center">
        <h1 className="font-display text-3xl text-foreground">Bio não encontrada</h1>
        <p className="text-sm text-muted-foreground">Esta página não existe ou foi desativada.</p>
      </div>
    );
  }

  if (tenantError === "suspended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 grain px-6 text-center">
        <h1 className="font-display text-3xl text-foreground">Bio temporariamente indisponível</h1>
        <p className="text-sm text-muted-foreground">Esta página está suspensa no momento.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <Helmet>
        <title>{`${cfg?.display_name ?? tenant?.display_name ?? "Bio"} — ${cfg?.headline ?? "Link in bio"}`}</title>
        <meta
          name="description"
          content={(cfg?.headline ?? cfg?.sub_headline ?? `Conheça ${cfg?.display_name ?? tenant?.display_name ?? ""}`).slice(0, 158)}
        />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : ""} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${cfg?.display_name ?? tenant?.display_name ?? "Bio"} — ${cfg?.headline ?? ""}`} />
        <meta property="og:description" content={(cfg?.headline ?? "").slice(0, 158)} />
        {cfg?.avatar_url && <meta property="og:image" content={cfg.avatar_url} />}
        {cfg?.cover_url && <meta property="og:image" content={cfg.cover_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${cfg?.display_name ?? tenant?.display_name ?? "Bio"}`} />
        <meta name="twitter:description" content={(cfg?.headline ?? "").slice(0, 158)} />
        {(cfg?.cover_url || cfg?.avatar_url) && (
          <meta name="twitter:image" content={cfg.cover_url ?? cfg.avatar_url ?? ""} />
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: cfg?.display_name ?? tenant?.display_name,
            description: cfg?.headline,
            image: cfg?.avatar_url ?? undefined,
            url: typeof window !== "undefined" ? window.location.href : undefined,
          })}
        </script>
      </Helmet>
      {/* Aurora dourada animada */}
      <div className="aurora-a" />
      <div className="aurora-b" />

      {/* Capa de fundo (parallax fixo + blur + vinheta radial) */}
      {cfg?.cover_url && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("${cfg.cover_url}")`,
              backgroundAttachment: "fixed",
              filter: "blur(8px)",
              opacity: 0.35,
              transform: "scale(1.08)",
            }}
          />
          {/* Vinheta radial — escurece bordas, preserva centro */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, transparent 30%, hsl(var(--background) / 0.65) 70%, hsl(var(--background) / 0.92) 100%)",
            }}
          />
          {/* Fade vertical extra pra dissolver topo e base sem linha */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, hsl(var(--background) / 0.55) 0%, transparent 25%, transparent 75%, hsl(var(--background) / 0.65) 100%)",
            }}
          />
        </div>
      )}

      <AmbientPlayer />
      <ThemeToggle className="absolute left-5 top-5 z-20" />
      <FeedbackWidget pagePath="/bio" />

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
            <div className="relative mb-6 flex items-center gap-2">
              {/* Scroll horizontal das pills com fade nas bordas */}
              <div className="relative min-w-0 flex-1">
                <div
                  className="flex w-full items-center gap-2 overflow-x-auto overflow-y-hidden scroll-smooth px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <CategoryChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
                    Todos
                  </CategoryChip>
                  {categories.map((c) => (
                    <CategoryChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                      {c.name}
                    </CategoryChip>
                  ))}
                </div>
                {/* fade sutil nas bordas — usa a cor real do background do tema */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-4"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(var(--background) / 0.6), hsl(var(--background) / 0))",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-4"
                  style={{
                    background:
                      "linear-gradient(to left, hsl(var(--background) / 0.6), hsl(var(--background) / 0))",
                  }}
                />
              </div>
              {/* Botão de busca sticky à direita, separado das pills */}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Buscar"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
                  searchOpen
                    ? "border-gold bg-gradient-gold-soft text-primary shadow-gold"
                    : "border-gold/40 text-muted-foreground hover:border-gold hover:text-primary"
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
                placeholder="Buscar links..."
                className="w-full rounded-full border border-gold/40 bg-card/40 px-6 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:shadow-gold/10"
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
          {(tenant?.plan === "free" || !tenant?.plan) && (
            <div className="mt-4">
              <PlanBadge />
            </div>
          )}
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
  // Layout fixo para manter consistência visual em todos os cards.
  const sizeCls = "gap-4 p-4";
  const iconBoxCls = "h-12 w-12";
  const iconSvgCls = "h-6 w-6";
  const customIconCls = "h-8 w-8";
  const labelCls = "text-sm";
  const cls = `block-shimmer group relative flex w-full items-center overflow-hidden rounded-[24px] border transition-all duration-500 hover:-translate-y-1 ${sizeCls} ${
    block.highlight
      ? "border-gold/60 bg-gradient-to-br from-gold/20 via-gold/5 to-transparent shadow-gold/20 shadow-xl"
      : "border-gold/20 bg-card/40 backdrop-blur-md hover:border-gold/50 hover:bg-card/60 hover:shadow-gold/10"
  }`;
  const inner = (
    <>
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl ${iconBoxCls} ${
          hasCustomIcon ? "bg-background/40" : brand ? "" : block.highlight ? "bg-white/10" : "bg-gradient-gold-soft"
        } shadow-inner transition-transform group-hover:scale-110`}
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
          <p className={`truncate font-display font-medium tracking-[0.05em] text-foreground ${labelCls}`}>{block.label}</p>
          {block.badge && (
            <span className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-gold shadow-sm">
              {block.badge}
            </span>
          )}
        </div>
        {block.description && (
          <p className="mt-1 truncate text-[11px] font-light text-muted-foreground/80 leading-relaxed">{block.description}</p>
        )}
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/5 text-gold opacity-40 transition-all group-hover:bg-gold/20 group-hover:opacity-100 group-hover:translate-x-1">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </>
  );
  const finalUrl = normalizeWhatsappUrl(block.url);

  // Sempre abre em nova aba (inclusive rotas internas) para preservar a /bio aberta
  return (
    <a
      href={finalUrl}
      target="_blank"
      rel={isInternal ? "noopener" : "noopener noreferrer"}
      className={cls}
      onClick={onTrack}
    >
      {inner}
    </a>
  );
};

const CategoryChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-[10px] uppercase tracking-[0.2em] transition-all ${
      active
        ? "border-gold bg-primary text-primary-foreground shadow-gold"
        : "border-gold/30 bg-card/40 text-muted-foreground hover:border-gold hover:text-primary"
    }`}
  >
    {children}
  </button>
);

export default Bio;