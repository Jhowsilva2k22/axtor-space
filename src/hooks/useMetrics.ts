import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MetricsPeriod = "today" | "7d" | "30d" | "year";

type Metrics = {
  total_leads: number;
  total_diagnostics: number;
  total_deep_diagnostics: number;
  total_bio_clicks: number;
  total_page_views: number;
  total_clientes: number;
};

const EMPTY_METRICS: Metrics = {
  total_leads: 0,
  total_diagnostics: 0,
  total_deep_diagnostics: 0,
  total_bio_clicks: 0,
  total_page_views: 0,
  total_clientes: 0,
};

function periodStart(period: MetricsPeriod): string {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
  }
}

export function useMetrics(tenantId: string, period: MetricsPeriod) {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);

  const fetchMetrics = useCallback(
    async (isRefetch = false) => {
      if (isRefetch) {
        setRefetching(true);
      } else {
        setLoading(true);
      }

      const from = periodStart(period);

      const [leads, diagnostics, deepDiag, bioClicks, pageViews] = await Promise.all([
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", from),
        supabase
          .from("diagnostics")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", from),
        supabase
          .from("deep_diagnostics")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", from),
        supabase
          .from("bio_clicks")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", from),
        supabase
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", from),
      ]);

      const totalLeads = leads.count ?? 0;
      const totalDeepDiag = deepDiag.count ?? 0;

      setMetrics({
        total_leads: totalLeads,
        total_diagnostics: diagnostics.count ?? 0,
        total_deep_diagnostics: totalDeepDiag,
        total_bio_clicks: bioClicks.count ?? 0,
        total_page_views: pageViews.count ?? 0,
        total_clientes: totalLeads + totalDeepDiag,
      });

      if (isRefetch) {
        setRefetching(false);
      } else {
        setLoading(false);
      }
    },
    [tenantId, period],
  );

  useEffect(() => {
    fetchMetrics(false);
  }, [fetchMetrics]);

  const refetch = useCallback(() => fetchMetrics(true), [fetchMetrics]);

  return { metrics, loading, refetching, refetch };
}
