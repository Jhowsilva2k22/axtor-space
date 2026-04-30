import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadWithCrop } from "@/components/ImageUploadWithCrop";
import { MediaUrlPicker } from "@/components/imersivo/atomic/MediaUrlPicker";
import { ReviewSectionCard } from "@/components/imersivo/atomic/ReviewSectionCard";
import { SwitchField } from "@/components/imersivo/atomic/SwitchField";

type ReviewBoasVindasCardProps = {
  funnel: any;
  onFunnelChange: (patch: Partial<any>) => void;
  activeFunnelId: string | null;
};

export const ReviewBoasVindasCard = ({
  funnel,
  onFunnelChange,
  activeFunnelId,
}: ReviewBoasVindasCardProps) => {
  return (
    <ReviewSectionCard title="Boas-vindas e regras">
      <div className="space-y-3">
        <div>
          <Label>Texto de boas-vindas</Label>
          <Textarea
            value={funnel.welcome_text ?? ""}
            onChange={(e) => onFunnelChange({ welcome_text: e.target.value })}
            rows={3}
          />
        </div>
        <div>
          <Label>Texto de introdução do resultado</Label>
          <Textarea
            value={funnel.result_intro ?? ""}
            onChange={(e) => onFunnelChange({ result_intro: e.target.value })}
            rows={2}
          />
        </div>
        <SwitchField
          label="Travar opções até o vídeo/áudio terminar"
          hint="Aplica-se a perguntas com mídia"
          checked={!!funnel.lock_until_media_ends}
          onCheckedChange={(v) => onFunnelChange({ lock_until_media_ends: v })}
        />
        <div>
          <Label>Permitir pular após (segundos)</Label>
          <Input
            type="number"
            min={0}
            value={funnel.allow_skip_after_seconds ?? 5}
            onChange={(e) =>
              onFunnelChange({ allow_skip_after_seconds: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="rounded-md border border-gold/30 bg-gold/5 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gold">
              Identidade de Autoridade
            </p>
            <p className="text-[10px] text-gold/60">
              Configurações para o funil:{" "}
              <span className="font-bold">{funnel.name}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Label className="text-[10px] uppercase tracking-wider">
                Sincronizar Global
              </Label>
              <Switch
                checked={!!funnel.briefing?.use_global_bio}
                onCheckedChange={(v) =>
                  onFunnelChange({
                    briefing: { ...funnel.briefing, use_global_bio: v },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-gold/10">
          {funnel.briefing?.use_global_bio ? (
            <div className="rounded bg-gold/10 p-3 text-center">
              <p className="text-xs text-gold/80 italic">
                ✨ Sincronização Ativa: Este funil está usando a foto e os dados da sua marca global (Bio).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gold/20 border border-gold/30 p-2.5 rounded-md mb-2">
                <p className="text-[10px] text-gold font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                  Modo Exclusivo Ativo
                </p>
                <p className="text-[9px] text-gold/80 mt-1 leading-relaxed">
                  As alterações abaixo afetam <strong>apenas este diagnóstico</strong>. Para usar uma foto diferente em outro funil, basta abrir o editor dele e repetir este processo.
                </p>
              </div>
              <div>
                <Label className="mb-2 block font-medium">
                  Foto de Autoridade Exclusiva
                </Label>
                <ImageUploadWithCrop
                  value={funnel.briefing?.bio_image_url ?? ""}
                  onChange={(url) =>
                    onFunnelChange({
                      briefing: { ...funnel.briefing, bio_image_url: url },
                    })
                  }
                  folder={`funnels/${activeFunnelId}`}
                />
              </div>
            </div>
          )}
          <div className="mt-4 border-t border-gold/5 pt-4">
            <div className="flex items-center justify-between mb-1">
              <Label>Texto da Bio (Quem é você...)</Label>
              <span className="text-[9px] uppercase bg-gold/10 px-2 py-0.5 rounded text-gold/80">
                Exclusivo deste Funil
              </span>
            </div>
            <Textarea
              placeholder="Stefany Mello é estrategista de posicionamento..."
              value={funnel.briefing?.bio_text ?? ""}
              onChange={(e) =>
                onFunnelChange({
                  briefing: { ...funnel.briefing, bio_text: e.target.value },
                })
              }
              rows={5}
              className="mt-1"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Este conteúdo aparece na seção de autoridade antes da oferta principal.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          Tela de obrigado (fallback global)
        </p>
        <p className="text-xs text-muted-foreground">
          Usado quando um produto não tem tela de obrigado própria.
        </p>
        <div>
          <Label>Texto</Label>
          <Textarea
            placeholder="Ex: Compra confirmada! Em alguns minutos você recebe o acesso por e-mail."
            value={funnel.thankyou_text ?? ""}
            onChange={(e) => onFunnelChange({ thankyou_text: e.target.value })}
            rows={3}
          />
        </div>
        <MediaUrlPicker
          variant="plain"
          urlValue={funnel.thankyou_media_url ?? ""}
          onUrlChange={(v) => onFunnelChange({ thankyou_media_url: v })}
          typeValue={funnel.thankyou_media_type ?? ""}
          onTypeChange={(v) => onFunnelChange({ thankyou_media_type: v })}
        />
      </div>
    </ReviewSectionCard>
  );
};
