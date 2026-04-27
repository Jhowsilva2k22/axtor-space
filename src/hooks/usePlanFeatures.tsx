import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Onda 3 v2 — fonte da verdade dos recursos por plano.
 * Lê da tabela `plan_features` (RLS read TO authenticated).
 *
 * Cache 5 min: plan_features muda raramente.
 * Fallback defensivo: se a tabela ainda não existe (rollout em ondas),
 * cai num default seguro (free).
 */

export type PlanFeatures = {
  plan_slug: string;
  max_bio_blocks: number;
  show_axtor_badge: boolean;
  can_buy_addons: boolean;
  allowed_tabs: string[];
  price_monthly: number | null;
  price_semestral: number | null;
  price_annual: number | null;
};

const FALLBACK_FREE: PlanFeatures = {
  plan_slug: "free",
  max_bio_blocks: 3,
  show_axtor_badge: true,
  can_buy_addons: false,
  allowed_tabs: ["captura", "bio", "metricas"],
  price_monthly: 0,
  price_semestral: null,
  price_annual: null,
};

const FALLBACK_PRO: PlanFeatures = {
  plan_slug: "pro",
  max_bio_blocks: 9999,
  show_axtor_badge: false,
  can_buy_addons: true,
  allowed_tabs: ["captura", "bio", "imersivo", "imagens", "metricas", "integracoes"],
  price_monthly: 47,
  price_semestral: null,
  price_annual: null,
};

const fallbackByPlan = (planSlug: string | null): PlanFeatures => {
  const isPaidLike = planSlug === "pro" || planSlug === "partner" || planSlug === "tester" || planSlug === "owner";
  return isPaidLike
    ? { ...FALLBACK_PRO, plan_slug: planSlug ?? "pro" }
    : FALLBACK_FREE;
};

export const usePlanFeatures = (planSlug: string | null) => {
  const query = useQuery({
    queryKey: ["planFeatures", planSlug],
    queryFn: async (): Promise<PlanFeatures> => {
      if (!planSlug) return FALLBACK_FREE;

      const { data, error } = await supabase
        .from("plan_features" as never)
        .select("*")
        .eq("plan_slug", planSlug)
        .maybeSingle();

      if (error) {
        console.warn("[usePlanFeatures] erro ao ler plan_features, usando fallback:", error);
        return fallbackByPlan(planSlug);
      }

      if (!data) {
        console.warn("[usePlanFeatures] plan_features não tem linha pra:", planSlug);
        return fallbackByPlan(planSlug);
      }

      return data as unknown as PlanFeatures;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: planSlug !== null,
  });

  return {
    features: query.data ?? fallbackByPlan(planSlug),
    loading: query.isLoading,
    error: query.error,
  };
};
