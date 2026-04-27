import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock do useCurrentTenant — controla qual tenant o hook enxerga em cada teste.
const mockUseCurrentTenant = vi.fn();
vi.mock("@/hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => mockUseCurrentTenant(),
}));

import { usePlanLimits } from "@/hooks/usePlanLimits";

describe("usePlanLimits — RBAC core", () => {
  beforeEach(() => {
    mockUseCurrentTenant.mockReset();
  });

  it("free: bloqueia analytics, campaigns, themes; mostra selo Axtor; max 3 blocos", () => {
    mockUseCurrentTenant.mockReturnValue({ current: { plan: "free" } });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current.plan).toBe("free");
    expect(result.current.isFree).toBe(true);
    expect(result.current.canUseAnalytics).toBe(false);
    expect(result.current.canUseCampaigns).toBe(false);
    expect(result.current.canUseThemes).toBe(false);
    expect(result.current.showBadge).toBe(true);
    expect(result.current.limits.max_blocks).toBe(3);
  });

  it("pro: libera tudo; some o selo; blocos ilimitados", () => {
    mockUseCurrentTenant.mockReturnValue({ current: { plan: "pro" } });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current.plan).toBe("pro");
    expect(result.current.isFree).toBe(false);
    expect(result.current.canUseAnalytics).toBe(true);
    expect(result.current.canUseCampaigns).toBe(true);
    expect(result.current.canUseThemes).toBe(true);
    expect(result.current.showBadge).toBe(false);
    expect(result.current.limits.max_blocks).toBeGreaterThan(100);
  });

  it("partner: bypass — herda PRO mesmo sem ser plano pago padrão", () => {
    mockUseCurrentTenant.mockReturnValue({ current: { plan: "partner" } });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current.canUseAnalytics).toBe(true);
    expect(result.current.showBadge).toBe(false);
  });

  it("tester: bypass — herda PRO", () => {
    mockUseCurrentTenant.mockReturnValue({ current: { plan: "tester" } });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current.canUseAnalytics).toBe(true);
    expect(result.current.showBadge).toBe(false);
  });

  it("canAddBlock respeita o limite — free com 3 blocos não pode mais", () => {
    mockUseCurrentTenant.mockReturnValue({ current: { plan: "free" } });
    const { result: at3 } = renderHook(() => usePlanLimits(3));
    expect(at3.current.canAddBlock).toBe(false);
    expect(at3.current.blocksRemaining).toBe(0);

    const { result: at2 } = renderHook(() => usePlanLimits(2));
    expect(at2.current.canAddBlock).toBe(true);
    expect(at2.current.blocksRemaining).toBe(1);
  });

  it("sem tenant (não autenticado): cai pro fallback free defensivo", () => {
    mockUseCurrentTenant.mockReturnValue({ current: null });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current.isFree).toBe(true);
    expect(result.current.canUseAnalytics).toBe(false);
  });
});
