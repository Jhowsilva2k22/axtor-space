import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import type { Category } from "@/components/CategoriesManager";
import type { Block } from "@/components/bio/types";
import { BioBlocksManager } from "@/components/bio/BioBlocksManager";
import { useBioPreviewQueryKey } from "@/components/bio/BioFullPreview";

/**
 * Onda 3 v2 Fase 3 (refactor PR2B) — wrapper standalone do BioBlocksManager.
 *
 * Replica a lógica do Admin.tsx pra blocos da bio (carrega, salva, publica,
 * descarta rascunho, deleta, duplica, move, drag-and-drop). Usa o mesmo
 * componente apresentacional `<BioBlocksManager>` que já está no /admin.
 *
 * Pra Painel novo aba Bio.
 */

const DRAFT_FIELDS: (keyof Block)[] = [
  "kind",
  "label",
  "description",
  "url",
  "icon",
  "icon_url",
  "badge",
  "highlight",
  "use_brand_color",
  "category_id",
];

export const BioBlocksManagerStandalone = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishImmediate, setPublishImmediate] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [dirtyBlocks, setDirtyBlocks] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const activeBlocksCount = blocks.filter((b) => b.is_active).length;
  const plan = usePlanLimits(activeBlocksCount);

  const invalidatePreview = () => {
    queryClient.invalidateQueries({ queryKey: useBioPreviewQueryKey(tenantId) });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: b, error: bErr }, { data: c, error: cErr }] = await Promise.all([
      supabase
        .from("bio_blocks")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("position", { ascending: true }),
      supabase
        .from("bio_categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("position", { ascending: true }),
    ]);
    if (bErr) toast.error(bErr.message);
    if (cErr) toast.error(cErr.message);
    setBlocks((b as Block[] | null) ?? []);
    setCategories((c as Category[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const viewBlock = (b: Block): Block => {
    if (!b.has_draft || !b.draft_data) return b;
    return { ...b, ...(b.draft_data as Partial<Block>) };
  };

  const buildDraft = (b: Block) => {
    const d: Record<string, any> = {};
    DRAFT_FIELDS.forEach((k) => {
      d[k as string] = (b as any)[k];
    });
    return d;
  };

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.add(id);
      return n;
    });
  };

  const saveBlock = async (b: Block, opts?: { publish?: boolean }) => {
    const publish = !!opts?.publish || publishImmediate;
    if (publish) {
      const { error } = await supabase
        .from("bio_blocks")
        .update({
          kind: b.kind,
          label: b.label,
          description: b.description,
          url: b.url,
          icon: b.icon,
          badge: b.badge,
          highlight: b.highlight,
          is_active: b.is_active,
          position: b.position,
          use_brand_color: b.use_brand_color,
          size: b.size,
          category_id: b.category_id,
          draft_data: null,
          has_draft: false,
        })
        .eq("id", b.id);
      if (error) return toast.error(error.message);
      setBlocks((bs) =>
        bs.map((x) =>
          x.id === b.id ? { ...x, draft_data: null, has_draft: false } : x,
        ),
      );
      toast.success("Bloco publicado");
    } else {
      const draft = buildDraft(b);
      const { error } = await supabase
        .from("bio_blocks")
        .update({
          position: b.position,
          is_active: b.is_active,
          draft_data: draft,
          has_draft: true,
        })
        .eq("id", b.id);
      if (error) return toast.error(error.message);
      setBlocks((bs) =>
        bs.map((x) =>
          x.id === b.id ? { ...x, draft_data: draft, has_draft: true } : x,
        ),
      );
      toast.success("Rascunho salvo");
    }
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.delete(b.id);
      return n;
    });
    invalidatePreview();
  };

  const publishBlock = async (b: Block) => {
    setPublishingId(b.id);
    await saveBlock(b, { publish: true });
    setPublishingId(null);
  };

  const discardDraft = async (b: Block) => {
    if (!confirm("Descartar rascunho deste bloco?")) return;
    const { error, data } = await supabase
      .from("bio_blocks")
      .update({ draft_data: null, has_draft: false })
      .eq("id", b.id)
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((bs) => bs.map((x) => (x.id === b.id ? (data as any) : x)));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.delete(b.id);
      return n;
    });
    invalidatePreview();
    toast.success("Rascunho descartado");
  };

  const deleteBlock = async (id: string) => {
    if (!confirm("Excluir esse bloco?")) return;
    const { error } = await supabase.from("bio_blocks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const duplicateBlock = async (b: Block) => {
    const nextPos = (blocks[blocks.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_blocks")
      .insert({
        tenant_id: tenantId,
        kind: b.kind,
        label: `${b.label} (cópia)`,
        description: b.description,
        url: b.url,
        icon: b.icon,
        icon_url: b.icon_url,
        badge: b.badge,
        highlight: b.highlight,
        use_brand_color: b.use_brand_color,
        size: "md",
        category_id: b.category_id,
        position: nextPos,
        is_active: false,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((bs) => [...bs, data as any]);
    toast.success("Bloco duplicado — revise e ative");
  };

  const addBlock = async () => {
    const nextPos = (blocks[blocks.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_blocks")
      .insert({
        tenant_id: tenantId,
        kind: "link",
        label: "Novo bloco",
        url: "https://",
        icon: "Link2",
        position: nextPos,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((bs) => [...bs, data as any]);
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const a = blocks[idx];
    const c = blocks[j];
    const newBlocks = [...blocks];
    newBlocks[idx] = { ...c, position: a.position };
    newBlocks[j] = { ...a, position: c.position };
    setBlocks(newBlocks);
    await Promise.all([
      supabase.from("bio_blocks").update({ position: c.position }).eq("id", a.id),
      supabase.from("bio_blocks").update({ position: a.position }).eq("id", c.id),
    ]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
      ...b,
      position: i + 1,
    }));
    setBlocks(reordered);
    const updates = reordered.map((b) =>
      supabase.from("bio_blocks").update({ position: b.position }).eq("id", b.id),
    );
    const results = await Promise.all(updates);
    const failed = results.filter((r: any) => r?.error).length;
    if (failed > 0) toast.error("Falha ao salvar nova ordem");
  };

  const saveAllDirty = async () => {
    if (dirtyBlocks.size === 0) return;
    setSavingAll(true);
    for (const id of dirtyBlocks) {
      const b = blocks.find((x) => x.id === id);
      if (b) await saveBlock(b);
    }
    setSavingAll(false);
  };

  const publishAllDirty = async () => {
    if (dirtyBlocks.size === 0) return;
    setSavingAll(true);
    for (const id of dirtyBlocks) {
      const b = blocks.find((x) => x.id === id);
      if (b) await saveBlock(b, { publish: true });
    }
    setSavingAll(false);
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  const totalDirty = dirtyBlocks.size;

  return (
    <div className="space-y-4">
      {/* Toolbar de publish-immediate + save-all */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-gold/30 bg-card/40 p-4">
        <label className="flex items-center gap-3 text-xs">
          <Switch checked={publishImmediate} onCheckedChange={setPublishImmediate} />
          <span>
            Publicar mudanças <strong>imediatamente</strong> (sem rascunho).
          </span>
        </label>
        {totalDirty > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {totalDirty} alteração{totalDirty === 1 ? "" : "ões"} pendente
              {totalDirty === 1 ? "" : "s"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={saveAllDirty}
              disabled={savingAll}
            >
              {savingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Salvar rascunhos
                </>
              )}
            </Button>
            <Button type="button" size="sm" onClick={publishAllDirty} disabled={savingAll}>
              <Send className="mr-2 h-4 w-4" /> Publicar tudo
            </Button>
          </div>
        )}
      </div>

      <BioBlocksManager
        blocks={blocks}
        categories={categories}
        tenantId={tenantId}
        canAddBlock={plan.canAddBlock}
        maxBlocks={plan.limits.max_blocks}
        publishingId={publishingId}
        sensors={sensors}
        viewBlock={viewBlock}
        onAddBlock={addBlock}
        onTemplateApplied={() => void load()}
        onChangeBlock={updateBlock}
        onSaveBlock={saveBlock}
        onPublishBlock={publishBlock}
        onDiscardDraft={discardDraft}
        onDeleteBlock={deleteBlock}
        onDuplicateBlock={duplicateBlock}
        onMoveBlock={move}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
};
