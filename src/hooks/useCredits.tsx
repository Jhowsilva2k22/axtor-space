import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

// Custo de gerar um funil — definido na edge function generate-deep-funnel
// (retorna 402 {error:"no_credits", needed:6} quando o saldo não cobre).
// Serve de limiar pro alerta "saldo baixo" e pro bloqueio.
export const FUNNEL_COST = 6;

export type Credits = {
  planBalance: number; // cota do plano (reseta no mês)
  topupBalance: number; // créditos avulsos comprados (acumulam)
  total: number; // saldo disponível total
  periodEnd: string | null; // data em que a cota do plano renova (ISO date)
  low: boolean; // true quando o saldo não cobre mais 1 funil (<= 6)
};

/**
 * Lê o saldo de créditos do tenant atual.
 *
 * Segurança: a RLS `tenant_credits_owner_select` permite o DONO ler a própria
 * linha, então isso roda com a anon key sem expor nada de terceiros. A escrita
 * (consume/grant/add) é só do service_role nas edge functions — o cliente não
 * consegue se dar crédito.
 *
 * Obs: `tenant_credits` é tabela recente e pode não estar nos tipos gerados do
 * Supabase ainda — por isso o cast, padrão já usado em outras partes do projeto.
 */
export function useCredits() {
  const { current } = useCurrentTenant();
  const tenantId = current?.id ?? null;

  const query = useQuery({
    queryKey: ["credits", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<Credits> => {
      const { data, error } = await (supabase as any)
        .from("tenant_credits")
        .select("plan_balance, topup_balance, period_end")
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      if (error) throw error;
      const planBalance = data?.plan_balance ?? 0;
      const topupBalance = data?.topup_balance ?? 0;
      const total = planBalance + topupBalance;
      return {
        planBalance,
        topupBalance,
        total,
        periodEnd: data?.period_end ?? null,
        low: total <= FUNNEL_COST,
      };
    },
  });

  return { ...query, credits: query.data ?? null };
}
