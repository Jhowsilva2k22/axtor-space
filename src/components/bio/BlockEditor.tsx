import {
  Loader2,
  FileEdit,
  Send,
  Undo2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  EyeOff,
  Sparkles,
  Droplet,
  Save,
  Copy,
  Trash2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPicker } from "@/components/IconPicker";
import { BlockMetricsBadge } from "@/components/BlockMetricsBadge";
import { CampaignManager } from "@/components/CampaignManager";
import { Combobox } from "@/components/Combobox";
import type { Category } from "@/components/CategoriesManager";
import type { Block } from "@/components/bio/types";
import { KINDS } from "@/components/bio/blockKinds";

/**
 * Onda 3 v2 Fase 3 (refactor PR2) — editor visual de um bloco da bio.
 * Extraído de Admin.tsx (linhas 1091-1318) preservando UX/visual idênticos.
 *
 * Componente apresentacional puro: recebe block + callbacks. Nunca toca no
 * banco direto. Quem renderiza (Admin ou BioBlocksManagerStandalone) controla
 * o save/publish/delete.
 */
export type BlockEditorProps = {
  block: Block;
  hasDraft: boolean;
  isPublishing: boolean;
  categories: Category[];
  onChange: (p: Partial<Block>) => void;
  onSave: () => void;
  onPublish: () => void;
  onDiscardDraft: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export const BlockEditor = ({
  block,
  hasDraft,
  isPublishing,
  categories,
  onChange,
  onSave,
  onPublish,
  onDiscardDraft,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : ("auto" as const),
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`min-w-0 overflow-hidden rounded-sm border p-3 sm:p-4 transition-all ${
        hasDraft
          ? "border-yellow-500/70 bg-yellow-500/[0.04]"
          : block.is_active
            ? "border-gold bg-card/60"
            : "border-border bg-card/30 opacity-60"
      } ${isDragging ? "shadow-2xl" : ""}`}
    >
      {hasDraft && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-yellow-500/40 bg-yellow-500/5 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-yellow-500">
            <FileEdit className="h-3 w-3" /> rascunho não publicado
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscardDraft}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
            >
              <Undo2 className="h-3 w-3" /> Descartar
            </button>
            <Button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="btn-luxe h-8 rounded-sm px-3 text-[10px] uppercase tracking-[0.2em]"
            >
              {isPublishing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Send className="h-3 w-3" /> Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      {/* Linha 1: reordenação + posição + menu de ações */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="hidden cursor-grab touch-none rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary active:cursor-grabbing md:inline-flex"
          title="Arraste para reordenar"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30"
          title="Subir"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30"
          title="Descer"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          #{block.position}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`hidden sm:inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-[10px] uppercase tracking-[0.2em] transition-all ${
              block.is_active
                ? "border-gold/40 text-primary animate-pulse-soft"
                : "border-border text-muted-foreground"
            }`}
          >
            {block.is_active && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-gold" />
            )}
            {block.is_active ? "ativo" : "oculto"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Mais ações"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-gold hover:text-primary"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={onDuplicate}
                className="gap-2 text-xs uppercase tracking-[0.18em]"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-xs uppercase tracking-[0.18em] text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Linha 2: métricas em barra cheia (clica → analytics do bloco) */}
      <div className="mt-3">
        <BlockMetricsBadge blockId={block.id} />
      </div>

      {/* Linha 3: chips de toggles (Ativo / Destaque / Cor original) */}
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex-1 min-w-[125px]">
          <ToggleChip
            icon={
              block.is_active ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )
            }
            label={block.is_active ? "Ativo" : "Oculto"}
            checked={block.is_active}
            onChange={(v) => onChange({ is_active: v })}
          />
        </div>
        <div className="flex-1 min-w-[125px]">
          <ToggleChip
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Destaque"
            checked={block.highlight}
            onChange={(v) => onChange({ highlight: v })}
          />
        </div>
        <div className="flex-1 min-w-[125px]">
          <ToggleChip
            icon={<Droplet className="h-3.5 w-3.5" />}
            label="Cor original"
            checked={block.use_brand_color}
            onChange={(v) => onChange({ use_brand_color: v })}
          />
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Tipo">
          <p className="mb-2 text-[10px] text-gold/60 italic font-light">
            Define o comportamento do bloco (Link, WhatsApp, Vídeo, etc.).
          </p>
          <Select
            value={block.kind}
            onValueChange={(v) => {
              const k = KINDS.find((x) => x.v === v);
              onChange({ kind: v, icon: block.icon || k?.icon || "Link2" });
            }}
          >
            <SelectTrigger className="h-9 rounded-sm border-gold bg-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.v} value={k.v}>
                  {k.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Ícone (lucide)">
          <IconPicker
            value={block.icon}
            onChange={(name) => onChange({ icon: name })}
            iconUrl={block.icon_url}
            onIconUrlChange={(url) => onChange({ icon_url: url })}
            blockId={block.id}
            generationsUsed={block.icon_generations_count ?? 0}
            onGenerationsUsedChange={(n) => onChange({ icon_generations_count: n })}
          />
        </Field>
        <Field label="Label">
          <p className="mb-2 text-[10px] text-gold/60 italic font-light">
            O título que aparecerá dentro do botão.
          </p>
          <Input
            value={block.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="h-9 rounded-sm border-gold bg-input"
          />
        </Field>
        <Field label="Badge (opcional)">
          <Combobox
            value={block.badge ?? ""}
            onChange={(v) => onChange({ badge: v || null })}
            presets={[
              "NOVO",
              "OFERTA",
              "EM BREVE",
              "ESGOTADO",
              "POPULAR",
              "GRÁTIS",
              "LIMITADO",
              "EXCLUSIVO",
            ]}
            placeholder="Sem badge"
            customLabel="Usar badge personalizada"
          />
          {block.badge && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-card/40 px-2 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                prévia:
              </span>
              <span className="rounded-sm border border-gold bg-background/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {block.badge}
              </span>
            </div>
          )}
        </Field>
        <Field label="Categoria">
          <Select
            value={block.category_id ?? "__none__"}
            onValueChange={(v) =>
              onChange({ category_id: v === "__none__" ? null : v })
            }
          >
            <SelectTrigger className="h-9 rounded-sm border-gold bg-input">
              <SelectValue placeholder="Sem categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem categoria</SelectItem>
              {categories
                .filter((c) => c.is_active)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Não está aqui?{" "}
            <a
              href="#categorias"
              className="text-primary underline-offset-2 hover:underline"
            >
              Gerencie a lista no card Categorias
            </a>
            .
          </p>
        </Field>
        <Field label="URL" full>
          <p className="mb-2 text-[10px] text-gold/60 italic font-light">
            O destino do clique. Pode ser um link externo ou uma rota interna.
          </p>
          <Input
            value={block.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https:// ou /rota interna"
            className="h-9 rounded-sm border-gold bg-input"
          />
        </Field>
        <Field label="Descrição (opcional)" full>
          <Input
            value={block.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
            className="h-9 rounded-sm border-gold bg-input"
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={onSave}
          className="btn-luxe h-10 w-full sm:w-auto rounded-sm px-5 text-[11px] font-semibold uppercase tracking-[0.18em]"
        >
          <Save className="h-3.5 w-3.5" /> Salvar bloco
        </Button>
      </div>
      <CampaignManager blockId={block.id} blockLabel={block.label} />
    </div>
  );
};

// =============================================================================
// Helpers locais (Field, ToggleChip) — copiados de Admin.tsx
// =============================================================================

const Field = ({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </label>
    {children}
  </div>
);

const ToggleChip = ({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label
    className={`flex min-h-[40px] w-full cursor-pointer items-center justify-between gap-2 rounded-sm border px-3 py-1.5 transition-colors ${
      checked
        ? "border-gold/60 bg-card/60 text-primary"
        : "border-border bg-card/20 text-muted-foreground hover:border-gold/30"
    }`}
  >
    <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] leading-tight">
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);
