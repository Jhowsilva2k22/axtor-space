import { useEffect, useRef, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

type Props = {
  url: string;
  slug: string;
  trigger?: ReactNode;
};

const SIZE = 1024;            // PNG export size (high-res)
const PREVIEW_SIZE = 320;     // Visual preview
const LOGO_RATIO = 0.22;      // Logo occupies ~22% of canvas

/**
 * Desenha "A" da Axtor no centro com badge dourada arredondada.
 * Sem dependência de imagem externa — render via canvas mesmo.
 */
const drawLogo = (ctx: CanvasRenderingContext2D, size: number) => {
  const logoSize = size * LOGO_RATIO;
  const cx = size / 2;
  const cy = size / 2;
  const radius = logoSize / 2;

  // Badge dourada com gradiente
  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  grad.addColorStop(0, "#d4a84a");
  grad.addColorStop(0.5, "#f0d78c");
  grad.addColorStop(1, "#a8842c");

  // Recorte branco em volta da badge pra não conflitar com QR
  const padding = logoSize * 0.12;
  ctx.fillStyle = "#ffffff";
  const fullRadius = radius + padding;
  ctx.beginPath();
  ctx.arc(cx, cy, fullRadius, 0, Math.PI * 2);
  ctx.fill();

  // Badge gold
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Borda escura sutil
  ctx.strokeStyle = "rgba(15,15,15,0.4)";
  ctx.lineWidth = Math.max(2, size * 0.003);
  ctx.stroke();

  // Letra "A" central
  ctx.fillStyle = "#0d0d0d";
  ctx.font = `bold ${logoSize * 0.62}px "Playfair Display", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", cx, cy + logoSize * 0.04);
};

const buildPngDataUrl = async (url: string, size: number): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "H", // alta correção pra suportar logo central
    color: { dark: "#0d0d0d", light: "#ffffff" },
  });
  const ctx = canvas.getContext("2d");
  if (ctx) drawLogo(ctx, size);
  return canvas.toDataURL("image/png");
};

const buildSvgString = async (url: string): Promise<string> => {
  // SVG puro do QR + overlay manual <circle> + <text> com a letra A
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0d0d0d", light: "#ffffff" },
  });
  // Insere overlay antes do </svg>
  const logoOverlay = `
    <defs>
      <linearGradient id="axtor-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d4a84a"/>
        <stop offset="50%" stop-color="#f0d78c"/>
        <stop offset="100%" stop-color="#a8842c"/>
      </linearGradient>
    </defs>
    <g>
      <circle cx="50%" cy="50%" r="14%" fill="#ffffff"/>
      <circle cx="50%" cy="50%" r="11%" fill="url(#axtor-gold)" stroke="#0d0d0d" stroke-opacity="0.4" stroke-width="0.3"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="Playfair Display, Georgia, serif" font-weight="bold"
        font-size="14" fill="#0d0d0d" dy="0.5">A</text>
    </g>`;
  return svg.replace("</svg>", `${logoOverlay}</svg>`);
};

export const QRCodeDialog = ({ url, slug, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const previewBuilt = useRef(false);

  useEffect(() => {
    if (!open) {
      previewBuilt.current = false;
      setPreviewSrc(null);
      return;
    }
    if (previewBuilt.current) return;
    previewBuilt.current = true;
    setLoading(true);
    buildPngDataUrl(url, PREVIEW_SIZE)
      .then((src) => setPreviewSrc(src))
      .catch(() => toast.error("erro ao gerar QR"))
      .finally(() => setLoading(false));
  }, [open, url]);

  const downloadPng = async () => {
    try {
      const dataUrl = await buildPngDataUrl(url, SIZE);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `axtor-${slug}-qr.png`;
      a.click();
      toast.success("PNG baixado");
    } catch {
      toast.error("falha ao baixar PNG");
    }
  };

  const downloadSvg = async () => {
    try {
      const svg = await buildSvgString(url);
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `axtor-${slug}-qr.svg`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("SVG baixado");
    } catch {
      toast.error("falha ao baixar SVG");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft mr-[49px] px-[116px]">
            QR Code <QrCode className="h-3.5 w-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-sm border-gold bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            QR <span className="text-gold italic">code</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <div className="flex h-[340px] w-[340px] items-center justify-center rounded-sm border border-gold/40 bg-white p-3">
            {loading || !previewSrc ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <img src={previewSrc} alt={`QR Code de ${url}`} className="h-full w-full" />
            )}
          </div>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">aponta pra</p>
            <p className="mt-1 break-all font-mono text-xs text-primary/90">{url}</p>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            use no cartão, story, panfleto. logo Axtor centralizada com correção de erro alta — escaneia mesmo coberta.
          </p>

          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              onClick={downloadPng}
              className="btn-luxe h-11 rounded-sm text-[11px] uppercase tracking-[0.2em]"
            >
              <Download className="h-3.5 w-3.5" /> PNG
            </Button>
            <Button
              onClick={downloadSvg}
              variant="outline"
              className="h-11 rounded-sm border-gold bg-card/40 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-gradient-gold-soft"
            >
              <Download className="h-3.5 w-3.5" /> SVG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};