import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cleanCPF, formatCPF, isValidCPF } from "@/lib/cpfValidator";

/**
 * Onda 4 Fase 6 — Modal de coleta de dados antes do Pix.
 *
 * Substitui o `prompt()` que pedia CPF de forma rude. Aqui:
 *  - Nome completo (pré-preenche com display_name do tenant)
 *  - CPF (com máscara + validação local dos dígitos)
 *  - Email (read-only, vem da auth)
 *  - Checkbox de consentimento LGPD (obrigatório)
 *
 * Botão "Gerar Pix" só ativa quando os 3 campos válidos + checkbox marcado.
 *
 * Ao confirmar, dispara `onSubmit` com os dados — o componente pai chama
 * a Edge Function de checkout em sequência.
 */

export type PaymentSubmitData = {
  customerName: string;
  customerCpf: string; // já limpo (só dígitos)
  customerEmail: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultName?: string;
  defaultEmail?: string;
  loading?: boolean;
  onSubmit: (data: PaymentSubmitData) => void;
};

export const PaymentDataModal = ({
  open,
  onOpenChange,
  defaultName = "",
  defaultEmail = "",
  loading = false,
  onSubmit,
}: Props) => {
  const [name, setName] = useState(defaultName);
  const [cpf, setCpf] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState({ name: false, cpf: false });

  // Reseta o form sempre que o modal abre — evita guardar dado entre tentativas
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setCpf("");
      setConsent(false);
      setTouched({ name: false, cpf: false });
    }
  }, [open, defaultName]);

  const cpfClean = cleanCPF(cpf);
  const nameValid = name.trim().length >= 5;
  const cpfValid = isValidCPF(cpf);
  const canSubmit = nameValid && cpfValid && consent && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      customerName: name.trim(),
      customerCpf: cpfClean,
      customerEmail: defaultEmail,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pra emitir o Pix</DialogTitle>
          <DialogDescription>
            Confira seus dados. Usaremos apenas pra gerar a cobrança.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-name" className="text-xs uppercase tracking-widest">
              Nome completo
            </Label>
            <Input
              id="payment-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Seu nome como no documento"
              disabled={loading}
              maxLength={120}
              className="text-sm"
            />
            {touched.name && !nameValid && (
              <p className="text-[11px] text-destructive">
                Informe seu nome completo (mínimo 5 caracteres).
              </p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-cpf" className="text-xs uppercase tracking-widest">
              CPF
            </Label>
            <Input
              id="payment-cpf"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, cpf: true }))}
              placeholder="000.000.000-00"
              disabled={loading}
              maxLength={14}
              className="text-sm font-mono"
            />
            {touched.cpf && cpfClean.length > 0 && !cpfValid && (
              <p className="text-[11px] text-destructive">
                CPF inválido. Confira os dígitos.
              </p>
            )}
          </div>

          {/* Email read-only */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-email" className="text-xs uppercase tracking-widest">
              E-mail
            </Label>
            <Input
              id="payment-email"
              type="email"
              value={defaultEmail}
              readOnly
              disabled
              className="text-sm bg-muted/30 text-muted-foreground"
            />
            <p className="text-[10px] text-muted-foreground">
              Pra trocar, atualize seu cadastro nas configurações.
            </p>
          </div>

          {/* Consentimento LGPD */}
          <div className="flex items-start gap-2 rounded-md border border-border bg-card/30 p-3">
            <Checkbox
              id="payment-consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              disabled={loading}
              className="mt-0.5"
            />
            <Label
              htmlFor="payment-consent"
              className="text-[11px] leading-relaxed text-muted-foreground cursor-pointer"
            >
              Concordo com o uso dos meus dados (nome, CPF e e-mail) apenas para
              emitir esta cobrança Pix e enviar o comprovante. Posso solicitar
              exclusão a qualquer momento. Veja a{" "}
              <a
                href="/privacidade"
                target="_blank"
                rel="noreferrer noopener"
                className="text-gold hover:underline"
              >
                política de privacidade
              </a>
              .
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit} className="btn-luxe">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…
                </>
              ) : (
                "Gerar Pix"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
