import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCredits, FUNNEL_COST } from "@/hooks/useCredits";

/**
 * Modal de bloqueio — aparece quando o DONO tenta uma ação de IA (gerar funil)
 * sem saldo suficiente. Mostra o custo, o saldo atual e a data de renovação,
 * e oferece recarregar ou fazer upgrade (leva pra Loja).
 */
export const CreditsBlockModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { credits } = useCredits();
  const renova = credits?.periodEnd
    ? new Date(credits.periodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <DialogTitle className="pt-3 text-center">
            Créditos insuficientes
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground">
          Gerar um funil com IA custa {FUNNEL_COST} créditos
          {credits ? ` e você tem ${credits.total}` : ""}.
          {renova ? ` Sua cota do plano renova em ${renova}.` : ""}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            to="/loja"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-bold text-primary-foreground"
          >
            Recarregar créditos
          </Link>
          <Link
            to="/loja?plan=premium"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-gold/30 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            Fazer upgrade
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
