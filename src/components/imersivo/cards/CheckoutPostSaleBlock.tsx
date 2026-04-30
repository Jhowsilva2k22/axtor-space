import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldWithHint } from "@/components/imersivo/atomic/FieldWithHint";
import { MediaUrlPicker } from "@/components/imersivo/atomic/MediaUrlPicker";

type CheckoutPostSaleBlockProps = {
  ctaMode: string;
  checkoutUrl: string;
  thankyouText: string;
  thankyouMediaUrl: string;
  thankyouMediaType: string;
  thankyouWhatsappTemplate: string;
  funnelSlug?: string;
  productId: string;
  onChange: (patch: Record<string, any>) => void;
};

export const CheckoutPostSaleBlock = ({
  ctaMode,
  checkoutUrl,
  thankyouText,
  thankyouMediaUrl,
  thankyouMediaType,
  thankyouWhatsappTemplate,
  funnelSlug,
  productId,
  onChange,
}: CheckoutPostSaleBlockProps) => {
  const mode = ctaMode ?? "whatsapp";

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Checkout & Pós-venda</p>
      <FieldWithHint
        label="Modo de Chamada para Ação (CTA)"
        hint="Escolha como o lead deve finalizar a compra."
        className="space-y-1"
        labelClassName="text-primary/80"
        hintClassName="text-primary/60"
      >
        <select
          className="flex h-11 w-full rounded-xl border border-primary/20 bg-background/40 px-3 py-2 text-sm"
          value={mode}
          onChange={(e) => onChange({ cta_mode: e.target.value })}
        >
          <option value="whatsapp">Só WhatsApp (atendimento manual)</option>
          <option value="checkout">Só checkout (Venda direta automática)</option>
          <option value="both">Híbrido (Comprar + Tirar dúvida)</option>
        </select>
      </FieldWithHint>
      {(mode === "checkout" || mode === "both") && (
        <FieldWithHint
          label="URL do checkout (Link de Pagamento)"
          hint="Seu link da Kiwify, Greenn, Hotmart, etc."
          className="space-y-1"
          labelClassName="text-primary/80"
          hintClassName="text-primary/60"
        >
          <Input
            placeholder="https://pay..."
            value={checkoutUrl ?? ""}
            onChange={(e) => onChange({ checkout_url: e.target.value })}
            className="h-11 rounded-xl border-primary/20 bg-background/40"
          />
          <p className="mt-1 text-[9px] text-muted-foreground leading-tight italic">
            DICA: Configure o <strong>Pós-venda</strong> na sua plataforma para este link:{" "}
            <code className="rounded bg-primary/10 px-1 font-mono">https://axtor.space/obrigado/{funnelSlug}?p={productId}</code>
          </p>
        </FieldWithHint>
      )}
      <FieldWithHint
        label="Texto da tela de obrigado (opcional)"
        hint="Sobrescreve o texto padrão da tela de agradecimento. Use {{nome}} para personalizar."
        className="space-y-1"
      >
        <Textarea
          placeholder="Sobrescreve o fallback do funil. Use {{nome}} pra personalizar."
          value={thankyouText ?? ""}
          onChange={(e) => onChange({ thankyou_text: e.target.value })}
          rows={3}
          className="rounded-xl border-gold/20 bg-background/40"
        />
      </FieldWithHint>
      <MediaUrlPicker
        urlLabel="Mídia de obrigado (URL)"
        urlHint="Vídeo ou imagem de parabéns após a compra."
        typeLabel="Tipo de Mídia"
        typeHint="Formato da mídia acima."
        fieldClassName="space-y-1"
        urlValue={thankyouMediaUrl ?? ""}
        onUrlChange={(v) => onChange({ thankyou_media_url: v })}
        typeValue={thankyouMediaType ?? ""}
        onTypeChange={(v) => onChange({ thankyou_media_type: v })}
      />
      <FieldWithHint
        label="Mensagem WhatsApp pós-compra (opcional)"
        hint="Mensagem que o lead envia após finalizar o checkout."
        className="space-y-1"
      >
        <Textarea
          placeholder="Ex: Oi! Acabei de comprar X, qual o próximo passo?"
          value={thankyouWhatsappTemplate ?? ""}
          onChange={(e) => onChange({ thankyou_whatsapp_template: e.target.value })}
          rows={2}
          className="rounded-xl border-gold/20 bg-background/40"
        />
      </FieldWithHint>
    </div>
  );
};
