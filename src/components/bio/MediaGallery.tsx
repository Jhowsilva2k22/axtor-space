import { useRef } from "react";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenantMedia, type TenantMedia } from "@/hooks/useTenantMedia";

/**
 * Onda 3 v2 Fase 5 (Aba 4) — banco de mídia do tenant.
 * Grid de thumbnails + upload com compressão automática + delete.
 * Pro+ only (gate aplicado no Painel via useCanAccessTab).
 */
export const MediaGallery = ({ tenantId }: { tenantId: string }) => {
  const { items, loading, upload, uploading, remove, removing } = useTenantMedia(tenantId);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Aceita apenas imagens.");
      e.currentTarget.value = "";
      return;
    }
    try {
      await upload({ file, type: "image" });
      toast.success("Imagem enviada.");
    } catch (err) {
      toast.error(`Falha no upload: ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (item: TenantMedia) => {
    if (!confirm("Excluir essa imagem do banco?")) return;
    try {
      await remove(item);
      toast.success("Imagem removida.");
    } catch (err) {
      toast.error(`Falha: ${(err as Error).message}`);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada.");
    } catch {
      toast.error("Não consegui copiar — selecione manualmente.");
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Banco de mídia</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Galeria de imagens do tenant. Reutilize fotos em diferentes blocos, capas e funis.
            Compressão automática reduz peso sem perder qualidade visual.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-luxe h-10 rounded-sm px-4 text-[10px] uppercase tracking-[0.2em]"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-3.5 w-3.5" /> Nova imagem
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-muted-foreground/30 p-12 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Nenhuma imagem ainda</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Adicione imagens pra reutilizar nos blocos da bio, capas e funis.
            Cada imagem fica disponível pra você escolher onde quiser.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-card/30"
            >
              <img
                src={item.url}
                alt={item.file_name ?? "imagem"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(item.url)}
                  className="rounded-sm border border-gold/40 bg-background/80 px-2 py-1 text-[10px] uppercase tracking-widest text-primary backdrop-blur hover:bg-background"
                  title="Copiar URL"
                >
                  copiar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={removing}
                  className="rounded-sm border border-destructive/40 bg-background/80 p-1.5 text-destructive backdrop-blur hover:bg-destructive/10"
                  title="Excluir"
                  aria-label="Excluir imagem"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
