import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

/**
 * Card de saldo de créditos do tenant (header do Painel).
 * - Mostra saldo total e a data de renovação da cota do plano.
 * - Quando o saldo fica baixo (<= 6, custo de 1 funil), acende em âmbar e
 *   oferece "Recarregar" (leva pra Loja).
 * - `compact`: variante chip pra app bar mobile — uma linha só, denso.
 * Leitura via useCredits (RLS libera o dono ler o próprio saldo).
 */
export const CreditsCard = ({ compact = false }: { compact?: boolean }) => {
  const { credits, isLoading } = useCredits();

  // Enquanto carrega ou se não houver registro de saldo, não renderiza nada
  // (evita piscar "0 créditos" antes de ler).
  if (isLoading || !credits) return null;

  const renova = credits.periodEnd
    ? new Date(credits.periodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : null;

  // Contas internas (dono/sócio/tester) têm cota gigante — mostra "Ilimitado"
  // em vez do número cru.
  const unlimited = credits.total >= 100000;

  // Chip compacto (app bar mobile): saldo + renovação numa linha só.
  if (compact) {
    return (
      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 ${
          credits.low
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-gold/20 bg-card/40"
        }`}
      >
        <Zap
          className={`h-3.5 w-3.5 flex-shrink-0 ${
            credits.low ? "text-amber-400" : "text-gold"
          }`}
        />
        <span className="text-xs font-bold leading-none">
          {unlimited
            ? "Ilimitado"
            : `${credits.total} ${credits.total === 1 ? "crédito" : "créditos"}`}
        </span>
        {!unlimited && renova && (
          <span className="text-xs leading-none text-muted-foreground">
            · {renova}
          </span>
        )}
        {credits.low && (
          <Link
            to="/loja"
            className="ml-1 inline-flex h-6 items-center rounded-full bg-gradient-to-br from-primary to-primary-glow px-3 text-[11px] font-bold leading-none text-primary-foreground"
          >
            Recarregar
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${
        credits.low
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-gold/20 bg-card/40"
      }`}
    >
      <Zap
        className={`h-4 w-4 flex-shrink-0 ${
          credits.low ? "text-amber-400" : "text-gold"
        }`}
      />
      <div className="leading-tight">
        <p className="text-sm font-bold">
          {unlimited
            ? "Ilimitado"
            : `${credits.total} ${credits.total === 1 ? "crédito" : "créditos"}`}
        </p>
        {!unlimited && renova && (
          <p className="text-xs text-muted-foreground">renova em {renova}</p>
        )}
      </div>
      {credits.low && (
        <Link
          to="/loja"
          className="ml-1 inline-flex h-8 items-center rounded-full bg-gradient-to-br from-primary to-primary-glow px-4 text-[11px] font-bold text-primary-foreground"
        >
          Recarregar
        </Link>
      )}
    </div>
  );
};
