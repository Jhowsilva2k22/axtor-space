import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldWithHint } from "./FieldWithHint";

type MediaUrlPickerProps = {
  variant?: "plain" | "gold";
  urlLabel?: string;
  urlHint?: string;
  typeLabel?: string;
  typeHint?: string;
  urlValue: string;
  onUrlChange: (v: string) => void;
  typeValue: string;
  onTypeChange: (v: string) => void;
  className?: string;
  fieldClassName?: string;
  inputClassName?: string;
  selectClassName?: string;
  inputPlaceholder?: string;
};

const DEFAULT_PLAIN_SELECT =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const DEFAULT_GOLD_INPUT = "rounded-xl border-gold/20 bg-background/40";
const DEFAULT_GOLD_SELECT =
  "flex h-10 w-full rounded-xl border border-gold/20 bg-background/40 px-3 py-2 text-xs";

export const MediaUrlPicker = ({
  variant = "gold",
  urlLabel = "Mídia (URL)",
  urlHint,
  typeLabel = "Tipo",
  typeHint,
  urlValue,
  onUrlChange,
  typeValue,
  onTypeChange,
  className,
  fieldClassName,
  inputClassName,
  selectClassName,
  inputPlaceholder,
}: MediaUrlPickerProps) => {
  const isGold = variant === "gold";
  const resolvedInputClass = inputClassName ?? (isGold ? DEFAULT_GOLD_INPUT : undefined);
  const resolvedSelectClass =
    selectClassName ?? (isGold ? DEFAULT_GOLD_SELECT : DEFAULT_PLAIN_SELECT);

  const renderUrlField = () => {
    const input = (
      <Input
        placeholder={inputPlaceholder}
        value={urlValue}
        onChange={(e) => onUrlChange(e.target.value)}
        className={resolvedInputClass}
      />
    );
    if (isGold) {
      return (
        <FieldWithHint label={urlLabel} hint={urlHint} className={fieldClassName}>
          {input}
        </FieldWithHint>
      );
    }
    return (
      <div>
        <Label>{urlLabel}</Label>
        {input}
      </div>
    );
  };

  const renderTypeField = () => {
    const select = (
      <select
        className={resolvedSelectClass}
        value={typeValue}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="">Sem mídia</option>
        <option value="image">Imagem</option>
        <option value="video">Vídeo</option>
        <option value="audio">Áudio</option>
      </select>
    );
    if (isGold) {
      return (
        <FieldWithHint label={typeLabel} hint={typeHint} className={fieldClassName}>
          {select}
        </FieldWithHint>
      );
    }
    return (
      <div>
        <Label>{typeLabel}</Label>
        {select}
      </div>
    );
  };

  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      {renderUrlField()}
      {renderTypeField()}
    </div>
  );
};
