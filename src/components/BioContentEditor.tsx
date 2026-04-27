import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBioContent, type BioConfig } from "@/hooks/useBioContent";
import { useUserTier } from "@/hooks/useUserTier";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { BioMockupPreview } from "@/components/BioMockupPreview";

/**
 * Onda 3 v2 Fase 3 — Editor da Bio (sub-bloco "Conteúdo" da aba Bio do Painel).
 *
 * Edita: display_name, headline, sub_headline, avatar (upload).
 * CRUD: bio_blocks (add, delete, edit label/url).
 * Limite: respeita plan_features.max_bio_blocks (3 pro Free, ∞ pro Pro+).
 *
 * NÃO mexe no Admin.tsx antigo. Usa as mesmas tabelas do banco.
 * Convive com /admin antigo até a migração estar completa.
 */
export const BioContentEditor = ({ tenantId, slug }: { tenantId: string; slug: string }) => {
  const {
    config,
    blocks,
    loading,
    saveConfig,
    savingConfig,
    uploadAvatar,
    uploadingAvatar,
    addBlock,
    addingBlock,
    updateBlock,
    deleteBlock,
  } = useBioContent(tenantId);

  const { isAdmin, currentPlan } = useUserTier();
  const { features } = usePlanFeatures(currentPlan);

  const [draft, setDraft] = useState<BioConfig | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (config) setDraft(config);
    else if (tenantId && !config && !loading) {
      // Tenant sem bio_config (caso edge): cria estrutura draft em memória
      setDraft({
        tenant_id: tenantId,
        display_name: null,
        headline: null,
        sub_headline: null,
        avatar_url: null,
      });
    }
  }, [config, tenantId, loading]);

  if (loading || !draft) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  const maxBlocks = isAdmin ? Infinity : features.max_bio_blocks;
  const activeBlocksCount = blocks.length;
  const canAddBlock = activeBlocksCount < maxBlocks;
  const isDirtyConfig = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSaveConfig = async () => {
    try {
      await saveConfig({
        display_name: draft.display_name,
        headline: draft.headline,
        sub_headline: draft.sub_headline,
        avatar_url: draft.avatar_url,
      });
      toast.success("Bio salva.");
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      setDraft((d) => (d ? { ...d, avatar_url: url } : d));
      toast.success("Foto enviada — clique Salvar pra publicar.");
    } catch (err) {
      toast.error(`Falha no upload: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddBlock = async () => {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error("Preencha texto e URL do link.");
      return;
    }
    if (!canAddBlock) {
      toast.error(`Limite de ${maxBlocks} blocos atingido. Faça upgrade pra mais.`);
      return;
    }
    try {
      await addBlock({ label: newLabel.trim(), url: newUrl.trim(), kind: "link" });
      setNewLabel("");
      setNewUrl("");
      toast.success("Bloco adicionado.");
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    }
  };

  const handleUpdateBlock = async (id: string, patch: { label?: string; url?: string }) => {
    try {
      await updateBlock({ id, patch });
    } catch (e) {
      toast.error(`Falha ao atualizar: ${(e as Error).message}`);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteBlock(id);
      toast.success("Bloco removido.");
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Coluna esquerda: editor */}
      <div className="space-y-6">
        {/* Card 1 — Identidade da bio */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-display text-lg">Identidade</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Foto, nome e headline que aparecem no topo da sua bio pública.
            </p>
          </div>

          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {draft.avatar_url ? (
                <img
                  src={draft.avatar_url}
                  alt="avatar"
                  className="h-16 w-16 shrink-0 rounded-full border border-gold object-cover object-top"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                  foto
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadAvatar}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-3.5 w-3.5" /> Trocar foto
                    </>
                  )}
                </Button>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Quadrada de preferência. Máx 5MB.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Nome (display)</Label>
              <Input
                id="display_name"
                value={draft.display_name ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, display_name: e.target.value || null })
                }
                placeholder="Como quer ser chamado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline (1 linha)</Label>
              <Input
                id="headline"
                value={draft.headline ?? ""}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value || null })}
                placeholder="O que você faz em uma frase."
                maxLength={140}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_headline">Sub-headline (parágrafo curto)</Label>
              <Textarea
                id="sub_headline"
                value={draft.sub_headline ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, sub_headline: e.target.value || null })
                }
                placeholder="Detalhe opcional. Aparece embaixo da headline."
                rows={3}
                maxLength={300}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => config && setDraft(config)}
                disabled={!isDirtyConfig || savingConfig}
              >
                Descartar
              </Button>
              <Button onClick={handleSaveConfig} disabled={!isDirtyConfig || savingConfig}>
                {savingConfig ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
                  </>
                ) : (
                  "Salvar identidade"
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Card 2 — Blocos da bio */}
        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg">Links da bio</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Botões clicáveis que aparecem na sua bio.
              </p>
            </div>
            <span className="rounded-full border border-gold/40 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
              {activeBlocksCount} / {maxBlocks === Infinity ? "∞" : maxBlocks}
            </span>
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-xs text-muted-foreground">
              Nenhum bloco ainda. Adicione embaixo.
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <BlockRow
                  key={b.id}
                  initialLabel={b.label}
                  initialUrl={b.url}
                  onPatch={(patch) => handleUpdateBlock(b.id, patch)}
                  onDelete={() => handleDeleteBlock(b.id)}
                />
              ))}
            </div>
          )}

          {/* Form de adicionar bloco */}
          <div className="mt-6 space-y-3 border-t border-border/40 pt-4">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Adicionar novo bloco
            </Label>
            {canAddBlock ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Texto do botão (ex: WhatsApp)"
                  className="sm:flex-1"
                />
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://…"
                  className="sm:flex-1"
                />
                <Button
                  onClick={handleAddBlock}
                  disabled={addingBlock || !newLabel.trim() || !newUrl.trim()}
                >
                  {addingBlock ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-md border border-gold/40 bg-gold/5 p-4">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div className="text-xs text-muted-foreground">
                  Você atingiu o limite de <strong className="text-gold">{maxBlocks}</strong>{" "}
                  blocos do plano Free. Faça upgrade pro Pro pra ter blocos ilimitados.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Coluna direita: preview ao vivo */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <BioMockupPreview config={draft} blocks={blocks} slug={slug} />
      </div>
    </div>
  );
};

// =============================================================================
// Linha de bloco — edita label/url inline com debounce de save
// =============================================================================

const BlockRow = ({
  initialLabel,
  initialUrl,
  onPatch,
  onDelete,
}: {
  initialLabel: string;
  initialUrl: string;
  onPatch: (patch: { label?: string; url?: string }) => void;
  onDelete: () => void;
}) => {
  const [label, setLabel] = useState(initialLabel);
  const [url, setUrl] = useState(initialUrl);

  // Re-sincroniza quando dados externos mudarem (ex: edição em outra aba)
  useEffect(() => {
    setLabel(initialLabel);
    setUrl(initialUrl);
  }, [initialLabel, initialUrl]);

  const labelChanged = label !== initialLabel;
  const urlChanged = url !== initialUrl;
  const dirty = labelChanged || urlChanged;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card/30 p-3 sm:flex-row sm:items-center">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => labelChanged && onPatch({ label })}
        placeholder="Texto"
        className="sm:flex-1"
      />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => urlChanged && onPatch({ url })}
        placeholder="URL"
        className="sm:flex-1"
      />
      <div className="flex items-center gap-2">
        {dirty && (
          <span className="text-[10px] uppercase tracking-widest text-gold">não salvo</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Remover bloco"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
