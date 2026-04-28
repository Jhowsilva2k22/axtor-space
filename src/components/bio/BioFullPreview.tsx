import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

/**
 * Onda 3 v2 Fase 3 (refactor PR-B) — preview ao vivo da Bio dentro do Painel.
 *
 * Lê bio_config + bio_blocks + bio_categories pelo tenantId e renderiza um
 * mock do layout público (`/bio`). Atualiza automaticamente quando outros
 * componentes invalidam a query `["bioPreview", tenantId]`.
 *
 * Não chama o tema custom — preview usa as cores do app atual (gold-noir).
 */

const QUERY_KEY = (tenantId: string) => ["bioPreview", tenantId];

type Cfg = {
  display_name: string | null;
  headline: string | null;
  sub_headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
};

type Block = {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  badge: string | null;
  is_active: boolean;
  position: number;
  highlight: boolean;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
  position: number;
  is_active: boolean;
  icon: string | null;
};

type BioData = {
  config: Cfg | null;
  blocks: Block[];
  categories: Category[];
};

const fetchBio = async (tenantId: string): Promise<BioData> => {
  const [{ data: c }, { data: b }, { data: cats }] = await Promise.all([
    supabase
      .from("bio_config")
      .select("display_name, headline, sub_headline, avatar_url, cover_url")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("bio_blocks")
      .select("id, label, url, icon, badge, is_active, position, highlight, category_id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("bio_categories")
      .select("id, name, position, is_active, icon")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("position", { ascending: true }),
  ]);
  return {
    config: (c as Cfg | null) ?? null,
    blocks: (b as Block[] | null) ?? [],
    categories: (cats as Category[] | null) ?? [],
  };
};

export const useBioPreviewQueryKey = QUERY_KEY;

const RenderIcon = ({ name }: { name: string | null }) => {
  if (!name) return null;
  const Comp = (LucideIcons as any)[name] || LucideIcons.Link2;
  return <Comp className="h-3.5 w-3.5 shrink-0" />;
};

export const BioFullPreview = ({
  tenantId,
  slug,
  liveConfig,
  liveBlocks,
}: {
  tenantId: string;
  slug: string;
  /** State local do editor de cabeçalho — sobrescreve o que vem do banco. */
  liveConfig?: Partial<Cfg> | null;
  /** State local do editor de blocos — sobrescreve o que vem do banco. */
  liveBlocks?: Block[];
}) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: QUERY_KEY(tenantId),
    queryFn: () => fetchBio(tenantId),
    enabled: !!tenantId,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading || !data) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  // Live state sobrescreve o do banco (preview reflete a edição imediatamente).
  const config: Cfg | null = liveConfig
    ? { ...(data.config ?? ({} as Cfg)), ...liveConfig }
    : data.config;
  const blocks: Block[] = liveBlocks
    ? liveBlocks.filter((b) => b.is_active)
    : data.blocks;
  const { categories } = data;
  const displayName = config?.display_name?.trim() || "Seu nome aqui";
  const headline = config?.headline?.trim() || "Sua headline em uma linha";
  const subHeadline = config?.sub_headline?.trim() || null;
  const avatarUrl = config?.avatar_url || null;
  const coverUrl = config?.cover_url || null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Pré-visualização ao vivo
        </span>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> /{slug}
          </a>
        </div>
      </div>

      {/* Frame que imita a tela do bio público */}
      <div className="relative bg-background">
        {/* Cover de fundo blur */}
        {coverUrl && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${coverUrl}")`,
                filter: "blur(8px)",
                opacity: 0.35,
                transform: "scale(1.08)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 0%, transparent 30%, hsl(var(--background) / 0.65) 70%, hsl(var(--background) / 0.92) 100%)",
              }}
            />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-md px-6 py-10">
          {/* Header */}
          <div className="text-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="mx-auto h-24 w-24 rounded-full border border-gold object-cover object-top"
              />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 font-display text-3xl text-muted-foreground">
                {displayName?.[0] ?? "?"}
              </div>
            )}
            <h1 className="mt-5 font-display text-2xl">{displayName}</h1>
            <p className="mt-3 text-sm font-light text-muted-foreground">{headline}</p>
            {subHeadline && (
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-primary">
                {subHeadline}
              </p>
            )}
          </div>

          {/* Categorias (chips) — largura uniforme pra evitar órfãos quando faz wrap. */}
          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex w-[120px] items-center justify-center gap-1.5 rounded-full border border-gold/30 bg-card/40 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                  title={c.name}
                >
                  <RenderIcon name={c.icon} />
                  <span className="truncate">{c.name}</span>
                </span>
              ))}
            </div>
          )}

          {/* Blocks */}
          <div className="mt-8 space-y-3">
            {blocks.length === 0 ? (
              <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-xs text-muted-foreground">
                Nenhum bloco ativo. Adicione um bloco acima.
              </div>
            ) : (
              blocks.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm transition ${
                    b.highlight
                      ? "border-gold bg-gradient-gold-soft text-primary"
                      : "border-border bg-card/50"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <RenderIcon name={b.icon} />
                    <span className="truncate">{b.label}</span>
                    {b.badge && (
                      <span className="rounded-sm border border-gold bg-background/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary">
                        {b.badge}
                      </span>
                    )}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
