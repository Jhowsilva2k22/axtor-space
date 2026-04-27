import { useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, QrCode, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Onda 3 v2 Fase 3 — utilitários do header do Painel.
 * Disponível pra todo plano (Free + Pro+):
 *   - Ver minha bio (abre /{slug} em nova aba)
 *   - QR Code (modal com PNG da URL pública pra download)
 *   - Toggle Dark/Light
 */
export const PainelHeaderActions = ({ slug }: { slug: string }) => {
  const bioUrl = `${window.location.origin}/${slug}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 text-xs uppercase tracking-widest text-gold backdrop-blur transition-all hover:border-gold hover:shadow-gold"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Ver minha bio
      </a>

      <QRCodeButton bioUrl={bioUrl} slug={slug} />

      <ThemeToggle />
    </div>
  );
};

const QRCodeButton = ({ bioUrl, slug }: { bioUrl: string; slug: string }) => {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleOpen = async (next: boolean) => {
    setOpen(next);
    if (next && !dataUrl) {
      setGenerating(true);
      try {
        const url = await QRCode.toDataURL(bioUrl, {
          width: 480,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setDataUrl(url);
      } catch (e) {
        toast.error("Não consegui gerar o QR.");
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${slug}-axtor-qr.png`;
    a.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bioUrl);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não consegui copiar — copia manual no campo abaixo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-gold/40 bg-card/60 text-gold hover:border-gold hover:shadow-gold"
          aria-label="Ver QR Code da bio"
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code da sua bio</DialogTitle>
          <DialogDescription>
            Escaneia com a câmera ou compartilha em material gráfico.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {generating || !dataUrl ? (
            <div className="flex h-60 w-60 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              Gerando…
            </div>
          ) : (
            <img
              src={dataUrl}
              alt={`QR Code de ${bioUrl}`}
              className="h-60 w-60 rounded-md border border-border bg-white p-2"
            />
          )}

          <p className="break-all text-center text-xs text-muted-foreground">{bioUrl}</p>

          <div className="flex w-full gap-2">
            <Button onClick={handleCopyLink} variant="outline" className="flex-1">
              <Copy className="mr-2 h-3.5 w-3.5" /> Copiar link
            </Button>
            <Button onClick={handleDownload} disabled={!dataUrl} className="flex-1">
              <Download className="mr-2 h-3.5 w-3.5" /> Baixar PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
