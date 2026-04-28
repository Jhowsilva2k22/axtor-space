import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  User,
  Layout,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantMedia, type TenantMedia } from "@/hooks/useTenantMedia";

/**
 * Onda 3 v2 Fase 5 (Aba 4) — banco de mídia organizado por tipo.
 *
 * Fluxo de upload:
 *   1. User clica "Nova imagem".
 *   2. Modal pergunta o tipo (avatar/banner/logo/genérica).
 *   3. User escolhe arquivo.
 *   4. Upload com compressão + tag de tipo.
 *
 * Filtros: chips por tipo. Cada thumbnail mostra badge do tipo.
 * Pro+ only (gate aplicado no Painel).
 */

type MediaType = TenantMedia["type"];

const TYPE_LABEL: Record<MediaType, string> = {
  image: "Genérica",
  logo: "Logo",
  banner: "Banner / Capa",
  avatar: "Foto de perfil",
};

const TYPE_HINT: Record<MediaType, string> = {
  image: "Foto livre pra usar em qualquer bloco.",
  logo: "Logotipo pequeno (ex: marca, parceiro).",
  banner: "Imagem grande pra capa de bio ou seção.",
  avatar: "Foto de pessoa em formato quadrado.",
};

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  image: <Sparkles className="h-3.5 w-3.5" />,
  logo: <ImageIcon className="h-3.5 w-3.5" />,
  banner: <Layout className="h-3.5 w-3.5" />,
  avatar: <User className="h-3.5 w-3.5" />,
};

const FILTERS: { value: MediaType | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "avatar", label: "Perfis" },
  { value: "banner", label: "Banners" },
  { value: "logo", label: "Logos" },
  { value: "image", label: "Genéricas" },
];

export const MediaGallery = ({ tenantId }: { tenantId: string }) => {
  const { items, loading, upload, uploading, remove, removing } = useTenantMedia(tenantId);
  const [filter, setFilter] = useState<MediaType | "all">("all");
  const [pendingType, setPendingType] = useState<MediaType | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = items.filter((it) => filter === "all" || it.type === filter);

  const handleStartUpload = (type: MediaType) => {
    setPendingType(type);
    // Pequeno delay pra modal fechar antes do file picker abrir.
    setTimeout(() => {
      fileRef.current?.click();
    }, 100);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingType) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Aceita apenas imagens.");
      e.currentTarget.value = "";
      return;
    }
    try {
      await upload({ file, type: pendingType });
      toast.success(`${TYPE_LABEL[pendingType]} adicionada.`);
    } catch (err) {
      toast.error(`Falha no upload: ${(err as Error).message}`);
    } finally {
      setPendingType(null);
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

  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Banco de mídia</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Galeria organizada por tipo. Reutilize fotos em diferentes blocos, capas e funis.
            Compressão automática reduz peso sem perder qualidade.
          </p>
        </div>
        <Button
          onClick={() => setPickerOpen(true)}
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

      {/* Input file invisível controlado pelo modal */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Modal pra escolher tipo antes do upload */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Que tipo de imagem você vai subir?</DialogTitle>
            <DialogDescription>
              Organiza o banco e facilita escolher depois nos blocos da bio.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {(Object.keys(TYPE_LABEL) as MediaType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  handleStartUpload(t);
                }}
                className="flex w-full items-start gap-3 rounded-sm border border-border bg-card/30 p-3 text-left transition hover:border-gold hover:bg-gradient-gold-soft"
              >
                <span className="mt-0.5 text-gold">{TYPE_ICONS[t]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{TYPE_LABEL[t]}</p>
                  <p className="text-[11px] text-muted-foreground">{TYPE_HINT[t]}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const count =
            f.value === "all" ? items.length : items.filter((it) => it.type === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition ${
                filter === f.value
                  ? "border-gold bg-gradient-gold-soft text-primary"
                  : "border-border bg-card/30 text-muted-foreground hover:border-gold/40"
              }`}
            >
              {f.label}
              <span className="rounded-sm bg-background/40 px-1.5 py-0.5 text-[9px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-muted-foreground/30 p-12 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">
            {filter === "all" ? "Nenhuma imagem ainda" : `Nenhuma ${TYPE_LABEL[filter as MediaType].toLowerCase()}`}
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            Adicione imagens pra reutilizar nos blocos da bio, capas e funis. Cada uma fica
            disponível pra você escolher depois.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-card/30"
            >
              <img
                src={item.url}
                alt={item.file_name ?? "imagem"}
                className="h-full w-full object-cover object-top transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Badge do tipo */}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm border border-gold/40 bg-background/80 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-primary backdrop-blur">
                {TYPE_ICONS[item.type]}
                {TYPE_LABEL[item.type]}
              </span>

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
