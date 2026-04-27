import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCaptureConfig,
  type CaptureConfig,
  type ButtonStyle,
  type LeadDestinationType,
} from "@/hooks/useCaptureConfig";

const STYLE_LABELS: Record<ButtonStyle, string> = {
  "gold-pulse": "Dourado pulsante (CTA comercial)",
  "green-pulse": "Verde pulsante (contato humano)",
  flat: "Sólido (sem animação)",
};

const DESTINATION_LABELS: Record<LeadDestinationType, string> = {
  crm: "CRM externo (URL/webhook)",
  sheet: "Google Sheets / planilha",
  email: "Notificação por e-mail",
  whatsapp: "Mensagem direta no WhatsApp",
};

const DESTINATION_HINT: Record<LeadDestinationType, string> = {
  crm: "URL do webhook do seu CRM (ex: HubSpot, Pipedrive).",
  sheet: "URL da planilha (Apps Script ou serviço como SheetMonkey).",
  email: "E-mail que recebe os leads (separado por vírgula se múltiplos).",
  whatsapp: "Número internacional (ex: 5511999999999) sem espaços.",
};

export const CaptureConfigForm = ({ tenantId }: { tenantId: string }) => {
  const { config, loading, error, save, saving } = useCaptureConfig(tenantId);
  const [draft, setDraft] = useState<CaptureConfig | null>(null);

  // Sincroniza draft sempre que config carrega/muda
  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  if (loading || !draft) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-destructive">
          Não consegui carregar a config: {(error as Error).message}
        </p>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      await save(draft);
      toast.success("Config salva.");
    } catch (e) {
      toast.error(`Falha ao salvar: ${(e as Error).message}`);
    }
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

  return (
    <Card className="p-8">
      <div className="mb-6">
        <h2 className="font-display text-xl">Configuração da Captura</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Personalize o botão CTA do diagnóstico de Instagram e pra onde os leads são enviados.
        </p>
      </div>

      <div className="space-y-6">
        {/* button_label */}
        <div className="space-y-2">
          <Label htmlFor="button_label">Texto do botão</Label>
          <Input
            id="button_label"
            value={draft.button_label}
            onChange={(e) => setDraft({ ...draft, button_label: e.target.value })}
            placeholder="Quero meu diagnóstico gratuito"
            maxLength={80}
          />
          <p className="text-[10px] text-muted-foreground">
            Aparece no botão principal do funil. Máx 80 caracteres.
          </p>
        </div>

        {/* button_style */}
        <div className="space-y-2">
          <Label htmlFor="button_style">Estilo do botão</Label>
          <Select
            value={draft.button_style}
            onValueChange={(v) => setDraft({ ...draft, button_style: v as ButtonStyle })}
          >
            <SelectTrigger id="button_style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STYLE_LABELS) as ButtonStyle[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STYLE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* lead_destination_type */}
        <div className="space-y-2">
          <Label htmlFor="lead_destination_type">Destino do lead</Label>
          <Select
            value={draft.lead_destination_type}
            onValueChange={(v) =>
              setDraft({ ...draft, lead_destination_type: v as LeadDestinationType })
            }
          >
            <SelectTrigger id="lead_destination_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DESTINATION_LABELS) as LeadDestinationType[]).map((d) => (
                <SelectItem key={d} value={d}>
                  {DESTINATION_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* lead_destination_url */}
        <div className="space-y-2">
          <Label htmlFor="lead_destination_url">
            {draft.lead_destination_type === "email"
              ? "E-mail de destino"
              : draft.lead_destination_type === "whatsapp"
                ? "Número do WhatsApp"
                : "URL de destino"}
          </Label>
          <Input
            id="lead_destination_url"
            value={draft.lead_destination_url ?? ""}
            onChange={(e) => setDraft({ ...draft, lead_destination_url: e.target.value || null })}
            placeholder={DESTINATION_HINT[draft.lead_destination_type]}
          />
          <p className="text-[10px] text-muted-foreground">
            {DESTINATION_HINT[draft.lead_destination_type]}
          </p>
        </div>

        {/* cta_redirect_url */}
        <div className="space-y-2">
          <Label htmlFor="cta_redirect_url">URL de redirecionamento após captura (opcional)</Label>
          <Input
            id="cta_redirect_url"
            value={draft.cta_redirect_url ?? ""}
            onChange={(e) => setDraft({ ...draft, cta_redirect_url: e.target.value || null })}
            placeholder="https://exemplo.com/obrigado"
          />
          <p className="text-[10px] text-muted-foreground">
            Opcional. Se vazio, mostra a tela de loading + diagnóstico padrão.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2 border-t border-border/40 pt-6">
          <Label>Pré-visualização</Label>
          <div className="rounded-md border border-border/40 bg-muted/30 p-6">
            <div className="flex justify-center">
              <button
                type="button"
                disabled
                className={previewClassName(draft.button_style)}
              >
                {draft.button_label || "Texto do botão"}
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 border-t border-border/40 pt-6">
          <Button
            variant="ghost"
            onClick={() => config && setDraft(config)}
            disabled={!isDirty || saving}
          >
            Descartar
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const previewClassName = (style: ButtonStyle): string => {
  const base =
    "inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition";
  switch (style) {
    case "gold-pulse":
      return `${base} animate-gold-pulse bg-gold text-black`;
    case "green-pulse":
      return `${base} animate-green-pulse bg-emerald-500 text-white`;
    case "flat":
    default:
      return `${base} bg-primary text-primary-foreground`;
  }
};
