import { ExternalLink } from "lucide-react";
import type { BioConfig, BioBlock } from "@/hooks/useBioContent";

/**
 * Onda 3 v2 Fase 3 — preview da Bio renderizado a partir de state local.
 * Mock simplificado do layout público de `/bio` — não chama o banco.
 *
 * Recebe config e blocks do editor (state em memória) pra mostrar como vai
 * ficar antes do user salvar.
 */
export const BioMockupPreview = ({
  config,
  blocks,
  slug,
}: {
  config: Partial<BioConfig> | null;
  blocks: BioBlock[];
  slug: string;
}) => {
  const displayName = config?.display_name?.trim() || "Seu nome aqui";
  const headline = config?.headline?.trim() || "Sua headline em uma linha";
  const subHeadline = config?.sub_headline?.trim() || null;
  const avatarUrl = config?.avatar_url || null;

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-1">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Pré-visualização</span>
        <span className="font-mono normal-case">/{slug}</span>
      </div>

      <div className="rounded-b-md bg-background px-6 py-8">
        {/* Header: avatar + nome + headline */}
        <div className="flex flex-col items-center text-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-24 w-24 rounded-full border border-gold object-cover object-top"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-[10px] uppercase tracking-widest text-muted-foreground">
              foto
            </div>
          )}
          <h1 className="mt-4 font-display text-xl">{displayName}</h1>
          <p className="mt-2 max-w-xs text-sm text-foreground/80">{headline}</p>
          {subHeadline && (
            <p className="mt-2 max-w-xs text-xs text-muted-foreground">{subHeadline}</p>
          )}
        </div>

        {/* Blocks */}
        <div className="mt-8 space-y-2">
          {blocks.length === 0 ? (
            <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-xs text-muted-foreground">
              Nenhum bloco ainda. Adicione no editor ao lado.
            </div>
          ) : (
            blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border border-border bg-card/50 px-4 py-3 text-sm"
              >
                <span className="truncate">{b.label}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
