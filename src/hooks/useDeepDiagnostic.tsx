import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export type DeepFunnel = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  briefing: any;
  welcome_text: string | null;
  welcome_media_url: string | null;
  welcome_media_type: string | null;
  result_intro: string | null;
  lock_until_media_ends: boolean;
  allow_skip_after_seconds: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const useDeepDiagnostic = () => {
  const { current } = useCurrentTenant();
  const [hasAddon, setHasAddon] = useState<boolean | null>(null);
  const [funnels, setFunnels] = useState<DeepFunnel[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!current) {
      setHasAddon(null);
      setFunnels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: addonData }, { data: funnelData }] = await Promise.all([
        supabase.rpc("has_addon", { _tenant_id: current.id, _addon_slug: "deep_diagnostic" }),
        supabase
          .from("deep_funnels")
          .select("*")
          .eq("tenant_id", current.id)
          .order("created_at", { ascending: false }),
      ]);
      setHasAddon(!!addonData);
      setFunnels((funnelData as DeepFunnel[] | null) ?? []);
    } catch (err) {
      console.error("[useDeepDiagnostic] failed:", err);
    } finally {
      setLoading(false);
    }
  }, [current]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { hasAddon, funnels, loading, refresh, tenantId: current?.id ?? null };
};