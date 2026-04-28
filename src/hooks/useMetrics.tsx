import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Onda 3 v2 Fase 6 — métricas agregadas do tenant.
 * Chama RPC `get_tenant_funnel_metrics` que retorna JSON com totais agregados.
 * Cache 60s — métricas não precisam ser tempo real.
 */

export type MetricsPeriod = "today" | "7d" | "30d" | "year";

export type MetricsSummary = {
  period_from: string;
  period_to: string;
  total_leads: number;
  total_diagnostics: number;
  total_deep_diagnostics: number;
  total_bio_clicks: number;
  total_page_views: number;
  total_clientes: number;
  error?: string;
};

const FALLBACK: MetricsSummary = {
  period_from: new Date().toISOString(),
  period_to: new Date().toISOString(),
  total_leads: 0,
  total_diagnostics: 0,
  total_deep_diagnostics: 0,
  total_bio_clicks: 0,
  total_page_views: 0,
  total_clientes: 0,
};

const periodToRange = (period: MetricsPeriod): { from: Date; to: Date } => {
  const to = new Date();
  const from = new Date(to);
  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "year":
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  return { from, to };
};

export const useMetrics = (tenantId: string | null, period: MetricsPeriod) => {
  const query = useQuery({
    queryKey: ["metrics", tenantId, period],
    queryFn: async (): Promise<MetricsSummary> => {
      if (!tenantId) return FALLBACK;
      const { from, to } = periodToRange(period);
      const { data, error } = await supabase.rpc("get_tenant_funnel_metrics" as never, {
        _tenant_id: tenantId,
        _from: from.toISOString(),
        _to: to.toISOString(),
      } as never);
      if (error) {
        console.warn("[useMetrics] RPC error:", error);
        return FALLBACK;
      }
      return (data as unknown as MetricsSummary) ?? FALLBACK;
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  return {
    metrics: query.data ?? FALLBACK,
    loading: query.isLoading,
    refetching: query.isFetching && !query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
