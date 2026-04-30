import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldWithHint } from "@/components/imersivo/atomic/FieldWithHint";

type ProductMainFieldsProps = {
  name: string;
  description: string;
  priceHint: string;
  sessionDuration: string;
  planDuration: string;
  whatsappTemplate: string;
  resultMediaUrl: string;
  onChange: (patch: Record<string, any>) => void;
};

export const ProductMainFields = ({
  name,
  description,
  priceHint,
  sessionDuration,
  planDuration,
  whatsappTemplate,
  resultMediaUrl,
  onChange,
}: ProductMainFieldsProps) => {
  return (
    <>
      <FieldWithHint
        label="Nome do Produto"
        hint="Este nome aparecerá para o lead na tela de resultado."
        className="space-y-1"
      >
        <Input
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-12 rounded-xl border-gold/20 bg-background/40"
        />
      </FieldWithHint>
      <FieldWithHint
        label="Descrição / Pitch de Vendas"
        hint="Convença o lead de que este é o produto ideal para ele agora."
        className="space-y-1"
      >
        <Textarea
          value={description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="rounded-xl border-gold/20 bg-background/40"
        />
      </FieldWithHint>
      <FieldWithHint
        label="Preço ou Condição Especial"
        hint="Ex: R$ 497 à vista ou 12x de R$ 49,70."
        className="space-y-1"
      >
        <Input
          value={priceHint ?? ""}
          onChange={(e) => onChange({ price_hint: e.target.value })}
          className="h-12 rounded-xl border-gold/20 bg-background/40"
        />
      </FieldWithHint>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Duração da sessão</Label>
          <Input
            placeholder="Ex: 1 hora"
            value={sessionDuration ?? ""}
            onChange={(e) => onChange({ session_duration: e.target.value })}
          />
        </div>
        <div>
          <Label>Duração do plano</Label>
          <Input
            placeholder="Ex: 30 dias"
            value={planDuration ?? ""}
            onChange={(e) => onChange({ plan_duration: e.target.value })}
          />
        </div>
      </div>
      <FieldWithHint
        label="Mensagem de WhatsApp (Contexto do Produto)"
        hint="Esta mensagem aparecerá pronta para o lead enviar quando for qualificado para este produto. Use {{nome}} para o primeiro nome dele."
        className="space-y-0"
        hintClassName="mb-1.5"
      >
        <Textarea
          value={whatsappTemplate ?? ""}
          onChange={(e) => onChange({ whatsapp_template: e.target.value })}
          rows={3}
          placeholder="Ex: Olá! Acabei de fazer o diagnóstico e quero saber mais sobre a mentoria..."
        />
      </FieldWithHint>
      <div>
        <Label>URL de mídia de resultado (opcional)</Label>
        <Input
          value={resultMediaUrl ?? ""}
          onChange={(e) => onChange({ result_media_url: e.target.value })}
        />
      </div>
    </>
  );
};
