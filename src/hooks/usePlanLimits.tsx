import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export type PlanLimits = {
  max_blocks: number;
  analytics: boolean;
  campaigns: boolean;
  improvements: boolean;
  themes: boolean;
  show_badge: boolean;
};

const DEFAULT_FREE: PlanLimits = {
  max_blocks: 3,
  analytics: false,
  campaigns: false,
  improvements: false,
  themes: false,
  show_badge: true,
};

const PRO: PlanLimits = {
  max_blocks: 9999,
  analytics: true,
  campaigns: true,
  improvements: true,
  themes: true,
  show_badge: false,
};

export const usePlanLimits = (activeBlocksCount = 0) => {
  const { current } = useCurrentTenant();
  // current.plan_limits pode vir do tipo gerado; fallback por plano
  const raw = (current as any)?.plan_limits as Partial<PlanLimits> | undefined;
  const planName = current?.plan ?? "free";
  const isPaidLike = planName === "pro" || planName === "partner" || planName === "tester";
  const fallback = isPaidLike ? PRO : DEFAULT_FREE;
  const limits: PlanLimits = { ...fallback, ...(raw ?? {}) };

  const isFree = current?.plan === "free" || !current;

  return {
    plan: current?.plan ?? "free",
    isFree,
    limits,
    canAddBlock: activeBlocksCount < limits.max_blocks,
    blocksRemaining: Math.max(0, limits.max_blocks - activeBlocksCount),
    canUseAnalytics: limits.analytics,
    canUseCampaigns: limits.campaigns,
    canUseImprovements: limits.improvements,
    canUseThemes: limits.themes,
    showBadge: limits.show_badge,
  };
};