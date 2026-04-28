import { useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CreatePaymentResult } from "@/hooks/useStoreCheckout";

/**
 * Onda 4 Fase 6 — modal de checkout Pix.
 * Mostra QR Code + copia-e-cola gerado pela Edge Function.
 *
 * UX:
 *  - Header com valor e descrição
 *  - QR Code grande (PNG base64)
 *  - Botão "Copiar código Pix" (copia-e-cola pra cola na app do banco)
 *  - Link "Abrir fatura" (alternativa via browser)
 *  - Hint sobre confirmação automática via webhook
 */
export const PixCheckoutModal = ({
  open,
  onOpenChange,
  data,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: CreatePaymentResult | null;
  loading: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    if (!data?.qrCodeText) return;
    try {
      await navigator.clipboard.writeText(data.qrCodeText);
      setCopied(true);
      toast.success("Código Pix copiado.");
    } catch {
      toast.error("Não consegui copiar — selecione manualmente abaixo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-gold" />
            Pagamento via Pix
          </DialogTitle>
          <DialogDescription>
            {data?.descricao ?? "Carregando…"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Erro ao gerar cobrança. Tenta de novo.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Valor */}
            <div className="rounded-md border border-gold/30 bg-gradient-gold-soft p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Valor a pagar
              </p>
              <p className="mt-1 font-display text-3xl text-primary">
                {data.valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>

            {/* QR Code */}
            {data.qrCode ? (
              <div className="flex justify-center rounded-md border border-border bg-white p-4">
                <img
                  src={`data:image/png;base64,${data.qrCode}`}
                  alt="QR Code Pix"
                  className="h-56 w-56"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-muted-foreground/30">
                <p className="text-xs text-muted-foreground">QR Code indisponível</p>
              </div>
            )}

            {/* Copia-e-cola */}
            {data.qrCodeText && (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleCopy}
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" /> Copiar código Pix
                    </>
                  )}
                </Button>
                <p className="break-all rounded-sm border border-border bg-card/30 p-2 text-[10px] font-mono text-muted-foreground">
                  {data.qrCodeText}
                </p>
              </div>
            )}

            {/* Link fatura */}
            {data.invoiceUrl && (
              <a
                href={data.invoiceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-gold/40 bg-card/40 px-4 py-2 text-[11px] uppercase tracking-widest text-gold transition hover:bg-gradient-gold-soft"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir fatura no Asaas
              </a>
            )}

            <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Após o pagamento, sua assinatura será ativada automaticamente em até 1 minuto.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
