import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { Loader2, ArrowUpRight } from "lucide-react";

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
  badge: string | null;
  highlight: boolean;
  position: number;
};

const Bio = () => {
  const [cfg, setCfg] = useState<BioConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: b }] = await Promise.all([
        supabase.from("bio_config").select("*").eq("singleton", true).maybeSingle(),
        supabase.from("bio_blocks").select("*").eq("is_active", true).order("position", { ascending: true }),
      ]);
      setCfg(c as any);
      setBlocks((b as any) ?? []);
      setLoading(false);
    })();
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
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-md px-6 pb-16 pt-12">
        <div className="text-center">
          {cfg?.avatar_url ? (
            <img src={cfg.avatar_url} alt={cfg.display_name} className="mx-auto h-28 w-28 rounded-full border border-gold object-cover shadow-gold" />
          ) : (
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-gold bg-gradient-gold-soft font-display text-4xl text-gold">
              {cfg?.display_name?.[0] ?? "J"}
            </div>
          )}
          <h1 className="mt-6 font-display text-4xl leading-tight">{cfg?.display_name}</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
            {cfg?.headline}
          </p>
          {cfg?.sub_headline && (
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-primary">{cfg.sub_headline}</p>
          )}
        </div>

        <div id="blocks" className="mt-12 space-y-3">
          {blocks.map((b) => (
            <BlockCard key={b.id} block={b} />
          ))}
        </div>

        <footer className="mt-16 text-center">
          <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
            {cfg?.footer_text ?? "voltar"}
          </Link>
        </footer>
      </main>
    </div>
  );
};

const BlockCard = ({ block }: { block: Block }) => {
  const Icon = (block.icon && (LucideIcons as any)[block.icon]) || LucideIcons.Link2;
  const isInternal = block.url.startsWith("/");
  const cls = `group relative flex w-full items-center gap-4 overflow-hidden rounded-sm border p-4 transition-all hover:-translate-y-0.5 ${
    block.highlight
      ? "border-gold bg-gradient-gold-soft shadow-gold hover:shadow-gold-lg"
      : "border-gold/40 bg-card/60 hover:border-gold hover:bg-card/80"
  }`;
  const inner = (
    <>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm ${block.highlight ? "bg-background/40" : "bg-gradient-gold-soft"}`}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium uppercase tracking-[0.1em] text-foreground">{block.label}</p>
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
  if (isInternal) {
    return (
      <Link to={block.url} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={block.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  );
};

export default Bio;