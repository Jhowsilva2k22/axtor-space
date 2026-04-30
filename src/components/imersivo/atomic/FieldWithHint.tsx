import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldWithHintProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  hintClassName?: string;
};

export const FieldWithHint = ({
  label,
  hint,
  htmlFor,
  children,
  className,
  labelClassName,
  hintClassName,
}: FieldWithHintProps) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60",
          labelClassName,
        )}
      >
        {label}
      </label>
      {hint && (
        <p className={cn("text-[10px] text-gold/60 italic font-light", hintClassName)}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
};
