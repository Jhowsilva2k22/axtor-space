import { useUserTier } from "@/hooks/useUserTier";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

/**
 * Onda 3 v2 — guard de acesso a aba do Painel.
 *
 * Regras:
 *   - Admin (Joanderson) sempre passa em qualquer aba.
 *   - Owner do tenant: passa se a aba está em plan_features.allowed_tabs do plano dele.
 *   - Sem tenant ativo: nega.
 *
 * Não chama a RPC `can_user_access_tab` por aba pra evitar N round-trips —
 * deriva localmente de plan_features (cacheada). A RPC fica disponível pra
 * checagens server-side (Edge Functions, integrações).
 */
export const useCanAccessTab = (tabName: string) => {
  const { isAdmin, currentPlan, loading: tierLoading } = useUserTier();
  const { features, loading: featuresLoading } = usePlanFeatures(currentPlan);

  const loading = tierLoading || featuresLoading;

  if (isAdmin) {
    return { canAccess: true, loading, reason: "admin" as const };
  }

  if (!currentPlan) {
    return { canAccess: false, loading, reason: "no_tenant" as const };
  }

  const canAccess = features.allowed_tabs.includes(tabName);
  return {
    canAccess,
    loading,
    reason: canAccess ? ("plan_allows" as const) : ("plan_blocks" as const),
  };
};
