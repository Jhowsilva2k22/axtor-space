import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteIconButton } from "@/components/imersivo/atomic/DeleteIconButton";
import { FieldWithHint } from "@/components/imersivo/atomic/FieldWithHint";
import { MediaUrlPicker } from "@/components/imersivo/atomic/MediaUrlPicker";
import { ReviewSectionCard } from "@/components/imersivo/atomic/ReviewSectionCard";
import { SwitchField } from "@/components/imersivo/atomic/SwitchField";

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
              <Badge variant="outline" className="rounded-full border-gold/30 text-gold bg-gold/5">Pergunta {idx + 1}</Badge>
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
        </motion.div>
      ))}
    </ReviewSectionCard>
  );
};
