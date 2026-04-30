import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteIconButton } from "@/components/imersivo/atomic/DeleteIconButton";
import { SwitchField } from "@/components/imersivo/atomic/SwitchField";

type BenefitsShape = {
  items: string[];
  is_exclusive?: boolean;
  original_price?: string;
  guarantee_days?: number;
  metrics?: any[];
};

const getBenefits = (raw: any): BenefitsShape => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      is_exclusive: raw.is_exclusive === true,
      original_price: raw.original_price ?? "",
      guarantee_days: raw.guarantee_days ?? 7,
      metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
    };
  }
  return {
    items: Array.isArray(raw) ? raw : [],
    is_exclusive: false,
    original_price: "",
    guarantee_days: 7,
    metrics: [],
  };
};

type ExclusiveOfferBlockProps = {
  benefits: any;
  onChange: (patch: Record<string, any>) => void;
};

export const ExclusiveOfferBlock = ({ benefits, onChange }: ExclusiveOfferBlockProps) => {
  const b = getBenefits(benefits);

  const updateBenefits = (patch: Partial<BenefitsShape>) => {
    onChange({ benefits: { ...b, ...patch } });
  };

  return (
    <div className="rounded-md border border-gold/30 bg-gold/5 p-4 space-y-4">
      <SwitchField
        label="Modo: Oferta Exclusiva do Diagnóstico"
        hint="Ativa o layout de alta conversão (âncora + bônus + garantia)"
        checked={b.is_exclusive === true}
        onCheckedChange={(v) => updateBenefits({ is_exclusive: v })}
        className="rounded-none border-0 p-0"
        textWrapperClassName="space-y-0.5"
        labelClassName="text-gold"
        hintClassName="text-[10px] text-muted-foreground"
      />

      {b.is_exclusive && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Preço Original (Âncora)</Label>
            <Input
              placeholder="Ex: R$ 694"
              value={b.original_price ?? ""}
              onChange={(e) => updateBenefits({ original_price: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Dias de Garantia</Label>
            <Input
              type="number"
              value={b.guarantee_days ?? 7}
              onChange={(e) => updateBenefits({ guarantee_days: parseInt(e.target.value) || 7 })}
            />
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs uppercase tracking-widest opacity-70">O que você recebe (Checklist)</Label>
        <div className="mt-2 space-y-2">
          {b.items.map((item: string, ii: number) => (
            <div key={ii} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const currentItems = [...b.items];
                  currentItems[ii] = e.target.value;
                  updateBenefits({ items: currentItems });
                }}
              />
              <DeleteIconButton
                onClick={() => {
                  const filtered = b.items.filter((_, i) => i !== ii);
                  updateBenefits({ items: filtered });
                }}
                iconClassName="h-3 w-3"
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-[10px] border-dashed"
            onClick={() => updateBenefits({ items: [...b.items, ""] })}
          >
            + Adicionar item à oferta
          </Button>
        </div>
      </div>
    </div>
  );
};
