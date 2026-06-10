// Helpers de créditos — usados pelas edge functions (rodam com service_role,
// que é o único papel autorizado a debitar/conceder).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/** Saldo total disponível (cota do plano + avulso). 0 quando não há registro. */
export async function peekCredits(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("tenant_credits")
    .select("plan_balance, topup_balance")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) {
    console.error("[credits] peek error:", error.message);
    return 0;
  }
  if (!data) return 0;
  return (data.plan_balance ?? 0) + (data.topup_balance ?? 0);
}

/**
 * Débito atômico via RPC consume_credits (trava a linha no banco).
 * Retorna true se debitou, false se faltou saldo. Nunca lança.
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  tenantId: string,
  amount: number,
  reason: string,
  ref?: string | null,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_credits", {
    p_tenant: tenantId,
    p_amount: amount,
    p_reason: reason,
    p_ref: ref ?? null,
  });
  if (error) {
    console.error("[credits] consume error:", error.message);
    return false;
  }
  return data === true;
}
