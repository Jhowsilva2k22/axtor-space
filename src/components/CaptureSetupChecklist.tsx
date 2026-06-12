import { Check, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  hasHeadline: boolean;
  hasBio: boolean;
  hasTagline: boolean;
};

type Step = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  fieldId: string;
};

const focusField = (fieldId: string) => {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el.focus(), 280);
};

export const CaptureSetupChecklist = ({ hasHeadline, hasBio, hasTagline }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  const steps: Step[] = [
    {
      id: "headline",
      label: "Headline",
      hint: "Quem você é e a transformação que você entrega.",
      done: hasHeadline,
      fieldId: "capture_headline",
    },
    {
      id: "bio",
      label: "Bio / Sub-headline",
      hint: "Os parágrafos que constroem sua autoridade.",
      done: hasBio,
      fieldId: "capture_sub_headline",
    },
    {
      id: "tagline",
      label: "Tagline",
      hint: "A frase de efeito do card de autoridade.",
      done: hasTagline,
      fieldId: "capture_tagline",
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone) return null;

  const pendingCount = steps.filter((s) => !s.done).length;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent shadow-deep">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-gold/15 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Pencil className="h-3.5 w-3.5 text-gold" />
          <span className="text-xs font-semibold">Configure o conteúdo da captura</span>
          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold">
            {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Passos */}
      {!collapsed && (
        <div className="divide-y divide-gold/10">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3.5 px-5 py-3.5 transition-opacity ${step.done ? "opacity-40" : ""}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  step.done ? "border-gold/60 bg-gold/20" : "border-gold/30"
                }`}
              >
                {step.done && <Check className="h-3 w-3 text-gold" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-semibold leading-none">{step.label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.hint}</p>
              </div>

              {!step.done && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => focusField(step.fieldId)}
                  className="h-7 shrink-0 rounded-xl border border-gold/20 text-[11px] text-gold hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                >
                  Preencher
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
