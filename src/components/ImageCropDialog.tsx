import { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, RotateCw, ZoomIn } from "lucide-react";

type Props = {
  /** File ou URL pra editar. Quando muda, o dialog abre. */
  file: File | null;
  /** Proporção do crop. Ex: 1 (quadrado), 16/9, undefined (livre). */
  aspect?: number;
  /** Forma da máscara — só visual. */
  cropShape?: "rect" | "round";
  title?: string;
  /** Chamado quando o usuário confirma o crop. Recebe um Blob JPEG. */
  onConfirm: (blob: Blob) => Promise<void> | void;
  /** Fechar sem salvar. */
  onCancel: () => void;
};

/**
 * Carrega a imagem, recorta a região selecionada e devolve um Blob JPEG.
 * Faz a saída no tamanho real do crop (não reescala aqui — a compressão
 * final é feita por compressImage() depois).
 */
async function getCroppedBlob(imageSrc: string, area: Area, rotation = 0): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Falha ao carregar imagem"));
    img.src = imageSrc;
  });

  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bBoxW = image.width * cos + image.height * sin;
  const bBoxH = image.width * sin + image.height * cos;

  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = bBoxW;
  rotCanvas.height = bBoxH;
  const rotCtx = rotCanvas.getContext("2d")!;
  rotCtx.imageSmoothingQuality = "high";
  rotCtx.translate(bBoxW / 2, bBoxH / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const out = document.createElement("canvas");
  out.width = Math.round(area.width);
  out.height = Math.round(area.height);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Coordenadas do crop relativas ao canvas rotacionado
  const sx = (bBoxW - image.width) / 2 + area.x;
  const sy = (bBoxH - image.height) / 2 + area.y;
  ctx.drawImage(rotCanvas, sx, sy, area.width, area.height, 0, 0, area.width, area.height);

  return await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), "image/jpeg", 0.95);
  });
}

export default function ImageCropDialog({
  file,
  aspect = 1,
  cropShape = "rect",
  title = "Ajustar imagem",
  onConfirm,
  onCancel,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setCroppedArea(areaPx);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea, rotation);
      await onConfirm(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="max-w-2xl border-gold/40 bg-background/95 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4 h-[55vh] min-h-[320px] w-full overflow-hidden bg-black/60">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          )}
        </div>

        <div className="space-y-4 px-6 pb-2 pt-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={4}
              step={0.05}
              onValueChange={(v) => setZoom(v[0] ?? 1)}
              className="flex-1"
            />
            <span className="w-10 text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {zoom.toFixed(1)}x
            </span>
          </div>
          <div className="flex items-center gap-3">
            <RotateCw className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[rotation]}
              min={-180}
              max={180}
              step={1}
              onValueChange={(v) => setRotation(v[0] ?? 0)}
              className="flex-1"
            />
            <span className="w-10 text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {rotation}°
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
            className="rounded-sm border border-border text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedArea}
            className="rounded-sm bg-gradient-gold-soft text-[11px] uppercase tracking-[0.2em] text-primary hover:shadow-gold"
          >
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            {busy ? "Processando..." : "Aplicar e enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}