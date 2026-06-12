import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteIconButton } from "@/components/imersivo/atomic/DeleteIconButton";
import { FieldWithHint } from "@/components/imersivo/atomic/FieldWithHint";
import { MediaUrlPicker } from "@/components/imersivo/atomic/MediaUrlPicker";
import { ReviewSectionCard } from "@/components/imersivo/atomic/ReviewSectionCard";
import { SwitchField } from "@/components/imersivo/atomic/SwitchField";

const PAIN_KEYS = ["ia", "gestao", "vendas", "estrutura", "marketing"] as const;
type PainKey = (typeof PAIN_KEYS)[number];
const PAIN_LABELS: Record<PainKey, string> = {
  ia: "IA",
  gestao: "Gestão",
  vendas: "Vendas",
  estrutura: "Estrut.",
  marketing: "Market.",
};

type OptionItem = {
  label: string;
  pain_weights: Record<string, number>;
};

type OptionRowProps = {
  opt: OptionItem;
  index: number;
  onChange: (updated: OptionItem) => void;
  onDelete: () => void;
};

const OptionRow = ({ opt, index, onChange, onDelete }: OptionRowProps) => (
  <div className="rounded-xl border border-gold/15 bg-background/30 p-3 space-y-2">
    <div className="flex items-center gap-2">
      <span className="w-4 shrink-0 text-right font-mono text-[10px] text-muted-foreground/60">
        {index + 1}.
      </span>
      <Input
        value={opt.label}
        onChange={(e) => onChange({ ...opt, label: e.target.value })}
        placeholder="Texto que o lead verá..."
        className="h-9 flex-1 rounded-lg border-gold/20 bg-transparent text-sm"
      />
      <DeleteIconButton
        onClick={onDelete}
        className="shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
      />
    </div>
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5 pl-6">
      {PAIN_KEYS.map((key) => (
        <div key={key} className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50">
            {PAIN_LABELS[key]}
          </span>
          <input
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={opt.pain_weights?.[key] ?? 0}
            onChange={(e) => {
              const val = Math.max(0, Math.min(5, parseFloat(e.target.value) || 0));
              onChange({ ...opt, pain_weights: { ...opt.pain_weights, [key]: val } });
            }}
            className="h-8 w-14 rounded-lg border border-gold/20 bg-background/40 px-2 text-center text-xs tabular-nums focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
        </div>
      ))}
    </div>
  </div>
);

type ReviewQuestionsCardProps = {
  questions: any[];
  onUpdate: (idx: number, patch: Record<string, any>) => void;
  onDelete: (idx: number) => void;
};

export const ReviewQuestionsCard = ({
  questions,
  onUpdate,
  onDelete,
}: ReviewQuestionsCardProps) => {
  const [openOptions, setOpenOptions] = useState<Record<number, boolean>>({});

  const toggleOptions = (idx: number) =>
    setOpenOptions((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <ReviewSectionCard title={`Perguntas (${questions.length})`}>
      {questions.map((q, idx) => (
        <motion.div
          key={q.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6 rounded-[24px] border border-gold/20 bg-card/30 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gold/10 pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-xl border-gold/30 text-gold bg-gold/5">Pergunta {idx + 1}</Badge>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Configuração da Etapa</span>
            </div>
            <DeleteIconButton
              onClick={() => onDelete(idx)}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            />
          </div>

          <FieldWithHint
            label="Texto da Pergunta"
            hint="Este é o título principal que o lead verá no topo da tela."
          >
            <Textarea
              value={q.question_text}
              onChange={(e) => onUpdate(idx, { question_text: e.target.value })}
              rows={2}
              className="rounded-xl border-gold/20 bg-background/40"
            />
          </FieldWithHint>

          <FieldWithHint
            label="Subtítulo / Orientação (Opcional)"
            hint="Um texto menor para ajudar o lead a refletir sobre a resposta."
          >
            <Input
              value={q.subtitle ?? ""}
              onChange={(e) => onUpdate(idx, { subtitle: e.target.value })}
              className="h-12 rounded-xl border-gold/20 bg-background/40"
            />
          </FieldWithHint>

          <MediaUrlPicker
            className="grid gap-4 md:grid-cols-2"
            urlLabel="Mídia de Apoio (URL)"
            urlHint="Link da imagem ou vídeo que ilustra a pergunta."
            typeLabel="Tipo de Mídia"
            typeHint="Selecione o formato correto do arquivo acima."
            inputPlaceholder="https://..."
            inputClassName="h-11 rounded-xl border-gold/20 bg-background/40"
            selectClassName="flex h-11 w-full rounded-xl border border-gold/20 bg-background/40 px-3 py-2 text-xs"
            urlValue={q.media_url ?? ""}
            onUrlChange={(v) => onUpdate(idx, { media_url: v })}
            typeValue={q.media_type ?? ""}
            onTypeChange={(v) => onUpdate(idx, { media_type: v })}
          />

          <SwitchField
            label="Trava de Segurança"
            hint="Impede que o lead responda antes de ver toda a mídia."
            checked={!!q.lock_until_media_ends}
            onCheckedChange={(v) => onUpdate(idx, { lock_until_media_ends: v })}
            className="rounded-2xl border-gold/10 bg-gold/5 p-4"
            textWrapperClassName="space-y-0.5"
            labelClassName="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80"
            hintClassName="text-[10px] text-muted-foreground/60 italic"
          />

          {/* Opções de resposta — editor colapsável */}
          <div className="overflow-hidden rounded-2xl border border-gold/10">
            <button
              type="button"
              onClick={() => toggleOptions(idx)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gold/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80">
                  Opções de resposta
                </span>
                <Badge
                  variant="outline"
                  className="rounded-lg border-gold/30 bg-gold/5 px-1.5 text-[10px] text-gold"
                >
                  {(q.options ?? []).length}
                </Badge>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                  openOptions[idx] ? "rotate-180" : ""
                }`}
              />
            </button>

            {openOptions[idx] && (
              <div className="space-y-2 border-t border-gold/10 p-4">
                {(q.options ?? []).length === 0 && (
                  <p className="py-2 text-center text-[11px] text-muted-foreground/60">
                    Nenhuma opção cadastrada. Adicione abaixo.
                  </p>
                )}
                {(q.options ?? []).map((opt: OptionItem, optIdx: number) => (
                  <OptionRow
                    key={optIdx}
                    opt={opt}
                    index={optIdx}
                    onChange={(updated) => {
                      const next = [...(q.options ?? [])];
                      next[optIdx] = updated;
                      onUpdate(idx, { options: next });
                    }}
                    onDelete={() => {
                      const next = (q.options ?? []).filter(
                        (_: OptionItem, i: number) => i !== optIdx
                      );
                      onUpdate(idx, { options: next });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-1 w-full border-dashed border-gold/30 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:border-gold/60 hover:text-primary"
                  onClick={() => {
                    const blank: OptionItem = {
                      label: "",
                      pain_weights: { ia: 0, gestao: 0, vendas: 0, estrutura: 0, marketing: 0 },
                    };
                    onUpdate(idx, { options: [...(q.options ?? []), blank] });
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Adicionar opção
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </ReviewSectionCard>
  );
};
