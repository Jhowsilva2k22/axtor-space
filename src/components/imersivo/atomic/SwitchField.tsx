import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SwitchFieldProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
  textWrapperClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
};

export const SwitchField = ({
  label,
  hint,
  checked,
  onCheckedChange,
  className,
  textWrapperClassName,
  labelClassName,
  hintClassName,
}: SwitchFieldProps) => {
  return (
    <div className={cn("flex items-center justify-between rounded-md border p-3", className)}>
      <div className={cn(textWrapperClassName)}>
        <Label className={cn("text-sm font-medium", labelClassName)}>{label}</Label>
        {hint && (
          <p className={cn("text-xs text-muted-foreground", hintClassName)}>{hint}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
};
