import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

/**
 * Resumo do tier do user logado.
 * Onda 3 v2 — base do RBAC. Composição de useAuth + useCurrentTenant.
 *
 * Não chama a RPC `get_user_tier_summary` por economia de round-trip:
 * isAdmin já vem de useAuth e tenants já vem de useCurrentTenant.
 * A RPC fica disponível pra usos server-side (Edge Functions, integrações).
 */
export type UserTier = {
  isAdmin: boolean;
  loading: boolean;
  currentPlan: string | null;
  currentTenantId: string | null;
};

export const useUserTier = (): UserTier => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { current, loading: tenantLoading } = useCurrentTenant();

  return {
    isAdmin,
    loading: authLoading || tenantLoading,
    currentPlan: current?.plan ?? null,
    currentTenantId: current?.id ?? null,
  };
};
