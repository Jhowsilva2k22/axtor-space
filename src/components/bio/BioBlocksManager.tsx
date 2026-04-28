import { Lock, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { BioTemplatePicker } from "@/components/BioTemplatePicker";
import { UpgradeModal } from "@/components/UpgradeModal";
import type { Category } from "@/components/CategoriesManager";
import type { Block } from "@/components/bio/types";
import { BlockEditor } from "@/components/bio/BlockEditor";

/**
 * Onda 3 v2 Fase 3 (refactor PR2) — gerenciador de blocos da bio.
 *
 * Apresentacional puro. Recebe blocks + callbacks. Renderiza a lista DnD,
 * cabeçalho com "Novo bloco" (com UpgradeModal pra Free), e empty state com
 * BioTemplatePicker.
 */
export type BioBlocksManagerProps = {
  blocks: Block[];
  categories: Category[];
  tenantId: string;
  canAddBlock: boolean;
  maxBlocks: number;
  publishingId: string | null;
  sensors: SensorDescriptor<SensorOptions>[];
  viewBlock: (b: Block) => Block;
  onAddBlock: () => void;
  onTemplateApplied: () => void;
  onChangeBlock: (id: string, p: Partial<Block>) => void;
  onSaveBlock: (b: Block) => void;
  onPublishBlock: (b: Block) => void;
  onDiscardDraft: (b: Block) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (b: Block) => void;
  onMoveBlock: (index: number, direction: -1 | 1) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

export const BioBlocksManager = ({
  blocks,
  categories,
  tenantId,
  canAddBlock,
  maxBlocks,
  publishingId,
  sensors,
  viewBlock,
  onAddBlock,
  onTemplateApplied,
  onChangeBlock,
  onSaveBlock,
  onPublishBlock,
  onDiscardDraft,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onDragEnd,
}: BioBlocksManagerProps) => {
  return (
    <section id="admin-blocks-section">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl">Blocos da bio</h2>
        <div className="flex items-center gap-2">
          {blocks.length === 0 && canAddBlock && (
            <BioTemplatePicker
              tenantId={tenantId}
              variant="ghost"
              onApplied={onTemplateApplied}
            />
          )}
          {canAddBlock ? (
            <Button
              onClick={onAddBlock}
              className="btn-luxe h-11 rounded-sm px-5 text-xs uppercase tracking-[0.2em]"
            >
              <Plus className="h-4 w-4" /> Novo bloco
            </Button>
          ) : (
            <UpgradeModal feature="blocks">
              <Button
                type="button"
                className="h-11 rounded-sm border border-gold/40 bg-card/40 px-5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-gradient-gold-soft hover:text-primary"
              >
                <Lock className="h-3.5 w-3.5" /> Limite Free atingido ({maxBlocks})
              </Button>
            </UpgradeModal>
          )}
        </div>
      </div>
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              {blocks.map((b, i) => (
                <BlockEditor
                  key={b.id}
                  block={viewBlock(b)}
                  hasDraft={b.has_draft}
                  isPublishing={publishingId === b.id}
                  categories={categories}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                  onChange={(p) => onChangeBlock(b.id, p)}
                  onSave={() => onSaveBlock(b)}
                  onPublish={() => onPublishBlock(viewBlock(b))}
                  onDiscardDraft={() => onDiscardDraft(b)}
                  onDelete={() => onDeleteBlock(b.id)}
                  onDuplicate={() => onDuplicateBlock(viewBlock(b))}
                  onMoveUp={() => onMoveBlock(i, -1)}
                  onMoveDown={() => onMoveBlock(i, 1)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {blocks.length === 0 && (
          <div className="rounded-sm border-gold-gradient bg-card/30 p-10 text-center">
            <p className="font-display text-xl">
              Comece com um <span className="text-gold italic">template</span>
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm font-light text-muted-foreground">
              Escolha um nicho e ganhe categorias + 5 blocos prontos. Você ajusta as URLs e ativa um por um.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <BioTemplatePicker tenantId={tenantId} onApplied={onTemplateApplied} />
              <Button
                onClick={onAddBlock}
                type="button"
                className="h-11 rounded-sm border border-gold/40 bg-card/40 px-5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-gold hover:text-primary"
              >
                ou criar do zero
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
