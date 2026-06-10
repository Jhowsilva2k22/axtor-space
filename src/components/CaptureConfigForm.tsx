import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { CaptureSetupChecklist } from "@/components/CaptureSetupChecklist";
import ImageCropDialog from "@/components/ImageCropDialog";

const STYLE_LABELS: Record<ButtonStyle, string> = {
  "gold-pulse": "Dourado pulsante (CTA comercial)",
  "green-pulse": "Verde pulsante (contato humano)",
  flat: "Sólido (sem animação)",
};

const DESTINATION_LABELS: Record<LeadDestinationType, string> = {
  crm: "CRM externo (URL/webhook)",
  sheet: "Google Sheets / planilha",
  email: "Notificação por e-mail",
  whatsapp: "Mensagem no WhatsApp (em breve)",
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const uploadCaptureBlob = async (blob: Blob) => {
    if (blob.size > 5 * 1024 * 1024) {
      toast.error("Imagem maior que 5MB.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const path = `capture/avatar-${Date.now()}.jpg`;
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setDraft((d) => (d ? { ...d, capture_avatar_url: pub.publicUrl } : d));
      toast.success("Foto enviada — clique Salvar pra publicar.");
    } catch (e) {
      toast.error(`Falha no upload: ${(e as Error).message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

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

  const hasHeadline = !!(draft.capture_headline);
  const hasBio = !!(draft.capture_sub_headline);
  const hasTagline = !!(draft.capture_tagline);

  return (
    <>
    <Card className="p-8">
      <div className="mb-6">
        <h2 className="font-display text-xl">Configuração da Captura</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Controle total do conteúdo e do botão CTA da sua página de captura, separado do Link na Bio.
        </p>
      </div>

      <CaptureSetupChecklist
        hasHeadline={hasHeadline}
        hasBio={hasBio}
        hasTagline={hasTagline}
      />

      <div className="space-y-6">
        {/* ── CONTEÚDO DA PÁGINA ── */}
        <div className="space-y-4 rounded-lg border border-border/40 bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Conteúdo da página
          </p>

          {/* capture_avatar_url */}
          <div className="space-y-2">
            <Label>Foto da página de captura</Label>
            <div className="flex items-center gap-4">
              {draft.capture_avatar_url ? (
                <img
                  src={draft.capture_avatar_url}
                  alt="foto captura"
                  className="h-16 w-16 shrink-0 rounded-full border border-gold/40 object-cover"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-full border border-dashed border-gold/40 bg-muted/20" />
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-gold/40 bg-card/40 px-4 text-[10px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gold/10">
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploadingPhoto ? "Enviando..." : "Enviar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setPendingPhotoFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {draft.capture_avatar_url && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? { ...d, capture_avatar_url: null } : d))}
                    className="text-left text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Foto exibida no card de autoridade da capture page. Se vazio, usa a foto da bio.
            </p>
          </div>

          {/* capture_headline */}
          <div className="space-y-2">
            <Label htmlFor="capture_headline">Headline (quem você é)</Label>
            <Input
              id="capture_headline"
              value={draft.capture_headline ?? ""}
              onChange={(e) => setDraft({ ...draft, capture_headline: e.target.value || null })}
              placeholder="é especialista em X e ajuda Y a conquistar Z"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground">
              Exibida na seção de autoridade da captura. Se vazio, usa a headline do Link na Bio como fallback.
            </p>
          </div>

          {/* capture_sub_headline */}
          <div className="space-y-2">
            <Label htmlFor="capture_sub_headline">Sub-headline (parágrafos de bio)</Label>
            <Textarea
              id="capture_sub_headline"
              value={draft.capture_sub_headline ?? ""}
              onChange={(e) => setDraft({ ...draft, capture_sub_headline: e.target.value || null })}
              placeholder={"Linha 1 sobre sua trajetória.\n\nLinha 2 com a transformação que você entrega."}
              rows={4}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Parágrafos separados por linha em branco. Fallback para sub-headline do Link na Bio.
            </p>
          </div>

          {/* capture_tagline */}
          <div className="space-y-2">
            <Label htmlFor="capture_tagline">Tagline (frase de efeito)</Label>
            <Input
              id="capture_tagline"
              value={draft.capture_tagline ?? ""}
              onChange={(e) => setDraft({ ...draft, capture_tagline: e.target.value || null })}
              placeholder="Para quem entendeu que presença digital não é sobre estar online."
              maxLength={300}
            />
            <p className="text-[10px] text-muted-foreground">
              Frase em itálico exibida no card de autoridade. Deixe vazio para usar o texto padrão.
            </p>
          </div>
        </div>

        {/* ── BOTÃO CTA ── */}
        <div className="space-y-4 rounded-lg border border-border/40 bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Botão e destino do lead
          </p>

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
                <SelectItem key={d} value={d} disabled={d === "whatsapp"}>
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
        </div>{/* ── fim Botão e destino do lead ── */}

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

      <ImageCropDialog
        file={pendingPhotoFile}
        aspect={1}
        cropShape="rect"
        cropRadius="16%"
        title="Ajustar foto da capture page"
        onConfirm={async (blob) => {
          setPendingPhotoFile(null);
          await uploadCaptureBlob(blob);
        }}
        onCancel={() => setPendingPhotoFile(null)}
      />
    </>
  );
};

const previewClassName = (style: ButtonStyle): string => {
  const base =
    "inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition";
  switch (style) {
    case "gold-pulse":
      return `${base} animate-gold-pulse btn-luxe`;
    case "green-pulse":
      return `${base} animate-green-pulse bg-emerald-500 text-white`;
    case "flat":
    default:
      return `${base} bg-primary text-primary-foreground`;
  }
};
